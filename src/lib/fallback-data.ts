/**
 * Static fallback data snapshot — used when both API and localStorage cache are unavailable.
 * Last updated: 2026-03-31 based on ~3,475 known reports.
 * This will be superseded by localStorage cache once a successful fetch occurs.
 */
import type { Report } from "./types";

// Aggregate snapshot: we store summary counts rather than full rows
// to keep bundle size small. The ReportFeed will show "cached" notice.
export interface FallbackSummary {
  selected: number;
  notSelected: number;
  total: number;
  lastUpdated: string;
}

export const STATIC_FALLBACK_SUMMARY: FallbackSummary = {
  selected: 1146,
  notSelected: 2329,
  total: 3475,
  lastUpdated: "2026-03-30T12:00:00Z",
};

const CACHE_KEY = "h1b_reports_cache";
const CACHE_TS_KEY = "h1b_reports_cache_ts";
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

export function cacheReports(reports: Report[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(reports));
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function getCachedReports(): Report[] | null {
  try {
    const ts = localStorage.getItem(CACHE_TS_KEY);
    if (!ts) return null;
    const age = Date.now() - parseInt(ts, 10);
    if (age > CACHE_MAX_AGE_MS) return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Report[];
  } catch {
    return null;
  }
}
