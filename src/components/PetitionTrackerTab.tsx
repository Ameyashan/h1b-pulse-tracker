import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, ArrowLeft, AlertTriangle, RefreshCw, ExternalLink, CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/* ── types ── */
interface PetitionEntry {
  id: string;
  update_code: string;
  status: string;
  processing_type: string;
  service_center: string;
  wage_level: string;
  education: string;
  job_category: string | null;
  filing_date: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "not_yet_filed", label: "Not Yet Filed" },
  { value: "filed_awaiting_receipt", label: "Filed - Awaiting Receipt" },
  { value: "case_received", label: "Case Received" },
  { value: "actively_reviewed", label: "Actively Reviewed" },
  { value: "rfe_received", label: "RFE Received" },
  { value: "rfe_responded", label: "RFE Responded" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
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

function generateUpdateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "PT-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function statusLabel(val: string) {
  return STATUS_OPTIONS.find((o) => o.value === val)?.label ?? val;
}
function statusColor(val: string) {
  if (val === "approved") return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" };
  if (val === "denied") return { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" };
  if (val.startsWith("rfe")) return { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" };
  if (val === "actively_reviewed" || val === "case_received") return { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" };
  return { bg: "bg-muted/40", text: "text-muted-foreground", border: "border-border/60" };
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}
function relativeTime(dateStr: string) {
  const d = daysSince(dateStr);
  if (d === 0) return "today";
  if (d === 1) return "1d ago";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

/* ── Styled Select ── */
function DarkSelect({ label, value, onChange, options, placeholder = "Select" }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] uppercase tracking-[1px] font-mono text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-[10px] bg-[#1a2030] border border-[#2a3347] px-3 text-sm text-foreground font-mono appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Main Component ── */
export function PetitionTrackerTab() {
  const [entries, setEntries] = useState<PetitionEntry[]>([]);

  // Form state
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState("");
  const [center, setCenter] = useState("");
  const [wage, setWage] = useState("");
  const [education, setEducation] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [filingDate, setFilingDate] = useState<Date | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  // Success state
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [magicEmail, setMagicEmail] = useState("");
  const [sendingLink, setSendingLink] = useState(false);

  // Lookup state
  const [lookupCode, setLookupCode] = useState("");
  const [lookupEntry, setLookupEntry] = useState<PetitionEntry | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editProcessing, setEditProcessing] = useState("");
  const [editCenter, setEditCenter] = useState("");
  const [editWage, setEditWage] = useState("");
  const [editEducation, setEditEducation] = useState("");
  const [editJob, setEditJob] = useState("");
  const [editFiling, setEditFiling] = useState("");
  const [saving, setSaving] = useState(false);

  // Email CTA
  const [ctaEmail, setCtaEmail] = useState("");
  const [ctaLoading, setCtaLoading] = useState(false);
  const [ctaSubmitted, setCtaSubmitted] = useState(false);

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase.from("petition_entries").select("*").order("created_at", { ascending: false });
    if (data) setEntries(data as PetitionEntry[]);
  }, []);

  useEffect(() => {
    fetchEntries();
    const ch = supabase
      .channel("petition-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "petition_entries" }, () => fetchEntries())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchEntries]);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!status || !processing || !center || !wage || !education) {
      toast.error("Please fill in all required fields");
      return;
    }
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
        job_category: jobCategory || null,
        filing_date: filingDate ? format(filingDate, "MMM d") : null,
      });
      if (error) throw error;
      setSuccessCode(code);
      setStatus(""); setProcessing(""); setCenter(""); setWage(""); setEducation(""); setJobCategory(""); setFilingDate(undefined);
      toast.success("Petition logged!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Magic link email ── */
  const handleSendLink = async () => {
    if (!magicEmail || !magicEmail.includes("@")) { toast.error("Please enter a valid email"); return; }
    setSendingLink(true);
    try {
      const { error } = await supabase.from("petition_entries").update({ email: magicEmail.trim() }).eq("update_code", successCode!);
      if (error) throw error;
      toast.success("Email saved! We'll send you update links.");
      setMagicEmail("");
    } catch { toast.error("Failed to save email"); } finally { setSendingLink(false); }
  };

  /* ── Lookup ── */
  const handleLookup = async () => {
    if (!lookupCode.trim()) return;
    setLookingUp(true);
    try {
      const { data, error } = await supabase.from("petition_entries").select("*").eq("update_code", lookupCode.trim().toUpperCase()).maybeSingle();
      if (error) throw error;
      if (!data) { toast.error("No petition found with that code"); setLookupEntry(null); return; }
      const entry = data as PetitionEntry;
      setLookupEntry(entry);
      setEditMode(true);
      setEditStatus(entry.status);
      setEditProcessing(entry.processing_type);
      setEditCenter(entry.service_center);
      setEditWage(entry.wage_level);
      setEditEducation(entry.education);
      setEditJob(entry.job_category || "");
      setEditFiling(entry.filing_date || "");
    } catch { toast.error("Lookup failed"); } finally { setLookingUp(false); }
  };

  const handleSaveUpdate = async () => {
    if (!lookupEntry) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("petition_entries").update({
        status: editStatus, processing_type: editProcessing, service_center: editCenter,
        wage_level: editWage, education: editEducation,
        job_category: editJob || null, filing_date: editFiling || null, updated_at: new Date().toISOString(),
      }).eq("update_code", lookupEntry.update_code);
      if (error) throw error;
      toast.success("Petition updated!");
      setEditMode(false); setLookupEntry(null); setLookupCode("");
    } catch { toast.error("Update failed"); } finally { setSaving(false); }
  };

  /* ── CTA email ── */
  const handleCtaSubscribe = async () => {
    if (!ctaEmail || !ctaEmail.includes("@")) { toast.error("Please enter a valid email"); return; }
    setCtaLoading(true);
    try {
      const { error } = await supabase.from("notification_emails").insert({ email: ctaEmail.trim() });
      if (error) throw error;
      toast.success("You're subscribed!");
      setCtaEmail(""); setCtaSubmitted(true);
    } catch { toast.error("Something went wrong"); } finally { setCtaLoading(false); }
  };

  /* ── Dashboard calculations ── */
  const total = entries.length;
  const approved = entries.filter((e) => e.status === "approved").length;
  const pending = entries.filter((e) => ["case_received", "actively_reviewed", "filed_awaiting_receipt", "not_yet_filed"].includes(e.status)).length;
  const rfeCount = entries.filter((e) => ["rfe_received", "rfe_responded"].includes(e.status)).length;

  return (
    <div className="space-y-5">
      {/* 1. Transition Banner */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 p-4 sm:p-5">
        <p className="font-bold text-foreground text-sm sm:text-base">Selected in the FY2027 lottery?</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Track your petition from filing to approval. Anonymous and crowdsourced.</p>
      </div>

      {/* 2/3. Form or Success State */}
      {successCode ? (
        <div className="rounded-[14px] border border-border/60 bg-card p-6 sm:p-8 text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Petition Logged!</h2>
          <p className="text-sm text-muted-foreground">Your anonymous entry has been added to the tracker. Come back anytime to update your status.</p>

          <div className="mx-auto max-w-xs rounded-xl border border-border/60 bg-[#1a2030] p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[1px] font-mono text-muted-foreground">Your Update Code</p>
            <p className="text-2xl font-mono font-bold text-emerald-400 tracking-[3px]">{successCode}</p>
            <p className="text-xs text-muted-foreground">Save this code to update your petition status later</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Or get magic update links via email (recommended)</p>
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <input
                type="email" placeholder="your@email.com" value={magicEmail}
                onChange={(e) => setMagicEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendLink()}
                className="flex-1 h-11 rounded-[10px] bg-[#1a2030] border border-[#2a3347] px-4 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button onClick={handleSendLink} disabled={sendingLink}
                className="h-11 px-5 rounded-[10px] bg-emerald-500 hover:bg-emerald-500/90 text-background font-bold text-sm transition-colors whitespace-nowrap disabled:opacity-50">
                {sendingLink ? "..." : "Send Link"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">We'll email you a magic link when it's time to update. Never shared publicly.</p>
          </div>

          <button onClick={() => setSuccessCode(null)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Report Your H1B Petition</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <DarkSelect label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
            <DarkSelect label="Processing" value={processing} onChange={setProcessing} options={PROCESSING_OPTIONS} />
            <DarkSelect label="Service Center" value={center} onChange={setCenter} options={CENTER_OPTIONS} />
            <DarkSelect label="Wage Level" value={wage} onChange={setWage} options={WAGE_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <DarkSelect label="Education" value={education} onChange={setEducation} options={EDUCATION_OPTIONS} />
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-[1px] font-mono text-muted-foreground">Job Category</label>
              <input type="text" placeholder="e.g., Software Engineer" value={jobCategory}
                onChange={(e) => setJobCategory(e.target.value)}
                className="w-full h-11 rounded-[10px] bg-[#1a2030] border border-[#2a3347] px-3 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-[1px] font-mono text-muted-foreground">Filing Date</label>
              <input type="text" placeholder="e.g., Apr 3" value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
                className="w-full h-11 rounded-[10px] bg-[#1a2030] border border-[#2a3347] px-3 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <button onClick={handleSubmit} disabled={submitting}
              className="h-11 rounded-[10px] bg-emerald-500 hover:bg-emerald-500/90 text-background font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? "..." : <>✓ Submit</>}
            </button>
          </div>
          {/* Disclaimer */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2.5 text-xs text-amber-200/80">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              H1B Pulse aggregates crowd-sourced data. This is not affiliated with or endorsed by USCIS. Always verify your petition status directly at{" "}
              <a href="https://myuscis.gov" target="_blank" rel="noopener noreferrer" className="underline text-amber-300 hover:text-amber-200">myUSCIS.gov</a>
            </p>
          </div>
        </div>
      )}

      {/* 4. Update Existing Petition */}
      {editMode && lookupEntry ? (
        <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">Updating: {lookupEntry.update_code}</h3>
            <button onClick={() => { setEditMode(false); setLookupEntry(null); setLookupCode(""); }}
              className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <DarkSelect label="Status" value={editStatus} onChange={setEditStatus} options={STATUS_OPTIONS} />
            <DarkSelect label="Processing" value={editProcessing} onChange={setEditProcessing} options={PROCESSING_OPTIONS} />
            <DarkSelect label="Service Center" value={editCenter} onChange={setEditCenter} options={CENTER_OPTIONS} />
            <DarkSelect label="Wage Level" value={editWage} onChange={setEditWage} options={WAGE_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <DarkSelect label="Education" value={editEducation} onChange={setEditEducation} options={EDUCATION_OPTIONS} />
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-[1px] font-mono text-muted-foreground">Job Category</label>
              <input type="text" value={editJob} onChange={(e) => setEditJob(e.target.value)}
                className="w-full h-11 rounded-[10px] bg-[#1a2030] border border-[#2a3347] px-3 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-[1px] font-mono text-muted-foreground">Filing Date</label>
              <input type="text" value={editFiling} onChange={(e) => setEditFiling(e.target.value)}
                className="w-full h-11 rounded-[10px] bg-[#1a2030] border border-[#2a3347] px-3 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <button onClick={handleSaveUpdate} disabled={saving}
              className="h-11 rounded-[10px] bg-emerald-500 hover:bg-emerald-500/90 text-background font-bold text-sm transition-colors disabled:opacity-50">
              {saving ? "..." : "Save Update"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[14px] border border-border/60 bg-card p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3">
          <span className="text-sm font-semibold text-foreground whitespace-nowrap flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Update existing petition?
          </span>
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <input
              type="text" placeholder="Enter code: PT-XXXX" value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              className="flex-1 h-10 rounded-[10px] bg-[#1a2030] border border-[#2a3347] px-3 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={handleLookup} disabled={lookingUp}
              className="h-10 px-4 rounded-[10px] bg-card border border-border/60 text-foreground font-semibold text-sm hover:bg-muted/40 transition-colors disabled:opacity-50">
              {lookingUp ? "..." : "Look Up"}
            </button>
          </div>
          <span className="text-xs text-muted-foreground">or check your email for a magic update link</span>
        </div>
      )}

      {/* 5. Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "TOTAL TRACKED", value: total, sub: "petitions logged", color: "emerald" },
          { label: "APPROVED", value: approved, sub: total === 0 ? "awaiting first report" : `${total > 0 ? ((approved / total) * 100).toFixed(0) : 0}%`, color: "emerald" },
          { label: "PENDING", value: pending, sub: total === 0 ? "awaiting first report" : `${total > 0 ? ((pending / total) * 100).toFixed(0) : 0}%`, color: "amber" },
          { label: "RFE ISSUED", value: rfeCount, sub: total === 0 ? "awaiting first report" : `${total > 0 ? ((rfeCount / total) * 100).toFixed(0) : 0}%`, color: "orange" },
        ].map((s) => (
          <div key={s.label} className="rounded-[14px] border border-border/60 bg-card p-4 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-${s.color}-500/10 blur-2xl -translate-y-1/2 translate-x-1/2`} />
            <p className="text-[10px] uppercase tracking-[1px] font-mono text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold font-mono mt-1 ${total === 0 ? "text-foreground/40" : "text-foreground"}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 6. Ghost Dashboard Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Processing Snapshot */}
        <GhostPanel title="Processing Snapshot" hasData={total > 0}>
          {total > 0 ? <ProcessingSnapshotContent entries={entries} /> : (
            <div className="space-y-3 opacity-25">
              <GhostBar label="Premium Processing" />
              <GhostBar label="Regular Processing" />
            </div>
          )}
        </GhostPanel>

        {/* By Service Center */}
        <GhostPanel title="By Service Center" hasData={total > 0}>
          {total > 0 ? <ServiceCenterContent entries={entries} /> : (
            <div className="space-y-3 opacity-25">
              <GhostBar label="Texas" />
              <GhostBar label="California" />
              <GhostBar label="Vermont" />
            </div>
          )}
        </GhostPanel>

        {/* Top RFE Reasons */}
        <GhostPanel title="Top RFE Reasons" hasData={false}>
          <div className="space-y-3 opacity-25">
            <GhostBar label="Specialty Occupation" />
            <GhostBar label="Wage Level" />
            <GhostBar label="Employer Rel." />
            <GhostBar label="Qualifications" />
          </div>
        </GhostPanel>

        {/* Processing Timeline */}
        <GhostPanel title="Processing Timeline" hasData={false}>
          <div className="flex items-end gap-1.5 h-16 opacity-25">
            {[30, 50, 20, 60, 40, 70, 35, 55].map((h, i) => (
              <div key={i} className="flex-1 bg-muted/60 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </GhostPanel>
      </div>

      {/* 7. Recent Reports */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-foreground">Recent Reports</h3>
        <div className="rounded-[14px] border border-border/60 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["STATUS", "DAYS", "TYPE", "CENTER", "CATEGORY", "WAGE", "WHEN"].map((h) => (
                    <th key={h} className="text-[10px] uppercase tracking-[1px] font-mono text-muted-foreground px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                      No petitions reported yet. Be the first to submit yours above!
                    </td>
                  </tr>
                ) : (
                  entries.slice(0, 20).map((e) => {
                    const sc = statusColor(e.status);
                    return (
                      <tr key={e.id} className="border-b border-border/20 last:border-0">
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} border ${sc.border}`}>
                            {statusLabel(e.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-foreground">{daysSince(e.created_at)}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{e.processing_type}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{e.service_center}</td>
                        <td className="px-4 py-3 text-muted-foreground">{e.job_category || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{WAGE_OPTIONS.find((w) => w.value === e.wage_level)?.label || e.wage_level}</td>
                        <td className="px-4 py-3 text-muted-foreground">{relativeTime(e.created_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 8. Email Capture CTA */}
      <div className="rounded-[14px] border border-border/60 bg-gradient-to-b from-card to-card/80 p-6 sm:p-8 text-center space-y-3">
        <h3 className="text-base font-bold text-foreground">Get notified when your cohort moves</h3>
        <p className="text-sm text-muted-foreground">We'll email you when we see approvals or RFEs for petitions like yours. No spam.</p>
        {ctaSubmitted ? (
          <p className="text-sm text-emerald-400 font-medium">You're subscribed!</p>
        ) : (
          <div className="flex items-center gap-2 max-w-sm mx-auto">
            <input type="email" placeholder="your@email.com" value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCtaSubscribe()}
              className="flex-1 h-11 rounded-[10px] bg-[#1a2030] border border-[#2a3347] px-4 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button onClick={handleCtaSubscribe} disabled={ctaLoading}
              className="h-11 px-5 rounded-[10px] bg-emerald-500 hover:bg-emerald-500/90 text-background font-bold text-sm transition-colors disabled:opacity-50">
              {ctaLoading ? "..." : "Subscribe"}
            </button>
          </div>
        )}
      </div>

      {/* 9. Footer */}
      <p className="text-center text-xs text-muted-foreground pb-8">
        All data is anonymous and crowdsourced · {total} petition{total !== 1 ? "s" : ""} tracked
      </p>
    </div>
  );
}

/* ── Ghost Panel Wrapper ── */
function GhostPanel({ title, hasData, children }: { title: string; hasData: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-border/60 bg-card p-4 relative overflow-hidden min-h-[140px]">
      <h4 className="text-sm font-bold text-foreground mb-3 italic">{title}</h4>
      {children}
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-[2px]">
          <span className="px-4 py-1.5 rounded-full bg-muted/80 text-xs font-medium text-muted-foreground border border-border/40">
            Populates as reports come in
          </span>
        </div>
      )}
    </div>
  );
}

function GhostBar({ label }: { label: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-mono text-muted-foreground">{label}</p>
      <div className="h-1.5 rounded-full bg-muted/30 w-full" />
    </div>
  );
}

/* ── Live content panels ── */
function ProcessingSnapshotContent({ entries }: { entries: PetitionEntry[] }) {
  const premium = entries.filter((e) => e.processing_type === "premium");
  const regular = entries.filter((e) => e.processing_type === "regular");
  const total = entries.length;
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-muted-foreground">Premium Processing</span>
          <span className="text-foreground">{premium.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/30"><div className="h-full rounded-full bg-blue-400" style={{ width: `${total ? (premium.length / total) * 100 : 0}%` }} /></div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-muted-foreground">Regular Processing</span>
          <span className="text-foreground">{regular.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/30"><div className="h-full rounded-full bg-purple-400" style={{ width: `${total ? (regular.length / total) * 100 : 0}%` }} /></div>
      </div>
    </div>
  );
}

function ServiceCenterContent({ entries }: { entries: PetitionEntry[] }) {
  const centers = CENTER_OPTIONS.map((c) => ({
    ...c,
    count: entries.filter((e) => e.service_center === c.value).length,
  }));
  const max = Math.max(...centers.map((c) => c.count), 1);
  return (
    <div className="space-y-3">
      {centers.map((c) => (
        <div key={c.value} className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-muted-foreground">{c.label}</span>
            <span className="text-foreground">{c.count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/30"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${(c.count / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
