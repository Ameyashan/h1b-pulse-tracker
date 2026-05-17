type Step = {
  state: string;
  num: string;
  title: string;
  when: string;
  whenClass: string;
  body: string;
  link?: { href: string; label: string };
};

const STEPS: Step[] = [
  { state: "done", num: "✓", title: "Confirm your selection", when: "Done", whenClass: "done", body: "Verify your selection status on your USCIS online account and confirm with your employer/attorney." },
  { state: "current", num: "2", title: "Gather your documents", when: "Now · Apr–May", whenClass: "now", body: "Collect everything your attorney needs for the I-129 petition — passport copies, diplomas, employment letters, pay stubs, and supporting evidence." },
  { state: "", num: "3", title: "Employer files I-129 petition", when: "Apr – Jun 30", whenClass: "", body: "Your employer files Form I-129 with USCIS. This is the core petition — deadline is June 30, 2026." },
  { state: "", num: "4", title: "Receive receipt notice (I-797C)", when: "2–4 wks after filing", whenClass: "", body: "USCIS sends a receipt notice confirming your case is pending. Save it — you'll need the receipt number to track everything." },
  { state: "", num: "5", title: "Handle an RFE (if you get one)", when: "Varies", whenClass: "", body: "USCIS may request more documentation. Don't panic — RFEs are common and manageable. Pulse has data on top RFE reasons." },
  { state: "", num: "6", title: "Get your approval (I-797A)", when: "3–8 mo after filing", whenClass: "", body: "USCIS approves your petition. Your H-1B status begins October 1, 2026." },
  { state: "", num: "7", title: "Start your H-1B", when: "Oct 1", whenClass: "", body: "Begin employment on your H-1B status. If you're abroad, start consular processing and get your visa stamp.", link: { href: "/ds-160", label: "Full DS-160 walkthrough →" } },
];

export function NextStepsTab() {
  return (
    <section>
      <div className="steps-hero">
        <span className="tag">● Selected in FY2027 lottery</span>
        <h1>
          You got selected — <em>now what?</em>
        </h1>
        <p>Your complete roadmap from lottery selection to H-1B approval. Every step, every deadline, zero confusion.</p>
      </div>

      <div className="notice warn" style={{ marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>This guide is for informational purposes only and is not legal advice. Consult an immigration attorney and verify at <u>myUSCIS.gov</u>.</span>
      </div>

      <div className="three-col" style={{ marginBottom: 16 }}>
        <div className="rd-stat">
          <div className="kicker">Total steps</div>
          <div className="value accent-col">7</div>
          <div className="sub">selection to approval</div>
        </div>
        <div className="rd-stat">
          <div className="kicker">Filing deadline</div>
          <div className="value" style={{ color: "var(--warn)" }}>Jun 30</div>
          <div className="sub">FY2027 cap season</div>
        </div>
        <div className="rd-stat">
          <div className="kicker">Typical timeline</div>
          <div className="value" style={{ color: "var(--info)" }}>3–8 mo</div>
          <div className="sub">selection to approval</div>
        </div>
      </div>

      <div className="card-head-row" style={{ margin: "28px 0 16px" }}>
        <div>
          <div className="card-title">Your step-by-step roadmap</div>
          <div className="card-subtitle">Click any step to expand details, tips, and what to watch out for.</div>
        </div>
      </div>

      <div className="timeline">
        {STEPS.map((s, i) => (
          <div key={i} className={`step ${s.state}`}>
            <span className="step-num">{s.num}</span>
            <div className="step-head">
              <div className="title">{s.title}</div>
              <span className={`when ${s.whenClass}`}>{s.when}</span>
            </div>
            <p>{s.body}</p>
            {s.link ? (
              <a href={s.link.href} className="step-expand" style={{ color: "var(--accent-2)" }}>{s.link.label}</a>
            ) : (
              <span className="step-expand">Details ↓</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
