import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `You are Pulse, an H1B visa co-pilot. Answer concisely and accurately about USCIS policy, the H1B process, RFEs, premium processing, receipt notices, and case status. Cite sources when stating facts. If asked for legal advice, recommend consulting a licensed immigration attorney. Keep responses under 250 words unless the user explicitly asks for more detail.

After your answer, ALWAYS append a section in this exact format on its own line:
---FOLLOWUPS---
1. <short follow-up question, max 8 words>
2. <short follow-up question, max 8 words>
3. <short follow-up question, max 8 words>

The follow-ups should be natural next questions the user might ask given your answer. Keep them short and specific.`;

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
    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (!apiKey) {
      return jsonResponse({ error: "PERPLEXITY_API_KEY not configured" }, 500);
    }
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "supabase env not configured" }, 500);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Identify caller
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data } = await admin.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const today = new Date().toISOString().slice(0, 10);
    const limit = userId ? AUTH_LIMIT : ANON_LIMIT;

    // Quota check
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

    // Call Perplexity
    const trimmedHistory = Array.isArray(history) ? history.slice(-6) : [];
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...trimmedHistory,
      { role: "user", content: question },
    ];

    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages,
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return jsonResponse({ error: "perplexity_error", detail }, 502);
    }

    const data = await r.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const citations: string[] = data?.citations ?? [];
    const { answer, followups } = splitAnswerAndFollowups(raw);

    // Increment counter only on successful response
    if (userId) {
      await admin.rpc("increment_user_usage", { p_user_id: userId, p_day: today });
    } else {
      await admin.rpc("increment_anon_usage", { p_ip_hash: ipHash, p_day: today });
    }

    return jsonResponse({ answer, citations, followups });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
