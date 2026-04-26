import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

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

type ProfileRow = {
  current_visa_status: string | null;
  lottery_status: string | null;
  degree_level: string | null;
  field_of_study: string | null;
  employer_type: string | null;
  country_of_birth: string | null;
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

RULES:
- Tailor every answer to the user's specific context (status, country, degree, employer type). Do not restate their context back at them unless it materially changes the answer.
- Use the web_search tool ONLY for time-sensitive facts: current USCIS processing times, the latest visa bulletin, recent USCIS policy memos, fee changes. Do NOT search for general explanations you already know.
- When you cite a web search result, use [n] markers inline; the application will render them as links.
- Cap responses at ~250 words unless the user explicitly asks for more depth.
- For case-specific questions (RFEs, denials, complex eligibility, filings) give the substantive answer first, then recommend an attorney.
- Be direct. Avoid hedging language ("it depends", "consult an attorney") unless it is genuinely the right answer.

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

    // System is a multi-block array so we can mark the static portion as
    // cacheable and append a per-user block (cheap, doesn't cache).
    const system = [
      { type: "text", text: BASE_SYSTEM, cache_control: { type: "ephemeral" } },
      { type: "text", text: userContext },
    ];

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
    const { text: raw, citations } = extractAnswerAndCitations(blocks);
    const { answer, followups } = splitAnswerAndFollowups(raw);

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
    });

    return jsonResponse({ answer, citations, followups });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
