// Lightweight HTML → SourceBlock[] extractor. Tuned for USCIS policy-manual,
// USCIS form-instruction pages, and most attorney blog layouts. Walks the
// document in document order, tracks an h1-h6 stack, and emits one block per
// <p>/<li>/<td>. Good enough without pulling jsdom/cheerio.

import type { SourceBlock } from "./chunker.ts";

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&rdquo;": "”",
  "&ldquo;": "“",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&[a-zA-Z#0-9]+;/g, (e) => ENTITIES[e] ?? e)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export interface ExtractResult {
  title: string;
  blocks: SourceBlock[];
}

export function extractBlocks(html: string): ExtractResult {
  // 1. Title.
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : "";

  // 2. Drop noise wholesale.
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "");

  // 3. Prefer <main> or <article> if present.
  const main = body.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (main) body = main[1];
  else {
    const article = body.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (article) body = article[1];
  }

  // 4. Walk relevant tags in order.
  const blocks: SourceBlock[] = [];
  const headingStack: string[] = [];
  const tagRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/h[1-6]>|<(p|li|td|th|blockquote)\b[^>]*>([\s\S]*?)<\/\3>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(body)) !== null) {
    const tag = (m[1] || m[3] || "").toLowerCase();
    const inner = m[2] || m[4] || "";
    const text = stripTags(inner);
    if (!text) continue;
    if (tag.startsWith("h")) {
      const level = parseInt(tag[1], 10);
      // Truncate stack to one shy of this level, then set this level.
      headingStack.length = Math.max(0, level - 1);
      headingStack[level - 1] = text;
    } else {
      const path = headingStack.filter(Boolean);
      blocks.push({ text, headingPath: path });
    }
  }

  return { title, blocks };
}

// Returns absolute https://www.uscis.gov/... URLs for every <a href> that
// matches one of the allowed path prefixes. Used by the worker to auto-
// discover child policy-manual chapters from index pages so we don't have
// to hardcode chapter slugs.
export function extractInternalLinks(html: string, opts: {
  origin: string;            // e.g. "https://www.uscis.gov"
  pathPrefixes: string[];    // e.g. ["/policy-manual/"]
  pathRegex?: RegExp;        // optional additional allowlist on the path
  excludeSelf?: string;      // skip if href equals this absolute URL
}): string[] {
  const out = new Set<string>();
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    let href = m[1].trim();
    if (!href) continue;
    // Drop fragments and queries for normalization.
    href = href.split("#")[0].split("?")[0];
    if (!href) continue;
    let abs: string;
    if (href.startsWith("//")) {
      abs = "https:" + href;
    } else if (href.startsWith("/")) {
      abs = opts.origin + href;
    } else if (href.startsWith("http")) {
      abs = href;
    } else {
      continue;
    }
    // Must be on the configured origin.
    if (!abs.startsWith(opts.origin + "/")) continue;
    const path = abs.slice(opts.origin.length);
    if (!opts.pathPrefixes.some((p) => path.startsWith(p))) continue;
    if (opts.pathRegex && !opts.pathRegex.test(path)) continue;
    if (opts.excludeSelf && abs === opts.excludeSelf) continue;
    // Strip trailing slash for consistency.
    out.add(abs.replace(/\/+$/, ""));
  }
  return Array.from(out);
}
