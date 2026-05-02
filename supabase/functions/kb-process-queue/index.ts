// Worker: claim one pending row from kb_ingest_queue, fetch the URL, parse to
// SourceBlocks, embed via Voyage, upsert into kb_documents/kb_chunks.
//
// pg_cron invokes this every minute. Each invocation processes ONE item and
// returns within the 60s edge-function timeout. Concurrent invocations are
// safe because claim_kb_queue_item() uses SELECT ... FOR UPDATE SKIP LOCKED.
//
// To process more per minute, raise the cron frequency or call this from a
// loop in a separate scheduler function.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { extractBlocks, extractInternalLinks } from "../_shared/html-extract.ts";
import { ingestDocument } from "../_shared/ingest.ts";

interface QueueItem {
  id: string;
  source_kind: string;
  source_tier: string;
  url: string;
  payload: Record<string, unknown>;
  attempts: number;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchHtml(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      // USCIS / DOS occasionally 403 default Deno UA. Identify clearly.
      "User-Agent": "PulseAI-KB-Bot/1.0 (+https://h1bpulse.com; contact: ameya.shanbhag@gmail.com)",
      "Accept": "text/html,application/xhtml+xml",
    },
  });
  if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`);
  return await r.text();
}

const MAX_ATTEMPTS = 3;

async function markFailed(admin: SupabaseClient, id: string, attempts: number, err: string) {
  const status = attempts >= MAX_ATTEMPTS ? "failed" : "pending";
  await admin.from("kb_ingest_queue").update({
    status,
    last_error: err.slice(0, 1000),
    started_at: null,
  }).eq("id", id);
}

// Source-kinds where we walk index pages to discover child URLs. Each entry
// declares the origin + acceptable path prefix; the worker enqueues every
// matching <a href> on the page (deduped by url+source_kind).
// Auto-discovery allowlist. Pulse AI's audience is H-1B + adjacent
// (F-1/OPT/STEM-OPT/L-1/O-1) + EB green cards. Restrict policy-manual
// crawling to the four volumes that actually cover those topics:
//   Vol 2  — Nonimmigrants (H-1B, F-1, L-1, O-1)
//   Vol 6  — Immigrants (EB-1/EB-2/EB-3)
//   Vol 7  — Adjustment of Status
//   Vol 10 — Employment authorization (OPT, EAD)
// Without this filter the worker eagerly crawls the entire 2k-page manual.
const POLICY_MANUAL_ALLOWED = /^\/policy-manual\/(volume-2|volume-6|volume-7|volume-10)(-|$)/;

const LINK_DISCOVERY: Record<string, { origin: string; prefixes: string[]; pathRegex?: RegExp; depthLimit: number }> = {
  policy_manual: {
    origin: "https://www.uscis.gov",
    prefixes: ["/policy-manual/"],
    pathRegex: POLICY_MANUAL_ALLOWED,
    depthLimit: 4,
  },
};

function urlPathDepth(absUrl: string, origin: string): number {
  if (!absUrl.startsWith(origin)) return 0;
  return absUrl.slice(origin.length).split("/").filter(Boolean).length;
}

async function discoverAndEnqueue(
  admin: SupabaseClient,
  html: string,
  parentUrl: string,
  sourceKind: string,
  sourceTier: string,
): Promise<number> {
  const cfg = LINK_DISCOVERY[sourceKind];
  if (!cfg) return 0;
  const links = extractInternalLinks(html, {
    origin: cfg.origin,
    pathPrefixes: cfg.prefixes,
    pathRegex: cfg.pathRegex,
    excludeSelf: parentUrl,
  });
  // Cap discovery depth so we don't crawl the entire policy manual from one page.
  const filtered = links.filter((u) => urlPathDepth(u, cfg.origin) <= cfg.depthLimit);
  if (filtered.length === 0) return 0;

  const rows = filtered.map((u) => ({
    source_kind: sourceKind,
    source_tier: sourceTier,
    url: u,
    payload: { discovered_from: parentUrl },
    priority: 200, // lower priority than seeded URLs
  }));

  // Best-effort insert; partial unique index drops duplicates.
  let enq = 0;
  for (const r of rows) {
    const { error } = await admin.from("kb_ingest_queue").insert(r);
    if (!error) enq++;
  }
  return enq;
}

async function processItem(admin: SupabaseClient, item: QueueItem) {
  const html = await fetchHtml(item.url);
  const { title: extractedTitle, blocks } = extractBlocks(html);
  if (blocks.length === 0) {
    throw new Error("no blocks extracted");
  }
  const payloadTitle = (item.payload?.title as string | undefined) ?? "";
  const title = payloadTitle || extractedTitle || item.url;

  const result = await ingestDocument(admin, {
    sourceUrl: item.url,
    title,
    sourceTier: item.source_tier as "tier1_uscis" | "tier1_dos" | "tier2_attorney" | "tier3_community",
    sourceKind: item.source_kind as "policy_manual" | "visa_bulletin" | "processing_times" | "form_instructions" | "blog" | "faq",
    blocks,
    effectiveDate: (item.payload?.effective_date as string | undefined) ?? null,
    metadata: (item.payload?.metadata as Record<string, unknown> | undefined) ?? {},
  });

  // Auto-discover children for sources that have hierarchical index pages.
  const discovered = await discoverAndEnqueue(admin, html, item.url, item.source_kind, item.source_tier);

  await admin.from("kb_ingest_queue").update({
    status: "done",
    completed_at: new Date().toISOString(),
    last_error: null,
  }).eq("id", item.id);

  return { ...result, discovered };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "supabase env not configured" }, 500);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // How many to process this invocation. Default 1; bump via ?n=3 for manual catch-up.
  const url = new URL(req.url);
  const n = Math.min(Math.max(parseInt(url.searchParams.get("n") ?? "1", 10) || 1, 1), 5);

  const results: { url: string; status: string; chunkCount?: number; discovered?: number; error?: string }[] = [];

  for (let i = 0; i < n; i++) {
    const { data, error } = await admin.rpc("claim_kb_queue_item");
    if (error) {
      results.push({ url: "(claim_failed)", status: "error", error: error.message });
      break;
    }
    const item = data as QueueItem | null;
    if (!item || !item.id) break; // queue empty

    try {
      const r = await processItem(admin, item);
      results.push({ url: item.url, status: r.status, chunkCount: r.chunkCount, discovered: r.discovered });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markFailed(admin, item.id, item.attempts, msg);
      results.push({ url: item.url, status: "error", error: msg });
    }
  }

  return jsonResponse({ processed: results.length, results });
});
