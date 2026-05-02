// Seeder: enqueue a curated list of H-1B-relevant USCIS Policy Manual chapters
// into kb_ingest_queue. The kb-process-queue worker handles the actual fetch
// + chunk + embed.
//
// Curation strategy: start with the chapters Pulse users will hit most often.
// Expand the list in follow-up turns once retrieval quality is validated.
//
// Re-running this is safe: kb_ingest_queue has a partial unique index on
// (url, source_kind) for non-terminal statuses, so we use upsert-by-url
// semantics via insert ... on conflict do nothing (handled at SQL level
// implicitly because the unique index only covers pending/processing).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

// Volume 2, Part H — H-1B Specialty Occupation Workers.
// Volume 6, Part F — Employment-Based Green Cards (relevant for not-selected paths).
// Volume 7, Part A — Adjustment of Status overview.
// Volume 12, Part F — Naturalization timing (relevant for green-card holders).
// Seed only the Part-level index pages. The worker auto-discovers and enqueues
// child chapter URLs from these indexes, which avoids hardcoding chapter
// slugs that USCIS may rename or reorganize.
const POLICY_MANUAL_URLS: { url: string; title: string }[] = [
  // Volume 1 — General Policies and Procedures
  { url: "https://www.uscis.gov/policy-manual/volume-1-part-a", title: "Policy Manual Vol 1 Pt A — Public Services" },

  // Volume 2 — Nonimmigrants (H-1B, F-1, OPT, etc.)
  { url: "https://www.uscis.gov/policy-manual/volume-2-part-a", title: "Policy Manual Vol 2 Pt A — Nonimmigrant Policies and Procedures" },
  { url: "https://www.uscis.gov/policy-manual/volume-2-part-f", title: "Policy Manual Vol 2 Pt F — Students" },
  { url: "https://www.uscis.gov/policy-manual/volume-2-part-h", title: "Policy Manual Vol 2 Pt H — H-1B Specialty Occupation Workers" },
  { url: "https://www.uscis.gov/policy-manual/volume-2-part-l", title: "Policy Manual Vol 2 Pt L — Intracompany Transferees (L-1)" },
  { url: "https://www.uscis.gov/policy-manual/volume-2-part-m", title: "Policy Manual Vol 2 Pt M — Nonimmigrants of Extraordinary Ability or Achievement (O)" },

  // Volume 6 — Immigrants (employment-based green cards)
  { url: "https://www.uscis.gov/policy-manual/volume-6-part-e", title: "Policy Manual Vol 6 Pt E — Employment-Based Immigration" },
  { url: "https://www.uscis.gov/policy-manual/volume-6-part-f", title: "Policy Manual Vol 6 Pt F — Employment-Based Classifications" },

  // Volume 7 — Adjustment of Status
  { url: "https://www.uscis.gov/policy-manual/volume-7-part-a", title: "Policy Manual Vol 7 Pt A — Adjustment of Status Policies and Procedures" },
];

interface InsertRow {
  source_kind: string;
  source_tier: string;
  url: string;
  payload: { title: string };
  priority: number;
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

  const rows: InsertRow[] = POLICY_MANUAL_URLS.map((u, i) => ({
    source_kind: "policy_manual",
    source_tier: "tier1_uscis",
    url: u.url,
    payload: { title: u.title },
    priority: 50 + i, // earlier in list = higher priority
  }));

  // Skip URLs that already have a non-terminal queue row OR an existing
  // kb_documents row whose content_hash hasn't been re-checked recently.
  // Simpler approach: try to insert; if the partial unique index trips, skip.
  const inserted: string[] = [];
  const skipped: string[] = [];
  for (const row of rows) {
    const { error } = await admin.from("kb_ingest_queue").insert(row);
    if (error) {
      // Most common: duplicate key on the partial unique index.
      skipped.push(row.url);
    } else {
      inserted.push(row.url);
    }
  }

  return jsonResponse({ inserted: inserted.length, skipped: skipped.length, urls: { inserted, skipped } });
});
