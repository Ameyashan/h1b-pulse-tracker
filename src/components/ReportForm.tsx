import { useState } from "react";
import { CheckCircle2, XCircle, Send, PartyPopper, Bell, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LawFirmCombobox } from "@/components/LawFirmCombobox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { WageLevel, EducationLevel, ReportStatus } from "@/lib/types";

interface ReportFormProps {
  onSubmitted: () => void;
}

export function ReportForm({ onSubmitted }: ReportFormProps) {
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [wageLevel, setWageLevel] = useState<WageLevel | "">("");
  const [education, setEducation] = useState<EducationLevel | "">("");
  const [lawFirm, setLawFirm] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsEmail, setCongratsEmail] = useState("");
  const [congratsLoading, setCongratsLoading] = useState(false);
  const [congratsSubmitted, setCongratsSubmitted] = useState(false);
  const [showSorry, setShowSorry] = useState(false);
  const [sorryEmail, setSorryEmail] = useState("");
  const [sorryLoading, setSorryLoading] = useState(false);
  const [sorrySubmitted, setSorrySubmitted] = useState(false);

  const canSubmit = status && wageLevel && education && !submitting;

  const handleCongratsNotify = async () => {
    if (!congratsEmail || !congratsEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setCongratsLoading(true);
    try {
      const { error } = await supabase
        .from("notification_emails")
        .insert({ email: congratsEmail.trim() });
      if (error) throw error;
      toast.success("You'll be notified when petition tracking launches!");
      setCongratsSubmitted(true);
      setTimeout(() => setShowCongrats(false), 2500);
    } catch (err) {
      console.error("Failed to save email:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCongratsLoading(false);
    }
  };

  const handleSorryNotify = async () => {
    if (!sorryEmail || !sorryEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSorryLoading(true);
    try {
      const { error } = await supabase
        .from("not_selected_emails")
        .insert({ email: sorryEmail.trim() });
      if (error) throw error;
      toast.success("We'll keep you updated with next steps!");
      setSorrySubmitted(true);
      setTimeout(() => setShowSorry(false), 2500);
    } catch (err) {
      console.error("Failed to save email:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSorryLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const wasSelected = status === "selected";
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
        if (data.error.includes("Too many")) {
          toast.error("You've submitted too many reports recently. Please try again later.");
        } else {
          throw new Error(data.error);
        }
        return;
      }

      toast.success("Report submitted! Thank you for contributing.");
      setStatus("");
      setWageLevel("");
      setEducation("");
      setLawFirm("");
      onSubmitted();

      if (wasSelected) {
        setShowCongrats(true);
        setCongratsEmail("");
        setCongratsSubmitted(false);
      } else {
        setShowSorry(true);
        setSorryEmail("");
        setSorrySubmitted(false);
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      // Handle rate limit (429) or other non-2xx responses
      if (err?.name === "FunctionsHttpError") {
        try {
          const errorBody = await err.context?.json?.();
          if (errorBody?.error?.includes("Too many")) {
            toast.error("You've already submitted a report from this device. Only one report per person is allowed.");
            return;
          }
        } catch {}
      }
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stat-card border-2 border-transparent relative" style={{ borderImage: 'linear-gradient(135deg, hsl(45 93% 47%), hsl(36 100% 50%), hsl(45 93% 47%)) 1' }}>
      {showCongrats && (
        <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300" style={{ minHeight: 'fit-content' }}>
          <button
            onClick={() => setShowCongrats(false)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="text-center space-y-2 max-w-sm">
            <PartyPopper className="h-8 w-8 text-selected mx-auto" />
            <h3 className="text-base font-bold text-foreground">
              Congratulations on your selection! 🎉
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Want to track your petition filing status? We're launching a Petition Tracker on April 4. Get notified!
            </p>
            {congratsSubmitted ? (
              <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium py-2">
                <Bell className="w-4 h-4" />
                You're on the list!
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={congratsEmail}
                  onChange={(e) => setCongratsEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCongratsNotify()}
                  className="flex-1 h-9 rounded-lg border border-border/60 bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleCongratsNotify}
                  disabled={congratsLoading}
                  className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-sm transition-colors whitespace-nowrap"
                >
                  {congratsLoading ? "..." : "Notify me"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <h2 className="text-sm font-semibold mb-3">Report Your H1B Lottery Result</h2>

      {/* Honeypot - invisible to users, bots will fill it */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        {/* Status */}
        <div className="flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">Result</label>
          <div className="flex gap-2">
            <button
              onClick={() => setStatus("selected")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
                status === "selected"
                  ? "status-badge-selected bg-selected/20"
                  : "border-border text-muted-foreground hover:border-selected/50 hover:text-selected"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Selected
            </button>
            <button
              onClick={() => setStatus("not_selected")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
                status === "not_selected"
                  ? "status-badge-not-selected bg-destructive/20"
                  : "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              }`}
            >
              <XCircle className="h-4 w-4" />
              Not Selected
            </button>
          </div>
        </div>

        {/* Wage Level */}
        <div className="sm:w-36 space-y-1.5">
          <label className="text-xs text-muted-foreground">Wage Level</label>
          <Select value={wageLevel} onValueChange={(v) => setWageLevel(v as WageLevel)}>
            <SelectTrigger className="bg-secondary border-border text-sm h-[42px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Level 1</SelectItem>
              <SelectItem value="2">Level 2</SelectItem>
              <SelectItem value="3">Level 3</SelectItem>
              <SelectItem value="4">Level 4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Education */}
        <div className="sm:w-40 space-y-1.5">
          <label className="text-xs text-muted-foreground">Education</label>
          <Select value={education} onValueChange={(v) => setEducation(v as EducationLevel)}>
            <SelectTrigger className="bg-secondary border-border text-sm h-[42px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Masters">Master's</SelectItem>
              <SelectItem value="Bachelors">Bachelor's</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Law Firm */}
        <div className="sm:w-48">
          <LawFirmCombobox value={lawFirm} onChange={setLawFirm} />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="h-[42px] px-5"
        >
          <Send className="h-4 w-4 mr-1.5" />
          Submit
        </Button>
      </div>
    </div>
  );
}
