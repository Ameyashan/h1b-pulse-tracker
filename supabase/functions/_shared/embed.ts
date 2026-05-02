// Voyage AI embedding client. We use voyage-3-large (1024-dim) per
// Anthropic's recommended pairing for retrieval over dense reference text.
//
// Two helpers:
//   embedDocuments: input_type='document', use during ingestion
//   embedQuery:     input_type='query',    use at retrieval time
//
// Voyage routes documents and queries through different embedding heads,
// so passing the wrong input_type measurably hurts recall.

const VOYAGE_API = "https://api.voyageai.com/v1/embeddings";
export const EMBEDDING_DIM = 1024;
const MODEL = "voyage-3-large";

type VoyageInputType = "document" | "query";

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
  model: string;
  usage: { total_tokens: number };
}

async function embedBatch(texts: string[], inputType: VoyageInputType): Promise<number[][]> {
  const apiKey = Deno.env.get("VOYAGE_API_KEY");
  if (!apiKey) throw new Error("VOYAGE_API_KEY not configured");
  if (texts.length === 0) return [];

  const r = await fetch(VOYAGE_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: texts,
      input_type: inputType,
    }),
  });

  if (!r.ok) {
    const detail = await r.text();
    throw new Error(`voyage_error ${r.status}: ${detail}`);
  }

  const data = (await r.json()) as VoyageResponse;
  // Sort by index defensively; Voyage returns them in order but contracts can change.
  return data.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

const MAX_BATCH = 96; // Voyage limit is 128; we leave headroom for retries.

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const slice = texts.slice(i, i + MAX_BATCH);
    const embs = await embedBatch(slice, "document");
    out.push(...embs);
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [emb] = await embedBatch([text], "query");
  return emb;
}
