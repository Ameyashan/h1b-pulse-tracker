// Seeder: DOS Visa Bulletin. Compute the URL for the current month and the
// last six months and enqueue them. URLs follow a stable pattern:
//   travel.state.gov/.../visa-bulletin/<fiscal-year>/visa-bulletin-for-<month>-<calendar-year>.html
// where fiscal-year flips on October 1st.
//
// Refresh monthly via pg_cron. The content_hash check in ingest.ts means
// re-running is cheap when nothing changed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function fiscalYear(year: number, monthIdx: number): number {
  // US fiscal year starts October. Oct-Dec belong to FY of (calYear + 1).
  return monthIdx >= 9 ? year + 1 : year;
}

function bulletinUrl(year: number, monthIdx: number): { url: string; effectiveDate: string; title: string } {
  const month = MONTHS[monthIdx];
  const fy = fiscalYear(year, monthIdx);
  const url = `https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/${fy}/visa-bulletin-for-${month}-${year}.html`;
  const mm = String(monthIdx + 1).padStart(2, "0");
  return {
    url,
    effectiveDate: `${year}-${mm}-01`,
    title: `Visa Bulletin — ${month[0].toUpperCase()}${month.slice(1)} ${year}`,
  };
}

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
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Walk back 6 months from "now" so we always pick up the latest published
  // bulletin (DOS publishes ~mid-month-prior). Newer rows get higher priority.
  const now = new Date();
  const targets: { url: string; effectiveDate: string; title: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    targets.push(bulletinUrl(d.getFullYear(), d.getMonth()));
  }

  const inserted: string[] = [];
  const skipped: string[] = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const { error } = await admin.from("kb_ingest_queue").insert({
      source_kind: "visa_bulletin",
      source_tier: "tier1_dos",
      url: t.url,
      payload: { title: t.title, effective_date: t.effectiveDate },
      priority: 30 + i, // recent bulletins highest priority
    });
    if (error) skipped.push(t.url);
    else inserted.push(t.url);
  }
  return jsonResponse({ inserted: inserted.length, skipped: skipped.length, urls: { inserted, skipped } });
});
