// Shared ingest helper. Given a parsed source document, hash + chunk + embed
// + upsert into kb_documents/kb_chunks. Idempotent: re-running with the same
// content_hash skips the work entirely.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { embedDocuments } from "./embed.ts";
import { chunkBlocks, type SourceBlock } from "./chunker.ts";

export interface IngestInput {
  sourceUrl: string;
  title: string;
  sourceTier: "tier1_uscis" | "tier1_dos" | "tier2_attorney" | "tier3_community";
  sourceKind: "policy_manual" | "visa_bulletin" | "processing_times" | "form_instructions" | "blog" | "faq";
  blocks: SourceBlock[];
  effectiveDate?: string | null; // ISO date
  metadata?: Record<string, unknown>;
}

export interface IngestResult {
  status: "inserted" | "updated" | "unchanged";
  documentId: string;
  chunkCount: number;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function ingestDocument(
  admin: SupabaseClient,
  input: IngestInput,
): Promise<IngestResult> {
  const bodyForHash = input.blocks.map((b) => b.text).join("\n");
  const contentHash = await sha256Hex(bodyForHash);

  // Look up existing doc by URL.
  const { data: existing } = await admin
    .from("kb_documents")
    .select("id, content_hash")
    .eq("source_url", input.sourceUrl)
    .maybeSingle();

  if (existing && existing.content_hash === contentHash) {
    // Bump fetched_at so we know we checked, but skip the embed cost.
    await admin.from("kb_documents").update({ fetched_at: new Date().toISOString() }).eq("id", existing.id);
    return { status: "unchanged", documentId: existing.id, chunkCount: 0 };
  }

  // Upsert document row.
  const docPayload = {
    source_url: input.sourceUrl,
    title: input.title,
    source_tier: input.sourceTier,
    source_kind: input.sourceKind,
    content_hash: contentHash,
    fetched_at: new Date().toISOString(),
    effective_date: input.effectiveDate ?? null,
    metadata: input.metadata ?? {},
  };

  let documentId: string;
  if (existing) {
    documentId = existing.id;
    await admin.from("kb_documents").update(docPayload).eq("id", documentId);
    // Wipe old chunks; we'll re-embed fresh.
    await admin.from("kb_chunks").delete().eq("document_id", documentId);
  } else {
    const { data: inserted, error } = await admin
      .from("kb_documents")
      .insert(docPayload)
      .select("id")
      .single();
    if (error || !inserted) throw new Error(`kb_documents insert failed: ${error?.message}`);
    documentId = inserted.id;
  }

  // Chunk and embed.
  const chunks = chunkBlocks(input.blocks);
  if (chunks.length === 0) {
    return { status: existing ? "updated" : "inserted", documentId, chunkCount: 0 };
  }

  const embeddings = await embedDocuments(chunks.map((c) => c.text));
  if (embeddings.length !== chunks.length) {
    throw new Error(`embedding count mismatch: ${embeddings.length} vs ${chunks.length}`);
  }

  // Insert chunks in batches to keep row size sane.
  const BATCH = 50;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH).map((c, j) => ({
      document_id: documentId,
      chunk_idx: i + j,
      chunk_text: c.text,
      embedding: embeddings[i + j] as unknown as string, // pgvector accepts JSON array via supabase-js
      token_count: c.tokenCount,
      heading_path: c.headingPath,
    }));
    const { error } = await admin.from("kb_chunks").insert(slice);
    if (error) throw new Error(`kb_chunks insert failed: ${error.message}`);
  }

  return { status: existing ? "updated" : "inserted", documentId, chunkCount: chunks.length };
}
