import { useState } from "react";
import { ChevronDown, Send, AlertTriangle, GraduationCap, Building2, RefreshCw, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-custom";

interface TimelineStep {
  num: number;
  title: string;
  timing: string;
  timingColor: "green" | "amber" | "blue";
  summary: string;
  details: { heading: string; items: string[] }[];
  proTip?: string;
}

const STEPS: TimelineStep[] = [
  {
    num: 1,
    title: "Confirm Your Selection",
    timing: "Now",
    timingColor: "green",
    summary: "Verify your selection status on your USCIS online account and confirm with your employer/attorney.",
    details: [
      {
        heading: "What to Do",
        items: [
          "Log in to your USCIS online account to verify the selection notification",
          "Notify your employer and immigration attorney immediately",
          "Confirm your employer is willing to sponsor and file the H-1B petition",
          "If you used multiple registrations, decide which employer to proceed with",
        ],
      },
    ],
    proTip: "Don't rely solely on your employer's communication. Log in to your own USCIS account directly. Some employers delay notifying beneficiaries.",
  },
  {
    num: 2,
    title: "Gather Your Documents",
    timing: "Apr–May",
    timingColor: "amber",
    summary: "Collect all documents your attorney needs for the I-129 petition and supporting evidence.",
    details: [
      {
        heading: "Key Documents",
        items: [
          "Passport valid for at least 6 months beyond your intended start date",
          "All degree certificates, transcripts, and credential evaluations",
          "Current and prior immigration documents (I-20s, EADs, prior approvals)",
          "Resume/CV and detailed job offer letter with role description",
          "Certified Labor Condition Application (LCA) — your employer handles this",
        ],
      },
      {
        heading: "If You Studied Outside the U.S.",
        items: [
          "Get a credential evaluation from a NACES-member agency (WES, ECE, etc.)",
          "Evaluations can take 2–4 weeks — start immediately",
        ],
      },
    ],
    proTip: "Create a shared folder with your attorney. Upload documents as you collect them — don't wait until you have everything. The LCA alone takes 7+ days to certify.",
  },
  {
    num: 3,
    title: "Employer Files I-129 Petition",
    timing: "Apr–Jun 30",
    timingColor: "amber",
    summary: "Your employer files Form I-129 with USCIS. This is the core petition — deadline is June 30, 2025.",
    details: [
      {
        heading: "What Gets Filed",
        items: [
          "Form I-129 (Petition for Nonimmigrant Worker) with H-1B supplement",
          "Certified LCA from the Department of Labor",
          "Supporting evidence: degree evaluations, specialty occupation proof, employer docs",
          "Filing fee: $1,710 base + $600 Asylum Program Fee + possible $2,805 for premium processing",
        ],
      },
      {
        heading: "Premium vs. Regular Processing",
        items: [
          "Regular processing: 3–6 months (sometimes longer)",
          "Premium processing ($2,805): guaranteed 15 business-day response",
          "Your employer decides whether to use premium — ask early",
        ],
      },
    ],
    proTip: "If you're on OPT and it expires before Oct 1, discuss cap-gap extension eligibility with your attorney. Filing the I-129 before your OPT expires can extend your status.",
  },
  {
    num: 4,
    title: "Receive Receipt Notice (I-797C)",
    timing: "2–4 wks after filing",
    timingColor: "green",
    summary: "USCIS sends a receipt notice confirming they received the petition — your proof the case is pending.",
    details: [
      {
        heading: "What to Know",
        items: [
          "The receipt number (starts with EAC, WAC, LIN, or SRC) identifies your service center",
          "Track your case status online at egov.uscis.gov/casestatus",
          "The receipt notice is critical for cap-gap eligibility if you're on OPT",
          "Your employer/attorney receives it first — follow up if you haven't heard in 4 weeks",
        ],
      },
    ],
    proTip: "Save your receipt number somewhere safe. You'll need it for status checks, travel decisions, and eventually visa stamping. Set up USCIS case status text/email alerts.",
  },
  {
    num: 5,
    title: "Handle an RFE (If You Get One)",
    timing: "Varies",
    timingColor: "amber",
    summary: "USCIS may request more documentation. Don't panic — RFEs are common and manageable.",
    details: [
      {
        heading: "Common RFE Reasons",
        items: [
          "Specialty occupation: proof the role requires your specific degree",
          "Employer-employee relationship: common for consulting/staffing companies",
          "Beneficiary qualifications: additional proof your degree matches the role",
          "Wage level concerns: LCA wage level may seem too low for the role",
        ],
      },
      {
        heading: "Response Timeline",
        items: [
          "You typically get 87 days to respond (best to respond ASAP)",
          "Work with your attorney to craft a thorough response with additional evidence",
          "An expert opinion letter from a professor in your field can strengthen the case",
        ],
      },
    ],
    proTip: "An RFE is not a denial. Approval rates after RFE responses remain high. The key is a comprehensive, well-documented response.",
  },
  {
    num: 6,
    title: "Get Your Approval (I-797A)",
    timing: "3–8 mo after filing",
    timingColor: "green",
    summary: "USCIS approves your petition. Your H-1B status begins October 1.",
    details: [
      {
        heading: "What Happens at Approval",
        items: [
          "If you're in the U.S. with change of status: status automatically changes on Oct 1",
          "If you're abroad (consular processing): you'll need a visa stamp to enter",
          "The I-797A has a detachable I-94 — this is your proof of H-1B status",
          "Your H-1B is valid for 3 years (extendable to 6 years total)",
        ],
      },
    ],
    proTip: "Even after approval, avoid international travel until your status change is effective on Oct 1. Traveling before then can complicate your status.",
  },
  {
    num: 7,
    title: "Visa Stamping (If Needed)",
    timing: "After Oct 1",
    timingColor: "green",
    summary: "Need to travel internationally? You'll need an H-1B visa stamp from a U.S. consulate.",
    details: [
      {
        heading: "Visa Stamping Basics",
        items: [
          "Required only if you plan to travel outside the U.S. and re-enter",
          "You can work in the U.S. without a visa stamp if you did change of status",
          "Schedule a visa interview at a U.S. consulate (wait times vary by country)",
          "Bring: I-797A, passport, offer letter, LCA, DS-160 confirmation, pay stubs",
        ],
      },
      {
        heading: "Popular Consulates",
        items: [
          "India (Hyderabad, Chennai, Mumbai, Delhi): long wait times — book early",
          "Canada/Mexico: sometimes used for third-country nationals (risky, consult attorney)",
          "Check wait times at usvisascheduling.state.gov",
        ],
      },
    ],
    proTip: "If you don't need to travel, you don't need a visa stamp. Many H-1B holders work for months or years before stamping. Only stamp when you have concrete travel plans.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Can I start working on H-1B before October 1?",
    a: "No. H-1B cap-subject employment can only begin on October 1 of the fiscal year. If you're on OPT, you continue working under OPT authorization until then. The cap-gap provision may extend your OPT and work authorization if it would otherwise expire before Oct 1.",
  },
  {
    q: "What if my employer doesn't file on time?",
    a: "The I-129 must be filed by June 30, 2025 for the FY2027 cap season. If your employer misses this deadline, your selection is forfeited and you'd need to re-enter next year. Communicate with your employer early — especially if they're using an external law firm.",
  },
  {
    q: "Should I choose premium processing?",
    a: "Premium processing ($2,805) guarantees a 15 business-day response. It's worth it if your OPT is expiring, you have travel plans, or you want certainty. It doesn't increase approval odds — it just speeds up the decision. Your employer typically pays this fee.",
  },
  {
    q: "Can I change employers after H-1B approval?",
    a: "Yes. H-1B portability lets you start working for a new employer as soon as they file a new I-129 — you don't have to wait for approval. However, this only applies after your H-1B status is active (after Oct 1). You can't transfer during the petition period.",
  },
  {
    q: "What happens if my petition is denied?",
    a: "Denials are uncommon but happen. Your attorney can file a motion to reopen/reconsider, or appeal to the AAO. Your underlying status (e.g., OPT) isn't affected by a denial. You can also re-enter the lottery next year while maintaining status through other means.",
  },
];

const NOT_SELECTED_OPTIONS = [
  { icon: <GraduationCap className="w-5 h-5" />, title: "OPT / STEM OPT Extension", desc: "If on F-1, you may have OPT time or qualify for a 24-month STEM extension." },
  { icon: <Building2 className="w-5 h-5" />, title: "Cap-Exempt Employers", desc: "Universities, nonprofits, and research orgs can sponsor without the lottery." },
  { icon: <RefreshCw className="w-5 h-5" />, title: "Try Again Next Year", desc: "Maintain valid status and register again in the FY2028 lottery." },
  { icon: <Globe className="w-5 h-5" />, title: "Alternative Visas", desc: "Explore O-1, L-1, or EB categories as alternate paths." },
];

const timingColorMap = {
  green: "bg-emerald-500/15 text-emerald-400",
  amber: "bg-amber-500/15 text-amber-400",
  blue: "bg-blue-500/15 text-blue-400",
};

export function NextStepsTab() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = async () => {
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("notification_emails").insert({ email: email.trim() });
      if (error) throw error;

      // Send congrats email
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "h1b-selected-congrats",
          recipientEmail: email.trim(),
          idempotencyKey: `h1b-congrats-nextsteps-${email.trim().toLowerCase()}`,
        },
      });

      setSubmitted(true);
      toast.success("You're on the list!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-24">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Selected in FY2027 Lottery
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          You Got Selected — <span className="text-emerald-400">Now What?</span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Your complete roadmap from lottery selection to H-1B approval. Every step, every deadline, zero confusion.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex gap-2.5 items-start bg-amber-500/[0.06] border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          This guide is for informational purposes only and is not legal advice. Every case is different — consult a qualified immigration attorney and verify at{" "}
          <a href="https://myuscis.gov" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-2">
            myUSCIS.gov
          </a>.
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Steps</div>
          <div className="font-mono text-2xl font-medium text-emerald-400">7</div>
          <div className="text-[11px] text-muted-foreground mt-1">selection to approval</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Filing Deadline</div>
          <div className="font-mono text-2xl font-medium text-amber-400">Jun 30</div>
          <div className="text-[11px] text-muted-foreground mt-1">FY2027 cap season</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Typical Timeline</div>
          <div className="font-mono text-2xl font-medium text-blue-400">3–8 mo</div>
          <div className="text-[11px] text-muted-foreground mt-1">selection to approval</div>
        </div>
      </div>

      {/* Roadmap Section */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-1">Your Step-by-Step Roadmap</h2>
        <p className="text-sm text-muted-foreground mb-5">Click any step to expand details, tips, and what to watch out for.</p>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 via-border to-transparent" />

          <div className="space-y-2">
            {STEPS.map((step) => {
              const isActive = activeStep === step.num;
              return (
                <div
                  key={step.num}
                  className="relative pl-16 cursor-pointer"
                  onClick={() => setActiveStep(isActive ? null : step.num)}
                >
                  {/* Node */}
                  <div
                    className={`absolute left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                      isActive
                        ? "border-emerald-400 bg-emerald-500/15 shadow-[0_0_12px_rgba(74,222,128,0.08)]"
                        : "border-border bg-background hover:border-emerald-400 hover:bg-emerald-500/15"
                    }`}
                  >
                    <span className={`font-mono text-[10px] font-medium transition-colors ${isActive ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {step.num}
                    </span>
                  </div>

                  {/* Card */}
                  <div
                    className={`bg-card border rounded-xl p-5 transition-all ${
                      isActive
                        ? "border-emerald-400/30 shadow-[0_0_20px_rgba(74,222,128,0.08)]"
                        : "border-border hover:border-muted-foreground/30 hover:bg-card/80"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="text-base font-semibold">{step.title}</h3>
                      <span className={`shrink-0 font-mono text-xs px-2.5 py-0.5 rounded-full ${timingColorMap[step.timingColor]}`}>
                        {step.timing}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.summary}</p>

                    {/* Expand indicator */}
                    <div className={`flex items-center gap-1 text-xs mt-3 transition-colors ${isActive ? "text-emerald-400" : "text-muted-foreground"}`}>
                      <span>Details</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isActive ? "rotate-180" : ""}`} />
                    </div>

                    {/* Expanded detail */}
                    <div
                      className={`overflow-hidden transition-all duration-400 ${isActive ? "max-h-[800px]" : "max-h-0"}`}
                      style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
                    >
                      <div className="pt-4 mt-4 border-t border-border space-y-4">
                        {step.details.map((section, i) => (
                          <div key={i}>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-400 mb-2">{section.heading}</h4>
                            <ul className="space-y-1">
                              {section.items.map((item, j) => (
                                <li key={j} className="text-[13px] text-muted-foreground pl-4 relative leading-relaxed">
                                  <span className="absolute left-0 text-muted-foreground/50">→</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        {step.proTip && (
                          <div className="bg-blue-500/[0.06] border border-blue-500/15 rounded-lg px-3.5 py-3 text-[13px] text-muted-foreground leading-relaxed">
                            <strong className="text-blue-400 font-semibold">Pro Tip:</strong> {step.proTip}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Not Selected Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-1">Didn't Get Selected? Here's What You Can Do</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Not getting selected is frustrating, but you have real options:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {NOT_SELECTED_OPTIONS.map((opt, i) => (
            <div key={i} className="bg-secondary/50 border border-border rounded-lg p-4">
              <div className="mb-2 text-muted-foreground">{opt.icon}</div>
              <h4 className="text-sm font-semibold mb-1">{opt.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-emerald-500/[0.08] to-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl p-8 sm:p-10 text-center">
        <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">📊</div>
        <h3 className="text-xl sm:text-[22px] font-bold tracking-tight mb-2">Track Your Petition With The Community</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5 leading-relaxed">
          Crowdsourced petition tracker — real-time processing times, RFE rates, and where your case stands vs. others.
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><span className="text-emerald-400 font-bold">✓</span> Filing status tracking</span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><span className="text-emerald-400 font-bold">✓</span> RFE rate monitoring</span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><span className="text-emerald-400 font-bold">✓</span> Service center data</span>
        </div>

        {submitted ? (
          <div className="max-w-md mx-auto bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-6 py-3.5 text-emerald-400 font-semibold text-sm">
            ✓ You're on the list! We'll notify you when Petition Tracker launches.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNotify()}
              className="flex-1 bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-400 transition-colors"
            />
            <button
              onClick={handleNotify}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-background font-semibold text-sm rounded-lg px-6 py-3 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Notify Me
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">Join 63,000+ users on H1B Pulse. No spam, just updates.</p>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-5">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-colors hover:border-muted-foreground/30"
              onClick={() => setActiveFaq(activeFaq === i ? null : i)}
            >
              <div className="flex justify-between items-center gap-3 px-5 py-4">
                <h4 className="text-sm font-medium">{item.q}</h4>
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${activeFaq === i ? "rotate-180" : ""}`} />
              </div>
              <div
                className={`overflow-hidden transition-all duration-350 ${activeFaq === i ? "max-h-72" : "max-h-0"}`}
                style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
              >
                <div className="px-5 pb-4 text-[13px] text-muted-foreground leading-relaxed">{item.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-6 border-t border-border">
        <p className="text-[13px] text-muted-foreground">
          Built by the <a href="https://h1bpulse.com" className="text-emerald-400 hover:underline">H1B Pulse</a> community · 63,000+ friends helping each other
        </p>
      </div>
    </div>
  );
}
