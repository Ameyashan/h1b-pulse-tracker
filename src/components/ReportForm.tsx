import { useState } from "react";
import { CheckCircle2, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = status && wageLevel && education && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("signals").insert({
        source_id: `self_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        source_type: "self_report",
        classification: status,
        wage_level: wageLevel,
        education_level: education,
        title: `${status === "selected" ? "Selected" : "Not Selected"} — Level ${wageLevel}, ${education}`,
        body: "",
        permalink: "",
        author: "anonymous",
        created_utc: new Date().toISOString(),
        score: 0,
        employer_mentions: [],
        extracted_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Report submitted! Thank you for contributing.");
      setStatus("");
      setWageLevel("");
      setEducation("");
      onSubmitted();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stat-card">
      <h2 className="text-sm font-semibold mb-3">Report Your H1B Lottery Result</h2>
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
