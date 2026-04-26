import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-custom";

interface PetitionEntry {
  id: string;
  update_code: string;
  status: string;
  processing_type: string;
  service_center: string;
  wage_level: string;
  education: string;
  law_firm: string | null;
  filing_date: string | null;
  rfe_reason: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "filed_awaiting_receipt", label: "Filed - awaiting receipt", pill: "pending" },
  { value: "case_received", label: "Case received", pill: "received" },
  { value: "actively_reviewed", label: "Actively reviewed", pill: "received" },
  { value: "rfe_received", label: "RFE issued", pill: "pending" },
  { value: "rfe_responded", label: "RFE responded", pill: "pending" },
  { value: "approved", label: "Approved", pill: "approved" },
  { value: "denied", label: "Denied", pill: "pending" },
];
const PROCESSING_OPTIONS = [
  { value: "premium", label: "Premium" },
  { value: "regular", label: "Regular" },
];
const CENTER_OPTIONS = [
  { value: "texas", label: "Texas" },
  { value: "california", label: "California" },
  { value: "vermont", label: "Vermont" },
  { value: "nebraska", label: "Nebraska" },
];
const WAGE_OPTIONS = [
  { value: "level_1", label: "Level 1" },
  { value: "level_2", label: "Level 2" },
  { value: "level_3", label: "Level 3" },
  { value: "level_4", label: "Level 4" },
];
const EDUCATION_OPTIONS = [
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters_us", label: "Master's (US)" },
  { value: "masters_non_us", label: "Master's (non-US)" },
  { value: "phd", label: "PhD" },
];
const RFE_REASON_OPTIONS = [
  { value: "specialty_occupation", label: "Specialty occ." },
  { value: "wage_level", label: "Wage level" },
  { value: "employer_employee", label: "Er-ee rel." },
  { value: "qualifications", label: "Beneficiary" },
  { value: "maintenance_of_status", label: "Status" },
  { value: "other", label: "Other" },
];

const PENDING_STATUSES = new Set(["filed_awaiting_receipt", "case_received", "actively_reviewed", "not_yet_filed"]);

function generateUpdateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "PT-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
function statusLabel(v: string) {
  return STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;
}
function statusPill(v: string) {
  return STATUS_OPTIONS.find((o) => o.value === v)?.pill ?? "pending";
}
function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}
function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function PetitionTab() {
  const [entries, setEntries] = useState<PetitionEntry[]>([]);

  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState("");
  const [center, setCenter] = useState("");
  const [wage, setWage] = useState("");
  const [education, setEducation] = useState("");
  const [lawFirm, setLawFirm] = useState("");
  const [filingDate, setFilingDate] = useState("");
  const [rfeReason, setRfeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const [lookupCode, setLookupCode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("petition_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) {
      console.error("Failed to load petition entries", error);
      return;
    }
    setEntries((data as PetitionEntry[]) ?? []);
  }, []);

  useEffect(() => {
    fetchEntries();
    const ch = supabase
      .channel("petition-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "petition_entries" }, () => fetchEntries())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchEntries]);

  const stats = useMemo(() => {
    const total = entries.length;
    const approved = entries.filter((e) => e.status === "approved").length;
    const pending = entries.filter((e) => PENDING_STATUSES.has(e.status)).length;
    const rfe = entries.filter((e) => e.status === "rfe_received" || e.status === "rfe_responded").length;
    return { total, approved, pending, rfe };
  }, [entries]);

  const processingSnapshot = useMemo(() => {
    const premium = entries.filter((e) => e.processing_type === "premium").length;
    const regular = entries.filter((e) => e.processing_type === "regular").length;
    const total = premium + regular || 1;
    return { premium, regular, total };
  }, [entries]);

  const byCenter = useMemo(() => {
    const counts = CENTER_OPTIONS.map((c) => ({
      ...c,
      count: entries.filter((e) => e.service_center === c.value).length,
    }));
    const max = Math.max(...counts.map((c) => c.count), 1);
    return { counts, max };
  }, [entries]);

  const byRfe = useMemo(() => {
    const counts = RFE_REASON_OPTIONS.map((r) => ({
      ...r,
      count: entries.filter((e) => e.rfe_reason === r.value).length,
    })).sort((a, b) => b.count - a.count);
    const max = Math.max(...counts.map((c) => c.count), 1);
    return { counts: counts.slice(0, 4), max };
  }, [entries]);

  const canSubmit = status && processing && center && wage && education && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const code = generateUpdateCode();
      const { error } = await supabase.from("petition_entries").insert({
        update_code: code,
        status,
        processing_type: processing,
        service_center: center,
        wage_level: wage,
        education,
        law_firm: lawFirm || null,
        filing_date: filingDate || null,
        rfe_reason:
          status === "rfe_received" || status === "rfe_responded" ? rfeReason || null : null,
      });
      if (error) throw error;
      setSuccessCode(code);
      setStatus("");
      setProcessing("");
      setCenter("");
      setWage("");
      setEducation("");
      setLawFirm("");
      setFilingDate("");
      setRfeReason("");
      toast.success("Petition logged!");
      fetchEntries();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async () => {
    const code = lookupCode.trim().toUpperCase();
    if (!code) return;
    setLookingUp(true);
    try {
      const { data, error } = await supabase
        .from("petition_entries")
        .select("update_code, status")
        .eq("update_code", code)
        .maybeSingle();
      if (error) throw error;
      if (!data) toast.error("No petition found with that code");
      else toast.success(`Found ${data.update_code}. Current status: ${statusLabel(data.status)}`);
    } catch {
      toast.error("Lookup failed");
    } finally {
      setLookingUp(false);
    }
  };

  const isRfe = status === "rfe_received" || status === "rfe_responded";
  const total = stats.total || 1;
  const pctApproved = Math.round((stats.approved / total) * 100);
  const pctPending = Math.round((stats.pending / total) * 100);
  const pctRfe = Math.round((stats.rfe / total) * 100);

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
        <div className="kicker" style={{ color: "var(--accent-ink)" }}>FY2027 Petition Stage</div>
        <div className="card-title" style={{ fontSize: 22, letterSpacing: "-.01em" }}>Track your petition from filing to approval</div>
        <div className="card-subtitle" style={{ marginTop: 4 }}>
          Anonymous and crowdsourced — join {stats.total.toLocaleString()} filers already sharing status updates.
        </div>
      </div>

      {successCode ? (
        <div className="rd-card" style={{ marginBottom: 20, textAlign: "center" }}>
          <div className="card-title">Petition logged!</div>
          <div className="card-subtitle">Save this code to update your status later.</div>
          <div style={{ margin: "16px auto", fontFamily: "'Geist Mono', monospace", fontSize: 28, letterSpacing: 3, color: "var(--accent-ink)" }}>
            {successCode}
          </div>
          <button className="rd-btn btn-ghost" onClick={() => setSuccessCode(null)}>← Back</button>
        </div>
      ) : (
        <div className="rd-card" style={{ marginBottom: 20 }}>
          <div className="card-title">Report your H1B petition</div>
          <div className="card-subtitle">Status updates from the community help everyone see what's moving</div>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Select…</option>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Processing</label>
              <select className="form-input" value={processing} onChange={(e) => setProcessing(e.target.value)}>
                <option value="">Select…</option>
                {PROCESSING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Service center</label>
              <select className="form-input" value={center} onChange={(e) => setCenter(e.target.value)}>
                <option value="">Select…</option>
                {CENTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Wage level</label>
              <select className="form-input" value={wage} onChange={(e) => setWage(e.target.value)}>
                <option value="">Select…</option>
                {WAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Education</label>
              <select className="form-input" value={education} onChange={(e) => setEducation(e.target.value)}>
                <option value="">Select…</option>
                {EDUCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Law firm</label>
              <input className="form-input" placeholder="Type to search…" value={lawFirm} onChange={(e) => setLawFirm(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Filing date</label>
              <input className="form-input" type="date" value={filingDate} onChange={(e) => setFilingDate(e.target.value)} />
            </div>
            {isRfe && (
              <div className="form-field">
                <label className="form-label">RFE reason</label>
                <select className="form-input" value={rfeReason} onChange={(e) => setRfeReason(e.target.value)}>
                  <option value="">Select…</option>
                  {RFE_REASON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
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
            <span>H1B Pulse aggregates crowd-sourced data. Not affiliated with USCIS. Verify petition status at <u>myUSCIS.gov</u>.</span>
          </div>
        </div>
      )}

      <div className="rd-card" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" />
          </svg>
          <strong>Update existing petition?</strong>
        </div>
        <input
          className="form-input"
          placeholder="Enter code: PT-XXXX"
          style={{ flex: 1, minWidth: 220 }}
          value={lookupCode}
          onChange={(e) => setLookupCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
        />
        <button className="rd-btn btn-ghost" onClick={handleLookup} disabled={lookingUp}>
          {lookingUp ? "…" : "Look up"}
        </button>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>or check your email for a magic link</span>
      </div>

      <div className="four-col" style={{ marginBottom: 16 }}>
        <div className="rd-stat"><div className="kicker">Total tracked</div><div className="value">{stats.total.toLocaleString()}</div><div className="sub">petitions logged</div></div>
        <div className="rd-stat"><div className="kicker">Approved</div><div className="value accent-col">{stats.approved.toLocaleString()}</div><div className="sub">{stats.total ? `${pctApproved}%` : "—"}</div></div>
        <div className="rd-stat"><div className="kicker">Pending</div><div className="value">{stats.pending.toLocaleString()}</div><div className="sub">{stats.total ? `${pctPending}%` : "—"}</div></div>
        <div className="rd-stat"><div className="kicker">RFE issued</div><div className="value danger-col">{stats.rfe.toLocaleString()}</div><div className="sub">{stats.total ? `${pctRfe}%` : "—"}</div></div>
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="rd-card">
          <div className="card-title">Processing snapshot</div>
          <div className="card-subtitle">Split across premium & regular filers</div>
          <Bar label="Premium" color="blue" width={Math.round((processingSnapshot.premium / processingSnapshot.total) * 100)} val={processingSnapshot.premium.toLocaleString()} />
          <Bar label="Regular" color="purple" width={Math.round((processingSnapshot.regular / processingSnapshot.total) * 100)} val={processingSnapshot.regular.toLocaleString()} />
        </div>
        <div className="rd-card">
          <div className="card-title">By service center</div>
          <div className="card-subtitle">Where the community's filings landed</div>
          {byCenter.counts.map((c) => (
            <Bar key={c.value} label={c.label} color="green" width={Math.round((c.count / byCenter.max) * 100)} val={c.count.toLocaleString()} />
          ))}
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="rd-card">
          <div className="card-title">Top RFE reasons</div>
          <div className="card-subtitle">Self-reported</div>
          {byRfe.counts.every((r) => r.count === 0) ? (
            <div className="card-subtitle">No RFE reasons reported yet.</div>
          ) : (
            byRfe.counts.map((r) => (
              <Bar key={r.value} label={r.label} color="warn" width={Math.round((r.count / byRfe.max) * 100)} val={r.count.toLocaleString()} />
            ))
          )}
        </div>
        <div className="rd-card">
          <div className="card-title">Status mix</div>
          <div className="card-subtitle">Distribution across reported statuses</div>
          {STATUS_OPTIONS.map((s) => {
            const n = entries.filter((e) => e.status === s.value).length;
            const w = stats.total ? Math.round((n / stats.total) * 100) : 0;
            return <Bar key={s.value} label={s.label} color="green" width={w} val={n.toLocaleString()} />;
          })}
        </div>
      </div>

      <div className="rd-card">
        <div className="card-head-row">
          <div>
            <div className="card-title">Recent reports</div>
            <div className="card-subtitle">Freshest crowd activity</div>
          </div>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Status</th><th>Days</th><th>Type</th><th>Center</th><th>Wage</th><th>Law firm</th><th>When</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--ink-3)" }}>No petitions reported yet. Be the first!</td></tr>
            ) : (
              entries.slice(0, 20).map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className={`status-pill ${statusPill(e.status)}`}>
                      <span className="pdot" />{statusLabel(e.status)}
                    </span>
                  </td>
                  <td className="mono">{daysSince(e.created_at)}</td>
                  <td style={{ textTransform: "capitalize" }}>{e.processing_type}</td>
                  <td style={{ textTransform: "capitalize" }}>{e.service_center}</td>
                  <td>{WAGE_OPTIONS.find((w) => w.value === e.wage_level)?.label || e.wage_level}</td>
                  <td>{e.law_firm || "—"}</td>
                  <td>{relativeTime(e.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Bar({ label, color, width, val }: { label: string; color: "green" | "blue" | "purple" | "warn"; width: number; val: string }) {
  return (
    <div className="rd-bar">
      <span className="label">{label}</span>
      <div className="track"><div className={`fill ${color}`} style={{ width: `${Math.min(100, Math.max(0, width))}%` }} /></div>
      <span className="val">{val}</span>
    </div>
  );
}
