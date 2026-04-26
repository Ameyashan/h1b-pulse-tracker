import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-custom";
import { ReportFeed } from "@/components/ReportFeed";
import type { Report } from "@/lib/types";

type Classification = "selected" | "not_selected";
type WageLevel = "1" | "2" | "3" | "4";
type Education = "Masters" | "Bachelors" | "Other";

interface SignalRow {
  id: string;
  classification: string;
  wage_level: string | null;
  education_level: string | null;
  law_firm: string | null;
  created_utc: string;
}

const WAGE_LABELS: Record<WageLevel, string> = {
  "1": "Level 1",
  "2": "Level 2",
  "3": "Level 3",
  "4": "Level 4",
};
const EDU_LABELS: Record<Education, string> = {
  Masters: "Master's",
  Bachelors: "Bachelor's",
  Other: "Other",
};

function fmt(n: number) {
  return n.toLocaleString("en-US");
}
function rate(sel: number, not: number) {
  const total = sel + not;
  return total ? Math.round((sel / total) * 100) : 0;
}

export function LotteryTab() {
  const [reports, setReports] = useState<SignalRow[]>([]);
  const [status, setStatus] = useState<Classification | "">("");
  const [wageLevel, setWageLevel] = useState<WageLevel | "">("");
  const [education, setEducation] = useState<Education | "">("");
  const [lawFirm, setLawFirm] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [firmSearch, setFirmSearch] = useState("");

  const fetchReports = useCallback(async () => {
    const PAGE = 1000;
    const all: SignalRow[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("signals")
        .select("id, classification, wage_level, education_level, law_firm, created_utc")
        .in("classification", ["selected", "not_selected"])
        .order("created_utc", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) {
        console.error("Failed to load signals", error);
        return;
      }
      all.push(...((data as SignalRow[]) ?? []));
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
    setReports(all);
  }, []);

  useEffect(() => {
    fetchReports();
    const ch = supabase
      .channel("lottery-signals")
      .on("postgres_changes", { event: "*", schema: "public", table: "signals" }, () => fetchReports())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchReports]);

  const { totals, byWage, byEducation, byFirm } = useMemo(() => {
    const sel = reports.filter((r) => r.classification === "selected").length;
    const not = reports.filter((r) => r.classification === "not_selected").length;

    const wage = (Object.keys(WAGE_LABELS) as WageLevel[]).map((lvl) => {
      const subset = reports.filter((r) => r.wage_level === lvl);
      const s = subset.filter((r) => r.classification === "selected").length;
      const n = subset.filter((r) => r.classification === "not_selected").length;
      return { level: WAGE_LABELS[lvl], sel: s, not: n, rate: rate(s, n) };
    });

    const edu = (Object.keys(EDU_LABELS) as Education[]).map((e) => {
      const subset = reports.filter((r) => r.education_level === e);
      const s = subset.filter((r) => r.classification === "selected").length;
      const n = subset.filter((r) => r.classification === "not_selected").length;
      return { name: EDU_LABELS[e], sel: s, not: n, rate: rate(s, n) };
    });

    const firmMap = new Map<string, { sel: number; not: number }>();
    reports.forEach((r) => {
      if (!r.law_firm) return;
      const curr = firmMap.get(r.law_firm) ?? { sel: 0, not: 0 };
      if (r.classification === "selected") curr.sel += 1;
      else if (r.classification === "not_selected") curr.not += 1;
      firmMap.set(r.law_firm, curr);
    });
    const firms = Array.from(firmMap.entries())
      .map(([name, v]) => ({
        name,
        sel: v.sel,
        not: v.not,
        reports: v.sel + v.not,
        rate: rate(v.sel, v.not),
      }))
      .sort((a, b) => b.reports - a.reports);

    return {
      totals: { sel, not, total: sel + not },
      byWage: wage,
      byEducation: edu,
      byFirm: firms,
    };
  }, [reports]);

  const filteredFirms = useMemo(() => {
    const q = firmSearch.trim().toLowerCase();
    const list = q ? byFirm.filter((f) => f.name.toLowerCase().includes(q)) : byFirm;
    return list.slice(0, 12);
  }, [byFirm, firmSearch]);

  const canSubmit = status && wageLevel && education && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-report", {
        body: {
          classification: status,
          wage_level: wageLevel,
          education_level: education,
          law_firm: lawFirm || null,
          honeypot,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error.includes("Too many") ? "Too many submissions. Try again later." : data.error);
        return;
      }
      toast.success("Report submitted! Thank you.");
      setStatus("");
      setWageLevel("");
      setEducation("");
      setLawFirm("");
      fetchReports();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const total = totals.sel + totals.not;
  const selPct = total ? Math.round((totals.sel / total) * 100) : 0;
  const notPct = total ? 100 - selPct : 0;

  return (
    <section>
      <div
        className="rd-card"
        style={{
          marginBottom: 20,
          background: "linear-gradient(135deg, var(--accent-soft), var(--bg-elev))",
          borderColor: "rgba(16,185,129,.25)",
        }}
      >
        <div className="card-head-row">
          <div>
            <div className="kicker" style={{ color: "var(--accent-ink)" }}>FY2027 Lottery Results · Crowdsourced</div>
            <div className="card-title" style={{ fontSize: 22, letterSpacing: "-.01em" }}>Selected in the FY2027 lottery?</div>
            <div className="card-subtitle" style={{ marginTop: 4 }}>
              Share your result anonymously to help the community.
            </div>
          </div>
        </div>
      </div>

      <div className="rd-card" style={{ marginBottom: 20 }}>
        <div className="card-title">Report your H1B lottery result</div>
        <div className="card-subtitle">Anonymous · takes 30 seconds · helps the community</div>

        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
          <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Result</label>
            <div className="segment">
              <button className={status === "selected" ? "active" : ""} onClick={() => setStatus("selected")}>✓ Selected</button>
              <button className={status === "not_selected" ? "active" : ""} onClick={() => setStatus("not_selected")}>✕ Not selected</button>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Wage level</label>
            <select className="form-input" value={wageLevel} onChange={(e) => setWageLevel(e.target.value as WageLevel)}>
              <option value="">Select…</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Education</label>
            <select className="form-input" value={education} onChange={(e) => setEducation(e.target.value as Education)}>
              <option value="">Select…</option>
              <option value="Masters">Master's</option>
              <option value="Bachelors">Bachelor's</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Law firm</label>
            <input
              className="form-input"
              placeholder="Type to search…"
              value={lawFirm}
              onChange={(e) => setLawFirm(e.target.value)}
            />
          </div>
          <div className="form-field" style={{ justifyContent: "flex-end" }}>
            <button
              className="rd-btn btn-accent"
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{ padding: 10, justifyContent: "center", opacity: canSubmit ? 1 : 0.5 }}
            >
              {submitting ? "Submitting…" : "✓ Submit report"}
            </button>
          </div>
        </div>

        <div className="notice warn" style={{ marginTop: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            H1B Pulse aggregates crowd-sourced signals from Reddit r/h1b. Not affiliated with USCIS. Always verify at <u>myUSCIS.gov</u>.
          </span>
        </div>
      </div>

      <div className="kpi-row" style={{ marginBottom: 16 }}>
        <div className="rd-stat">
          <div className="kicker">Selected</div>
          <div className="value accent-col">{fmt(totals.sel)}</div>
          <div className="sub">{selPct}% of reports</div>
        </div>
        <div className="rd-stat">
          <div className="kicker">Not selected</div>
          <div className="value danger-col">{fmt(totals.not)}</div>
          <div className="sub">{notPct}% of reports</div>
        </div>
        <div className="rd-stat">
          <div className="kicker">Total reports</div>
          <div className="value">{fmt(total)}</div>
          <div className="progress">
            <span className="sel" style={{ width: `${selPct}%` }} />
            <span className="not" style={{ width: `${notPct}%` }} />
          </div>
        </div>
      </div>

      <div className="kicker" style={{ margin: "8px 0 12px" }}>By wage level</div>
      <div className="four-col" style={{ marginBottom: 16 }}>
        {byWage.map((w) => (
          <div className="rd-stat" key={w.level}>
            <div className="kicker">{w.level}</div>
            <div className="inline-stats">
              <span className="value accent-col">{fmt(w.sel)}</span>
              <span className="sep">/</span>
              <span className="value danger-col" style={{ fontSize: 22 }}>{fmt(w.not)}</span>
            </div>
            <div className="sub">{w.rate}% selection rate</div>
            <div className="progress">
              <span className="sel" style={{ width: `${w.rate}%` }} />
              <span className="not" style={{ width: `${100 - w.rate}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="kicker" style={{ margin: "8px 0 12px" }}>By education</div>
      <div className="three-col" style={{ marginBottom: 16 }}>
        {byEducation.map((e) => (
          <div className="rd-stat" key={e.name}>
            <div className="kicker">{e.name}</div>
            <div className="inline-stats">
              <span className="value accent-col">{fmt(e.sel)}</span>
              <span className="sep">/</span>
              <span className="value danger-col" style={{ fontSize: 22 }}>{fmt(e.not)}</span>
            </div>
            <div className="sub">{e.rate}% selection rate</div>
            <div className="progress">
              <span className="sel" style={{ width: `${e.rate}%` }} />
              <span className="not" style={{ width: `${100 - e.rate}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card-head-row" style={{ marginTop: 8 }}>
        <div className="card-title">By law firm</div>
        <input
          className="form-input"
          style={{ maxWidth: 240, padding: "7px 11px", fontSize: 13 }}
          placeholder="🔍 Search law firm…"
          value={firmSearch}
          onChange={(e) => setFirmSearch(e.target.value)}
        />
      </div>
      <div className="four-col" style={{ marginTop: 12, marginBottom: 16 }}>
        {filteredFirms.length === 0 ? (
          <div className="card-subtitle" style={{ gridColumn: "1 / -1" }}>
            {firmSearch ? "No firms match that search." : "No law firm data yet."}
          </div>
        ) : (
          filteredFirms.map((lf) => (
            <div className="lawfirm-card" key={lf.name}>
              <div className="name">{lf.name}</div>
              <div className="nums">
                <span className="sel">{fmt(lf.sel)}</span>
                <span className="sep">/</span>
                <span className="not">{fmt(lf.not)}</span>
              </div>
              <div className="rate">{lf.rate}% selection · {lf.reports} reports</div>
              <div className="progress" style={{ marginTop: 10 }}>
                <span className="sel" style={{ width: `${lf.rate}%` }} />
                <span className="not" style={{ width: `${100 - lf.rate}%` }} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="rd-card" style={{ marginTop: 8 }}>
        <ReportFeed reports={reports as unknown as Report[]} />
      </div>
    </section>
  );
}
