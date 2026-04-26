import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export type ChatProfile = {
  current_visa_status: string | null;
  lottery_status: string | null;
  degree_level: string | null;
  field_of_study: string | null;
  employer_type: string | null;
  country_of_birth: string | null;
};

interface Props {
  userId: string;
  open: boolean;
  onComplete: (profile: ChatProfile) => void;
  onSkip: () => void;
}

const VISA_OPTIONS: { value: string; label: string }[] = [
  { value: "f1", label: "F-1 student" },
  { value: "f1_opt", label: "F-1 OPT" },
  { value: "f1_stem_opt", label: "F-1 STEM OPT" },
  { value: "h1b", label: "H-1B (current employer)" },
  { value: "h1b_transfer", label: "H-1B (transferring)" },
  { value: "l1", label: "L-1" },
  { value: "o1", label: "O-1" },
  { value: "green_card_pending", label: "Green card pending" },
  { value: "none", label: "None / outside US" },
  { value: "other", label: "Other" },
];

const LOTTERY_OPTIONS: { value: string; label: string }[] = [
  { value: "selected_fy26", label: "Selected this cycle" },
  { value: "not_selected_fy26", label: "Not selected this cycle" },
  { value: "waitlist", label: "Waitlisted" },
  { value: "not_entered", label: "Didn't enter" },
  { value: "unknown", label: "Not sure" },
];

const DEGREE_OPTIONS: { value: string; label: string }[] = [
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "other", label: "Other" },
];

const EMPLOYER_OPTIONS: { value: string; label: string }[] = [
  { value: "private", label: "Private company" },
  { value: "cap_exempt_university", label: "University (cap-exempt)" },
  { value: "cap_exempt_nonprofit_research", label: "Nonprofit research (cap-exempt)" },
  { value: "government_research", label: "Government research" },
  { value: "unemployed", label: "Not employed" },
  { value: "other", label: "Other" },
];

function Pills({ value, onChange, options }: { value: string | null; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: `1px solid ${active ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
              background: active ? "hsl(var(--primary))" : "transparent",
              color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 120ms",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function PulseAIOnboarding({ userId, open, onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [lotteryStatus, setLotteryStatus] = useState<string | null>(null);
  const [visaStatus, setVisaStatus] = useState<string | null>(null);
  const [degreeLevel, setDegreeLevel] = useState<string | null>(null);
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [employerType, setEmployerType] = useState<string | null>(null);
  const [countryOfBirth, setCountryOfBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      current_visa_status: visaStatus,
      lottery_status: lotteryStatus,
      degree_level: degreeLevel,
      field_of_study: fieldOfStudy.trim() || null,
      employer_type: employerType,
      country_of_birth: countryOfBirth.trim() || null,
      chat_onboarding_completed_at: new Date().toISOString(),
    };
    const { error: upErr } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId);
    setSaving(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    onComplete({
      current_visa_status: payload.current_visa_status,
      lottery_status: payload.lottery_status,
      degree_level: payload.degree_level,
      field_of_study: payload.field_of_study,
      employer_type: payload.employer_type,
      country_of_birth: payload.country_of_birth,
    });
  }

  const canNext0 = !!lotteryStatus;
  const canNext1 = !!visaStatus;
  const canFinish = !!degreeLevel && !!employerType;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onSkip(); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Help Pulse get to know you</DialogTitle>
          <DialogDescription>
            Three quick questions so every answer is tailored to your situation. You can update these later.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: "flex", gap: 6, margin: "8px 0 16px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= step ? "hsl(var(--primary))" : "hsl(var(--muted))",
                transition: "background 200ms",
              }}
            />
          ))}
        </div>

        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Label>Where do you stand with the H-1B lottery this cycle?</Label>
            <Pills value={lotteryStatus} onChange={setLotteryStatus} options={LOTTERY_OPTIONS} />
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Label>What's your current visa status?</Label>
            <Pills value={visaStatus} onChange={setVisaStatus} options={VISA_OPTIONS} />
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Label>Highest degree</Label>
              <Pills value={degreeLevel} onChange={setDegreeLevel} options={DEGREE_OPTIONS} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Label htmlFor="field">Field of study (optional)</Label>
              <Input
                id="field"
                placeholder="e.g. Computer Science"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Label>Employer type</Label>
              <Pills value={employerType} onChange={setEmployerType} options={EMPLOYER_OPTIONS} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Label htmlFor="country">Country of birth (optional, for visa-bulletin questions)</Label>
              <Input
                id="country"
                placeholder="e.g. India"
                value={countryOfBirth}
                onChange={(e) => setCountryOfBirth(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && <div style={{ color: "hsl(var(--destructive))", fontSize: 13, marginTop: 8 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 8 }}>
          <Button variant="ghost" onClick={onSkip} disabled={saving}>
            Skip for now
          </Button>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>
                Back
              </Button>
            )}
            {step < 2 && (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={(step === 0 && !canNext0) || (step === 1 && !canNext1)}
              >
                Next
              </Button>
            )}
            {step === 2 && (
              <Button onClick={save} disabled={!canFinish || saving}>
                {saving ? "Saving…" : "Finish"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
