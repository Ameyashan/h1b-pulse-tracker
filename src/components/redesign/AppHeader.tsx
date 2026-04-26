import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal, type AuthTab } from "./AuthModal";
import { supabase } from "@/lib/supabase-custom";

const REGISTER_VISITOR_URL =
  "https://rkwcpnoqnxporjqqlxjt.supabase.co/functions/v1/register-visitor";

export type TabKey = "pulse" | "lottery" | "petition" | "steps";

interface AppHeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onRefresh?: () => void;
}

const TABS: { key: TabKey; label: string; badge?: "new" | "ai"; icon: JSX.Element }[] = [
  {
    key: "pulse",
    label: "Ask Pulse",
    badge: "ai",
    icon: (
      <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    key: "petition",
    label: "Petition Tracker",
    icon: (
      <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    key: "lottery",
    label: "Lottery Tracker",
    icon: (
      <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    key: "steps",
    label: "Next Steps",
    icon: (
      <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
];

export function AppHeader({ activeTab, onTabChange, onRefresh }: AppHeaderProps) {
  const [count, setCount] = useState<number | null>(null);
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>("login");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(REGISTER_VISITOR_URL, { method: "POST" });
        if (res.ok) {
          const body = await res.json();
          if (!cancelled && typeof body.count === "number") {
            setCount(body.count);
            return;
          }
        }
      } catch {
        // fall through to read-only fetch
      }
      const { data } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "visitor_count")
        .single();
      if (!cancelled && data) setCount(Number(data.value));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function openAuth(t: AuthTab) {
    setAuthTab(t);
    setAuthOpen(true);
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l3-9 4 18 3-9h4" />
            </svg>
          </div>
          H1B Pulse
          <span className="brand-sub">FY2027</span>
        </div>

        <div className="top-right">
          {count !== null && (
            <div className="live-counter">
              <span className="live-dot" />
              <span className="num">{count.toLocaleString()}</span>
              <span className="label">helping each other</span>
            </div>
          )}
          <button className="icon-btn" title="Refresh" onClick={onRefresh} aria-label="Refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" />
            </svg>
          </button>
          {user ? (
            <>
              <span className="rd-user-email" title={user.email ?? ""}>{user.email}</span>
              <button className="rd-btn btn-ghost" onClick={() => signOut()}>Sign out</button>
            </>
          ) : (
            <>
              <button className="rd-btn btn-ghost" onClick={() => openAuth("login")}>Log in</button>
              <button className="rd-btn btn-primary" onClick={() => openAuth("signup")}>Sign up free</button>
            </>
          )}
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialTab={authTab} />

      <div className="tabs-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`rd-tab${activeTab === t.key ? " active" : ""}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.icon}
            {t.label}
            {t.badge === "ai" && <span className="rd-badge new">AI</span>}
            {t.badge === "new" && <span className="rd-badge new">New</span>}
          </button>
        ))}
      </div>
    </header>
  );
}
