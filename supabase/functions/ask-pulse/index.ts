import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { embedQuery } from "../_shared/embed.ts";
import type { ProfileRow } from "../_shared/profile.ts";
import { matchPlaybook } from "../_shared/playbooks/index.ts";

// Phase 1 Pulse AI: Claude Sonnet 4.6 with the web_search tool, prompt
// caching, and per-user context injected from the profiles table.

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_WEB_SEARCHES = 5;
const MAX_TOKENS = 800;

const VISA_LABEL: Record<string, string> = {
  f1: "F-1 student",
  f1_opt: "F-1 OPT",
  f1_stem_opt: "F-1 STEM OPT",
  h1b: "H-1B (current employer)",
  h1b_transfer: "H-1B (transferring employers)",
  l1: "L-1",
  o1: "O-1",
  green_card_pending: "Green card pending",
  none: "Not currently in the US / no active status",
  other: "Other",
};
const LOTTERY_LABEL: Record<string, string> = {
  selected_fy26: "Selected in the most recent H-1B lottery",
  not_selected_fy26: "Not selected in the most recent H-1B lottery",
  waitlist: "Waitlisted in the most recent H-1B lottery",
  not_entered: "Did not enter the lottery",
  unknown: "Lottery status unknown",
};
const DEGREE_LABEL: Record<string, string> = {
  bachelors: "Bachelor's",
  masters: "Master's",
  phd: "PhD",
  other: "Other",
};
const EMPLOYER_LABEL: Record<string, string> = {
  private: "Private company (cap-subject)",
  cap_exempt_university: "Cap-exempt university",
  cap_exempt_nonprofit_research: "Cap-exempt nonprofit research org",
  government_research: "Government research org",
  unemployed: "Currently not employed",
  other: "Other",
};

function buildUserContextBlock(p: ProfileRow | null): string {
  if (!p) {
    return "USER CONTEXT: anonymous visitor — no profile on file. Ask brief clarifying questions when their situation materially changes the answer.";
  }
  const lines: string[] = [];
  if (p.lottery_status) lines.push(`- Lottery status: ${LOTTERY_LABEL[p.lottery_status] ?? p.lottery_status}`);
  if (p.current_visa_status) lines.push(`- Current visa status: ${VISA_LABEL[p.current_visa_status] ?? p.current_visa_status}`);
  if (p.degree_level) lines.push(`- Highest degree: ${DEGREE_LABEL[p.degree_level] ?? p.degree_level}`);
  if (p.field_of_study) lines.push(`- Field of study: ${p.field_of_study}`);
  if (p.employer_type) lines.push(`- Employer type: ${EMPLOYER_LABEL[p.employer_type] ?? p.employer_type}`);
  if (p.country_of_birth) lines.push(`- Country of birth: ${p.country_of_birth}`);
  if (lines.length === 0) {
    return "USER CONTEXT: signed-in user but no profile details on file yet.";
  }
  return `USER CONTEXT (use this to tailor every answer; do not restate it back unless load-bearing):\n${lines.join("\n")}`;
}

const BASE_SYSTEM = `You are Pulse, an immigration-aware co-pilot for H-1B applicants and adjacent visa holders (F-1, OPT, STEM OPT, L-1, O-1, EB-2/EB-3 green card).

Your job is to give concrete, path-aware guidance — not generic "talk to an attorney" deflections — while flagging when something genuinely needs legal review.

KNOWLEDGE SOURCES (in priority order):
1. The <archetype_playbook> block IF PRESENT — this is the strongest signal for "what should I do" questions. It encodes the realistic paths for users in the current archetype, with eligibility heuristics and risk flags. Follow its "How to respond" instructions exactly: classify the user, pick 2-3 best-fit paths, explain briefly, and only ask ONE follow-up if a path-determining fact is missing.
2. The <knowledge> block — vetted excerpts from USCIS Policy Manual, USCIS form instructions, the DOS Visa Bulletin, and curated attorney commentary. Prefer this over your general knowledge whenever it covers the question. Use it to ground specific claims (cite with [n] markers).
3. The web_search tool — use ONLY for time-sensitive facts (current processing times, latest visa bulletin month, recent fee/policy changes) AND ONLY when the <knowledge> block is silent on them.
4. Your general training. Use only as a last resort and flag uncertainty.

RULES:
- Tailor every answer to the user's specific context (status, country, degree, employer type). Do not restate their context back at them unless it materially changes the answer.
- When you use a knowledge-block excerpt or web search result, cite it inline with [n] markers using the numbering provided. The application renders them as links.
- Cap responses at ~250 words unless the user explicitly asks for more depth.
- For case-specific questions (RFEs, denials, complex eligibility, filings) give the substantive answer first, then recommend an attorney.
- Be direct. Avoid hedging language ("it depends", "consult an attorney") unless it is genuinely the right answer.

FORMATTING (you are rendering inside a chat bubble, not a document):
- Default to prose with **bold** for emphasis and short bulleted lists for enumerations.
- Use a markdown table ONLY when comparing 3+ items across 2+ attributes (e.g. a fee schedule by employer size). Otherwise prose is shorter and clearer.
- Do NOT use markdown headings (#, ##, ###) at all. If you need a section break, use a short bold line followed by the content.
- Do NOT use horizontal rules (---) or decorative emoji as section markers.
- Keep tables small: max 4 columns, max 5 rows. If more is needed, break into prose.

OUTPUT FORMAT:
End every response with this exact section on its own line:
---FOLLOWUPS---
1. <natural follow-up question in the user's voice, max 8 words>
2. <natural follow-up question in the user's voice, max 8 words>
3. <natural follow-up question in the user's voice, max 8 words>`;

function splitAnswerAndFollowups(text: string): { answer: string; followups: string[] } {
  const idx = text.indexOf("---FOLLOWUPS---");
  if (idx === -1) return { answer: text.trim(), followups: [] };
  const answer = text.slice(0, idx).trim();
  const tail = text.slice(idx + "---FOLLOWUPS---".length);
  const followups = tail
    .split("\n")
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter((l) => l.length > 0 && l.length < 120)
    .slice(0, 3);
  return { answer, followups };
}

const ANON_LIMIT = 5;
const AUTH_LIMIT = 15;

type ChatMessage = { role: "user" | "assistant"; content: string };

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Walks Anthropic's content blocks, joins all text blocks, and harvests URLs
// from any web_search_tool_result blocks in citation order.
function extractAnswerAndCitations(content: unknown[]): { text: string; citations: string[] } {
  const textParts: string[] = [];
  const citations: string[] = [];
  const seen = new Set<string>();
  for (const block of content) {
    const b = block as { type?: string; text?: string; content?: unknown };
    if (b.type === "text" && typeof b.text === "string") {
      textParts.push(b.text);
    } else if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content as { type?: string; url?: string }[]) {
        if (r.type === "web_search_result" && r.url && !seen.has(r.url)) {
          seen.add(r.url);
          citations.push(r.url);
        }
      }
    }
  }
  return { text: textParts.join("\n").trim(), citations };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, history = [] } = await req.json() as {
      question?: string;
      history?: ChatMessage[];
    };

    if (!question || typeof question !== "string") {
      return jsonResponse({ error: "question required" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500);
    }
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "supabase env not configured" }, 500);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data } = await admin.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const today = new Date().toISOString().slice(0, 10);
    const limit = userId ? AUTH_LIMIT : ANON_LIMIT;

    let ipHash = "";
    if (userId) {
      const { data: row } = await admin
        .from("query_usage")
        .select("count")
        .eq("user_id", userId)
        .eq("day", today)
        .maybeSingle();
      const used = row?.count ?? 0;
      if (used >= limit) {
        return jsonResponse({ error: "limit_reached", limit, used, requiresAuth: false }, 200);
      }
    } else {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      ipHash = await sha256(ip);
      const { data: row } = await admin
        .from("anon_query_usage")
        .select("count")
        .eq("ip_hash", ipHash)
        .eq("day", today)
        .maybeSingle();
      const used = row?.count ?? 0;
      if (used >= limit) {
        return jsonResponse({ error: "limit_reached", limit, used, requiresAuth: true }, 200);
      }
    }

    let profile: ProfileRow | null = null;
    if (userId) {
      const { data } = await admin
        .from("profiles")
        .select("current_visa_status, lottery_status, degree_level, field_of_study, employer_type, country_of_birth")
        .eq("id", userId)
        .maybeSingle();
      profile = (data as ProfileRow | null) ?? null;
    }
    const userContext = buildUserContextBlock(profile);

    const trimmedHistory = (Array.isArray(history) ? history.slice(-6) : []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Retrieve top-k chunks from the curated KB. Failures here are non-fatal:
    // we degrade gracefully to "no knowledge block, just web_search + model".
    let knowledgeBlock = "";
    let kbCitations: string[] = [];
    try {
      const qEmb = await embedQuery(question);
      const { data: chunks } = await admin.rpc("match_kb_chunks_hybrid", {
        query_text: question,
        query_embedding: qEmb as unknown as string,
        match_count: 6,
      });
      const rows = (chunks as Array<{
        chunk_text: string;
        heading_path: string[] | null;
        source_url: string;
        title: string | null;
        source_tier: string;
        source_kind: string;
        effective_date: string | null;
        vector_similarity: number;
        fts_rank: number;
        hybrid_score: number;
      }> | null) ?? [];
      // Keep a row if either signal is meaningful: vector cosine ≥ 0.4 OR
      // it appeared in the FTS top set. RRF fusion already ranked them.
      const useful = rows.filter(
        (r) => (r.vector_similarity ?? 0) >= 0.4 || (r.fts_rank ?? 0) > 0,
      );
      if (useful.length > 0) {
        kbCitations = useful.map((r) => r.source_url);
        knowledgeBlock = useful
          .map((r, i) => {
            const breadcrumb = (r.heading_path ?? []).filter(Boolean).join(" > ");
            const header = [r.title, breadcrumb].filter(Boolean).join(" — ");
            const dateNote = r.effective_date ? ` (effective ${r.effective_date})` : "";
            return `[${i + 1}] ${header}${dateNote}\n${r.chunk_text}\nSource: ${r.source_url}`;
          })
          .join("\n\n---\n\n");
      }
    } catch (_) {
      // Swallow embed/retrieval errors; continue without knowledge block.
    }

    // Match an archetype playbook against profile + question shape.
    // Conditional: only fires for logged-in users whose situation maps to
    // a known archetype AND whose question is open-ended.
    const playbook = matchPlaybook(profile, question, trimmedHistory);

    // System is a multi-block array so we can mark the static portion as
    // cacheable and append per-user + per-question blocks.
    const system: Array<Record<string, unknown>> = [
      { type: "text", text: BASE_SYSTEM, cache_control: { type: "ephemeral" } },
      { type: "text", text: userContext },
    ];
    if (knowledgeBlock) {
      system.push({
        type: "text",
        text: `<knowledge>\n${knowledgeBlock}\n</knowledge>`,
      });
    }
    if (playbook) {
      system.push({
        type: "text",
        text: `<archetype_playbook archetype="${playbook.archetype}">\n${playbook.content}\n</archetype_playbook>`,
      });
    }

    const r = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        tools: [
          { type: "web_search_20250305", name: "web_search", max_uses: MAX_WEB_SEARCHES },
        ],
        messages: [
          ...trimmedHistory,
          { role: "user", content: question },
        ],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return jsonResponse({ error: "anthropic_error", detail }, 502);
    }

    const data = await r.json();
    const blocks: unknown[] = Array.isArray(data?.content) ? data.content : [];
    const { text: raw, citations: webCitations } = extractAnswerAndCitations(blocks);
    const { answer, followups } = splitAnswerAndFollowups(raw);

    // KB citations come first (they correspond to [n] markers the model saw
    // in the knowledge block), followed by web_search citations. Dedupe by URL.
    const seenCite = new Set<string>();
    const citations: string[] = [];
    for (const u of [...kbCitations, ...webCitations]) {
      if (!seenCite.has(u)) {
        seenCite.add(u);
        citations.push(u);
      }
    }

    if (userId) {
      await admin.rpc("increment_user_usage", { p_user_id: userId, p_day: today });
    } else {
      await admin.rpc("increment_anon_usage", { p_ip_hash: ipHash, p_day: today });
    }

    await admin.from("pulse_query_log").insert({
      user_id: userId,
      is_anonymous: !userId,
      ip_hash: userId ? null : ipHash,
      question,
      answer_chars: answer.length,
      citation_count: citations.length,
      // archetype is a free-form string column we'd ideally add to
      // pulse_query_log; until then it lives in a console log so it's
      // visible in edge-function logs for observability.
    });
    if (playbook) {
      console.log(`playbook_fired archetype=${playbook.archetype} user=${userId ?? "anon"}`);
    }

    return jsonResponse({ answer, citations, followups });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
