import { Children, Fragment, isValidElement, cloneElement, useEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal, type AuthTab } from "./AuthModal";
import { PulseAIOnboarding } from "./PulseAIOnboarding";

const STARTER_QUESTIONS: { q: string; label: string; icon: JSX.Element }[] = [
  {
    q: "What's the difference between premium and regular processing?",
    label: "Premium vs regular processing?",
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>),
  },
  {
    q: "How long does an RFE typically take to resolve?",
    label: "How long does an RFE take?",
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>),
  },
  {
    q: "What documents do I need for my I-129 petition?",
    label: "Documents needed for I-129?",
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg>),
  },
  {
    q: "Can I travel while my H1B petition is pending?",
    label: "Travel while H1B pending?",
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>),
  },
  {
    q: "My case says 'Case Was Received' — what's next?",
    label: "\"Case Received\" — what now?",
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>),
  },
  {
    q: "What are my options if I'm not selected in FY2027?",
    label: "Not selected — what now?",
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" /></svg>),
  },
];

type NewsItem = { src: string; title: string; time: string; isNew?: boolean; url?: string };

const FALLBACK_NEWS: NewsItem[] = [
  { isNew: true, title: "USCIS announces H1B cap reached for FY2027 — second selection unlikely", src: "Reuters", time: "12m ago" },
  { isNew: true, title: "Premium processing fee increases to $2,905 effective May 1", src: "Forbes", time: "2h ago" },
  { isNew: false, title: "Judge pauses new H1B visa rule implementation pending review", src: "WSJ", time: "5h ago" },
  { isNew: false, title: "Tech layoffs slow — H1B transfer rate rebounds 12% in Q1", src: "Bloomberg", time: "1d ago" },
];

type ChatMessage = { role: "user" | "assistant"; content: string; citations?: string[]; followups?: string[] };

const ANON_LIMIT = 5;
const AUTH_LIMIT = 15;
const STORAGE_KEY = "pulse_ai_usage";

const PENDING_STATUSES = new Set(["filed_awaiting_receipt", "case_received", "actively_reviewed", "not_yet_filed"]);

function loadUsage(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const { day, count } = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    return day === today ? Number(count) || 0 : 0;
  } catch {
    return 0;
  }
}

function saveUsage(count: number) {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: today, count }));
}

function hostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function isRecentTime(time: string): boolean {
  return /^\d+[mh] ago$/.test(time);
}

// Walks through ReactMarkdown's rendered children and replaces `[n]` /
// `[n][m]` patterns inside text nodes with superscript citation links.
// Recurses into nested elements (e.g. <strong>, <em>) so citations work
// anywhere in the prose, not just at paragraph level.
function citationize(node: ReactNode, citations: string[]): ReactNode {
  if (typeof node === "string") {
    if (!/\[\d+\]/.test(node)) return node;
    const tokens = node.split(/(\[\d+\](?:\[\d+\])*)/g);
    return tokens.map((tok, i) => {
      if (!tok) return null;
      if (/^(\[\d+\])+$/.test(tok)) {
        const nums = Array.from(tok.matchAll(/\[(\d+)\]/g)).map((m) => Number(m[1]));
        return (
          <sup key={i} className="msg-cite">
            {nums.map((n, k) => {
              const url = citations[n - 1];
              return url ? (
                <a key={k} href={url} target="_blank" rel="noreferrer">{n}</a>
              ) : (
                <span key={k}>{n}</span>
              );
            })}
          </sup>
        );
      }
      return <Fragment key={i}>{tok}</Fragment>;
    });
  }
  if (Array.isArray(node)) {
    return node.map((c, i) => <Fragment key={i}>{citationize(c, citations)}</Fragment>);
  }
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    if (props.children !== undefined) {
      return cloneElement(node, {}, citationize(props.children, citations));
    }
  }
  return node;
}

function renderMessage(content: string, citations: string[] = []): JSX.Element {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="msg-p">{citationize(children, citations)}</p>,
        ul: ({ children }) => <ul className="msg-list">{Children.toArray(children)}</ul>,
        ol: ({ children }) => <ol className="msg-list-ordered">{Children.toArray(children)}</ol>,
        li: ({ children }) => <li>{citationize(children, citations)}</li>,
        // Downscale chat-bubble headings so they don't dwarf the surrounding prose.
        h1: ({ children }) => <h4 className="msg-h">{citationize(children, citations)}</h4>,
        h2: ({ children }) => <h4 className="msg-h">{citationize(children, citations)}</h4>,
        h3: ({ children }) => <h5 className="msg-h">{citationize(children, citations)}</h5>,
        h4: ({ children }) => <h5 className="msg-h">{citationize(children, citations)}</h5>,
        h5: ({ children }) => <h6 className="msg-h">{citationize(children, citations)}</h6>,
        h6: ({ children }) => <h6 className="msg-h">{citationize(children, citations)}</h6>,
        table: ({ children }) => (
          <div className="msg-table-wrap">
            <table className="msg-table">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead>{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => <th>{citationize(children, citations)}</th>,
        td: ({ children }) => <td>{citationize(children, citations)}</td>,
        code: ({ children, className }) => {
          const isBlock = /language-/.test(className ?? "");
          return isBlock ? (
            <pre className="msg-pre"><code>{children}</code></pre>
          ) : (
            <code className="msg-code">{children}</code>
          );
        },
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" className="msg-link">{children}</a>
        ),
        blockquote: ({ children }) => <blockquote className="msg-quote">{children}</blockquote>,
        hr: () => <hr className="msg-hr" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

type PulseStats = { total: number; approved: number; pending: number; rfe: number };

export function PulseAITab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [stats, setStats] = useState<PulseStats | null>(null);
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("signup");
  const [showSignupCta, setShowSignupCta] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_FREE = user ? AUTH_LIMIT : ANON_LIMIT;

  useEffect(() => {
    if (user) {
      // signing in clears local counter; server is source of truth
      saveUsage(0);
      setQuestionsAsked(0);
      setShowSignupCta(false);
    } else {
      setQuestionsAsked(loadUsage());
    }
  }, [user?.id]);

  function openSignup() {
    setAuthTab("signup");
    setAuthOpen(true);
  }

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading]);

  // Open onboarding the first time a logged-in user lands on Pulse AI without
  // having completed it. The edge function reads profiles directly, so we
  // don't need to keep the profile in component state after this.
  useEffect(() => {
    if (!user) {
      setOnboardingChecked(false);
      setOnboardingOpen(false);
      return;
    }
    if (onboardingChecked) return;
    let cancelled = false;
    (supabase as any)
      .from("profiles")
      .select("chat_onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { chat_onboarding_completed_at?: string | null } | null }) => {
        if (cancelled) return;
        setOnboardingChecked(true);
        if (!data?.chat_onboarding_completed_at) setOnboardingOpen(true);
      });
    return () => { cancelled = true; };
  }, [user?.id, onboardingChecked]);

  // Fetch real petition stats
  useEffect(() => {
    supabase
      .from("petition_entries")
      .select("status")
      .then(({ data }) => {
        if (!data) return;
        const total = data.length;
        const approved = data.filter((e) => e.status === "approved").length;
        const pending = data.filter((e) => PENDING_STATUSES.has(e.status)).length;
        const rfe = data.filter((e) => e.status === "rfe_received" || e.status === "rfe_responded").length;
        setStats({ total, approved, pending, rfe });
      });
  }, []);

  // Fetch cached news from edge function
  useEffect(() => {
    supabase.functions.invoke("fetch-news").then(({ data }) => {
      if (data?.items?.length > 0) {
        setNews(
          (data.items as { src: string; title: string; time: string; url?: string }[]).map((n) => ({
            src: n.src,
            title: n.title,
            time: n.time,
            isNew: isRecentTime(n.time),
            url: n.url,
          }))
        );
      }
    }).catch(() => {});
  }, []);

  const limitReached = questionsAsked >= MAX_FREE;

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading || limitReached) return;

    setError(null);
    const history = messages.map(({ role, content }) => ({ role, content }));
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ask-pulse", {
        body: { question: q, history },
      });
      // Handle server-side rate limit (FunctionsHttpError -> data may be null, error set)
      const limitInfo = (data && typeof data === "object" && (data as { error?: string }).error === "limit_reached")
        ? (data as { error: string; limit?: number; used?: number; requiresAuth?: boolean })
        : null;

      if (limitInfo || (fnError && fnError.message?.includes("429"))) {
        const requiresAuth = limitInfo?.requiresAuth ?? !user;
        setQuestionsAsked(MAX_FREE);
        saveUsage(MAX_FREE);
        if (requiresAuth) setShowSignupCta(true);
        setMessages(next);
        setError(
          requiresAuth
            ? `You've used your ${ANON_LIMIT} free questions. Sign up to get ${AUTH_LIMIT} per day.`
            : `Daily limit reached (${AUTH_LIMIT}/day). Resets at midnight UTC.`,
        );
        return;
      }

      if (fnError) throw fnError;
      const answer = (data?.answer as string) || "Sorry, I didn't get a response. Try again.";
      const citations = (data?.citations as string[]) || [];
      const followups = (data?.followups as string[]) || [];
      setMessages([...next, { role: "assistant", content: answer, citations, followups }]);
      const newCount = questionsAsked + 1;
      setQuestionsAsked(newCount);
      saveUsage(newCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setMessages(next);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  }

  const showWelcome = messages.length === 0;

  return (
    <section className="pulse-hero">
      <div className="pulse-chat">
        <div className="pulse-header">
          <div className="pulse-avatar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l3-9 4 18 3-9h4" />
            </svg>
          </div>
          <div>
            <div className="pulse-title">
              Pulse <span className="pulse-ai-badge">AI</span>
            </div>
            <div className="pulse-subtitle">Your visa friend, by your side</div>
          </div>
        </div>

        <div className="pulse-body" ref={bodyRef}>
          {showWelcome ? (
            <>
              <div className="pulse-welcome">
                <h1>
                  Hey — <span className="accent-ink">got an H1B question?</span>
                </h1>
                <p>
                  I'm Pulse. I can walk you through the process, explain USCIS terms, decode your receipt notices, and tell you what the crowd is seeing right now. Ask me anything.
                </p>
              </div>

              <div className="suggested">
                {STARTER_QUESTIONS.map((s) => (
                  <button className="chip" key={s.q} onClick={() => ask(s.q)} disabled={loading || limitReached}>
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {messages.map((m, i) => {
                const isLastAssistant = m.role === "assistant" && i === messages.length - 1;
                return (
                  <div className={`msg-row ${m.role === "user" ? "user" : "bot"}`} key={i}>
                    <div className="msg-avatar">{m.role === "user" ? "You" : "P"}</div>
                    <div>
                      <div className="msg-bubble">
                        {m.role === "assistant"
                          ? renderMessage(m.content, m.citations)
                          : <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>}
                      </div>
                      {m.citations && m.citations.length > 0 && (
                        <div className="msg-sources">
                          {m.citations.slice(0, 6).map((url, j) => (
                            <a key={j} href={url} target="_blank" rel="noreferrer" className="msg-source">
                              <span className="src-dot" />
                              {hostname(url)}
                            </a>
                          ))}
                        </div>
                      )}
                      {isLastAssistant && m.followups && m.followups.length > 0 && !limitReached && (
                        <div className="followup-row">
                          {m.followups.map((fq, j) => (
                            <button
                              key={j}
                              className="followup-chip"
                              onClick={() => ask(fq)}
                              disabled={loading}
                            >
                              {fq}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="msg-row bot">
                  <div className="msg-avatar">P</div>
                  <div className="msg-bubble">Thinking…</div>
                </div>
              )}
              {error && !limitReached && (
                <div className="msg-row bot">
                  <div className="msg-avatar">!</div>
                  <div className="msg-bubble" style={{ color: "var(--accent-2, #b00)" }}>{error}</div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="pulse-composer">
          {limitReached ? (
            <div className="composer-cta">
              <div className="cta-text">
                {user ? (
                  <>You've hit your <strong>{AUTH_LIMIT} questions</strong> for today. Resets at midnight UTC.</>
                ) : (
                  <>You've used your <strong>{ANON_LIMIT} free questions</strong>. Sign up to get {AUTH_LIMIT} per day.</>
                )}
              </div>
              {!user && (
                <button className="rd-btn btn-primary" onClick={openSignup}>
                  Sign up free
                </button>
              )}
            </div>
          ) : (
            <div className="composer-wrap">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask Pulse anything about H1B…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={loading}
              />
              <button
                className="send-btn"
                aria-label="Send"
                onClick={() => ask(input)}
                disabled={loading || !input.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          )}
          <div className="composer-meta">
            <span className="pill">⌘ + K to focus</span>
            <span style={{ marginLeft: "auto" }}>Pulse can make mistakes. Verify with myUSCIS.gov.</span>
          </div>
        </div>
      </div>

      <aside className="pulse-side">
        <div className="side-card quick-links-card">
          <h4>Petition Tracker Quick Links</h4>
          <button className="quick-action" onClick={() => navigate("/petition-tracker")}>
            <span className="ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              </svg>
            </span>
            <div className="text"><div className="t">Log my petition</div><div className="d">Takes 30 seconds · anonymous</div></div>
          </button>
          <button className="quick-action" onClick={() => navigate("/petition-tracker")}>
            <span className="ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <div className="text"><div className="t">Look up a petition</div><div className="d">Enter your PT-XXXX code</div></div>
          </button>
        </div>

        <div className="side-card">
          <h4><span className="live-dot" />Today's Pulse</h4>
          <div className="stat-row">
            <span className="label">Total tracked</span>
            <span className="val">{stats ? stats.total.toLocaleString() : "—"}</span>
          </div>
          <div className="stat-row">
            <span className="label">Approved</span>
            <span className="val up">{stats ? `+${stats.approved.toLocaleString()}` : "—"}</span>
          </div>
          <div className="stat-row">
            <span className="label">Pending</span>
            <span className="val">{stats ? stats.pending.toLocaleString() : "—"}</span>
          </div>
          <div className="stat-row">
            <span className="label">RFEs issued</span>
            <span className="val down">{stats ? `+${stats.rfe.toLocaleString()}` : "—"}</span>
          </div>
        </div>

        <div className="side-card">
          <h4>Latest News</h4>
          <div className="news-list">
            {news.map((n, i) => (
              <a
                className={`news-item${n.isNew ? " new" : ""}`}
                key={i}
                href={n.url ?? `https://www.google.com/search?q=${encodeURIComponent(n.title)}&tbm=nws`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="ndot" />
                <div className="content">
                  <div className="title">{n.title}</div>
                  <div className="meta">
                    <span className="src-name">{n.src}</span>
                    <span>·</span>
                    <span>{n.time}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </aside>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialTab={authTab} />
      {user && (
        <PulseAIOnboarding
          userId={user.id}
          open={onboardingOpen}
          onComplete={() => setOnboardingOpen(false)}
          onSkip={() => setOnboardingOpen(false)}
        />
      )}
    </section>
  );
}
