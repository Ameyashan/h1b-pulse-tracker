// Heading-aware chunker. Takes a sequence of "blocks" (already parsed from
// HTML/MD/text by the caller) and returns chunks that:
//   - never cross a top-level heading boundary
//   - target ~600 tokens (rough char proxy: 4 chars/token)
//   - include the heading_path so retrieval can show breadcrumbs
//
// Each block is one logical unit (paragraph, list, table-row, etc.) with the
// heading stack at the time it was emitted by the parser. Tables and lists
// arrive as already-flattened text from the source-specific parser.

export interface SourceBlock {
  text: string;
  headingPath: string[]; // e.g. ['Volume 2', 'Part C', 'Chapter 8']
}

export interface KBChunk {
  text: string;
  headingPath: string[];
  tokenCount: number;
}

const TARGET_TOKENS = 600;
const MAX_TOKENS = 900;
const CHARS_PER_TOKEN = 4; // Rough approximation; good enough for sizing.

function approxTokens(s: string): number {
  return Math.ceil(s.length / CHARS_PER_TOKEN);
}

function pathsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function chunkBlocks(blocks: SourceBlock[]): KBChunk[] {
  const chunks: KBChunk[] = [];
  let bufText: string[] = [];
  let bufTokens = 0;
  let bufPath: string[] = [];

  function flush() {
    if (bufText.length === 0) return;
    chunks.push({
      text: bufText.join("\n\n").trim(),
      headingPath: bufPath,
      tokenCount: bufTokens,
    });
    bufText = [];
    bufTokens = 0;
  }

  for (const block of blocks) {
    const blockTokens = approxTokens(block.text);

    // Heading boundary: flush before crossing to a different section.
    if (bufText.length > 0 && !pathsEqual(bufPath, block.headingPath)) {
      flush();
    }

    if (bufText.length === 0) bufPath = block.headingPath;

    // If a single block is larger than MAX_TOKENS, hard-split it on sentence
    // boundaries so we don't blow past Voyage's 32k context.
    if (blockTokens > MAX_TOKENS) {
      flush();
      const sentences = block.text.split(/(?<=[.!?])\s+/);
      let local: string[] = [];
      let localTokens = 0;
      for (const s of sentences) {
        const t = approxTokens(s);
        if (localTokens + t > TARGET_TOKENS && local.length > 0) {
          chunks.push({ text: local.join(" "), headingPath: block.headingPath, tokenCount: localTokens });
          local = [];
          localTokens = 0;
        }
        local.push(s);
        localTokens += t;
      }
      if (local.length > 0) {
        chunks.push({ text: local.join(" "), headingPath: block.headingPath, tokenCount: localTokens });
      }
      continue;
    }

    if (bufTokens + blockTokens > TARGET_TOKENS && bufText.length > 0) {
      flush();
      bufPath = block.headingPath;
    }

    bufText.push(block.text);
    bufTokens += blockTokens;
  }

  flush();
  return chunks;
}
