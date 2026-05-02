// Seeder: tier-2 attorney commentary. URLs below were verified via WebFetch
// (200 OK + topic match) before being added — please do the same when adding
// more. The previous version used guessed URLs that all 404'd.
//
// How to add more (one-time process):
//   1. Visit the blog's index page (murthy.com/news, blog.cyrusmehta.com,
//      boundless.com/immigration-resources)
//   2. Pick articles relevant to H-1B / OPT / EB-1 / EB-2 NIW / O-1 / L-1
//   3. Verify each URL returns 200 in a browser
//   4. Append to ARTICLES with a clear title

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const ARTICLES: { url: string; title: string }[] = [
  // Boundless — definitive 101 explainer for H-1B applicants
  {
    url: "https://www.boundless.com/immigration-resources/the-h-1b-visa-explained",
    title: "Boundless — The H-1B Visa, Explained",
  },

  // Murthy — practical Q&A format, deep on current rule changes and edge cases
  {
    url: "https://www.murthy.com/2026/04/16/i-am-an-f-1-student-in-a-hybrid-program-that-mixes-online-classes-with-required-in-person-sessions-can-this-type-of-program-satisfy-the-full-course-of-study-requirement/",
    title: "Murthy — F-1 Hybrid Programs and the Full Course of Study Requirement",
  },
  {
    url: "https://www.murthy.com/2026/02/11/i-am-currently-on-opt-and-my-employer-will-be-entering-me-in-the-h1b-lottery-i-am-presently-earning-the-equivalent-of-a-wage-level-1-salary-but-the-employer-has-agreed-to-increase-it-to-wage-level-2-for-my-h1b-lottery-case/",
    title: "Murthy — Wage Levels Between OPT and the H-1B Lottery",
  },

  // Cyrus Mehta — sharp on H-1B enforcement realities and EB-1 case law
  {
    url: "https://blog.cyrusmehta.com/2026/04/h-1b-enforcement-while-working-abroad-why-are-cbp-officers-in-abu-dhabi-scrutinizing-lcas.html",
    title: "Cyrus Mehta — H-1B Enforcement While Working Abroad",
  },
  {
    url: "https://blog.cyrusmehta.com/2026/02/federal-court-relies-on-loper-bright-to-overturn-eb-1-denial-based-on-the-final-merits-determination.html",
    title: "Cyrus Mehta — Loper Bright Overturns EB-1 Final Merits Denial",
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (_req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "supabase env not configured" }, 500);
  }
  if (ARTICLES.length === 0) {
    return jsonResponse({ inserted: 0, skipped: 0, note: "ARTICLES list is empty" });
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const inserted: string[] = [];
  const skipped: string[] = [];
  for (let i = 0; i < ARTICLES.length; i++) {
    const a = ARTICLES[i];
    const { error } = await admin.from("kb_ingest_queue").insert({
      source_kind: "blog",
      source_tier: "tier2_attorney",
      url: a.url,
      payload: { title: a.title },
      priority: 150 + i,
    });
    if (error) skipped.push(a.url);
    else inserted.push(a.url);
  }
  return jsonResponse({ inserted: inserted.length, skipped: skipped.length, urls: { inserted, skipped } });
});
