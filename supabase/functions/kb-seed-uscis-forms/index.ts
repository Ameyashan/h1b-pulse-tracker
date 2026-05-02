// Seeder: USCIS form instruction pages. Each form has a stable URL on
// uscis.gov (e.g. /i-129) plus an instruction PDF; we ingest the HTML page
// which has structured "Edition Date / Filing Fees / Where to File" sections.
//
// Refresh weekly via pg_cron — fees and edition dates change.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const FORMS: { url: string; title: string }[] = [
  { url: "https://www.uscis.gov/i-129", title: "Form I-129 — Petition for a Nonimmigrant Worker" },
  { url: "https://www.uscis.gov/i-129cw", title: "Form I-129CW — CNMI-Only Nonimmigrant Transitional Worker" },
  { url: "https://www.uscis.gov/i-140", title: "Form I-140 — Immigrant Petition for Alien Workers" },
  { url: "https://www.uscis.gov/i-485", title: "Form I-485 — Application to Register Permanent Residence or Adjust Status" },
  { url: "https://www.uscis.gov/i-539", title: "Form I-539 — Application to Extend/Change Nonimmigrant Status" },
  { url: "https://www.uscis.gov/i-765", title: "Form I-765 — Application for Employment Authorization" },
  { url: "https://www.uscis.gov/i-907", title: "Form I-907 — Request for Premium Processing Service" },
  { url: "https://www.uscis.gov/i-130", title: "Form I-130 — Petition for Alien Relative" },
  { url: "https://www.uscis.gov/i-131", title: "Form I-131 — Application for Travel Document" },
  { url: "https://www.uscis.gov/i-9", title: "Form I-9 — Employment Eligibility Verification" },
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
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const inserted: string[] = [];
  const skipped: string[] = [];
  for (let i = 0; i < FORMS.length; i++) {
    const f = FORMS[i];
    const { error } = await admin.from("kb_ingest_queue").insert({
      source_kind: "form_instructions",
      source_tier: "tier1_uscis",
      url: f.url,
      payload: { title: f.title },
      priority: 70 + i,
    });
    if (error) skipped.push(f.url);
    else inserted.push(f.url);
  }
  return jsonResponse({ inserted: inserted.length, skipped: skipped.length, urls: { inserted, skipped } });
});
