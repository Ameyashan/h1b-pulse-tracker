import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_SUBMISSIONS_PER_HOUR = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { classification, wage_level, education_level, honeypot } = body;

    // Honeypot check - if filled, silently succeed (don't reveal it's a trap)
    if (honeypot) {
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!classification || !wage_level || !education_level) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["selected", "not_selected"].includes(classification)) {
      return new Response(
        JSON.stringify({ error: "Invalid classification" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || req.headers.get("x-real-ip")
      || "unknown";

    // Rate limit check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("submission_logs")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("Rate limit check error:", countError);
    }

    if ((count ?? 0) >= MAX_SUBMISSIONS_PER_HOUR) {
      return new Response(
        JSON.stringify({ error: "Too many submissions. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert the signal
    const sourceId = `self_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { error: insertError } = await supabase.from("signals").insert({
      source_id: sourceId,
      source_type: "self_report",
      classification,
      wage_level,
      education_level,
      title: `${classification === "selected" ? "Selected" : "Not Selected"} — Level ${wage_level}, ${education_level}`,
      body: "",
      permalink: "",
      author: "anonymous",
      created_utc: new Date().toISOString(),
      score: 0,
      employer_mentions: [],
      extracted_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    // Log the submission for rate limiting
    await supabase.from("submission_logs").insert({ ip_address: ip });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Submit report error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to submit report" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
