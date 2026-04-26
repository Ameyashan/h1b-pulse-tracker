import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

type NewsItem = { src: string; title: string; time: string; url?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Return cached news if still fresh
  const { data: cached } = await supabase
    .from("news_cache")
    .select("*")
    .eq("id", "latest")
    .maybeSingle();

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ items: cached.items, cached: true, fetched_at: cached.fetched_at }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
  if (!apiKey) {
    if (cached) {
      return new Response(
        JSON.stringify({ items: cached.items, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ items: [], error: "PERPLEXITY_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const prompt = `You are a news aggregator. Return a JSON array of exactly 8 recent news headlines from the past 7 days that are relevant to H-1B visa holders, F-1/OPT students, L-1, O-1, or other work visa holders in the United States. Focus on: USCIS policy changes, visa processing times, immigration court rulings, DHS/DOS announcements, and employer-sponsored visa news.

Format each item strictly as:
{"src": "Publication name", "title": "Concise headline under 100 chars", "time": "Xm ago" or "Xh ago" or "Xd ago", "url": "https://actual-article-url"}

The url field must be the direct link to the actual news article. Only include real, verifiable URLs from reputable sources.

Return ONLY the raw JSON array. No markdown, no explanation.`;

  try {
    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
      }),
    });

    if (!r.ok) throw new Error(`Perplexity error: ${r.status}`);

    const result = await r.json();
    const content: string = result.choices?.[0]?.message?.content ?? "";

    let items: NewsItem[] = [];
    const match = content.match(/\[[\s\S]*\]/);
    if (match) items = JSON.parse(match[0]);

    if (items.length > 0) {
      await supabase.from("news_cache").upsert({
        id: "latest",
        items,
        fetched_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ items, cached: false, fetched_at: new Date().toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (e) {
    console.error("fetch-news error:", e);
  }

  // Fall back to stale cache if available
  if (cached) {
    return new Response(
      JSON.stringify({ items: cached.items, cached: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ items: [] }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
