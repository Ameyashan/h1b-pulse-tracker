import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DS160_CHECKLIST,
  DS160_GOTCHAS,
  DS160_LAST_REVIEWED,
  DS160_SECTIONS,
} from "@/data/ds160-content";

const CHECKLIST_STORAGE_KEY = "ds160_checklist_v1";

function useChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return { checked, toggle };
}

export function DS160GuideTab() {
  const navigate = useNavigate();
  const { checked, toggle } = useChecklist();
  const completedCount = DS160_CHECKLIST.filter((c) => checked[c.id]).length;

  const goToPulse = (q: string) => {
    navigate(`/pulse?q=${encodeURIComponent(q)}`);
  };

  return (
    <section>
      <div className="steps-hero">
        <span className="tag">● DS-160 · Visa stamping</span>
        <h1>
          Fill the DS-160 — <em>without second-guessing every field.</em>
        </h1>
        <p>
          A field-by-field walkthrough for H-1B principals and H-4 dependents, with
          callouts for the traps that most applicants miss. Updated {DS160_LAST_REVIEWED}.
        </p>
      </div>

      <div className="notice warn" style={{ marginBottom: 16 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>
          Informational only — not legal advice. Always verify on the official form at{" "}
          <a href="https://ceac.state.gov/genniv/" target="_blank" rel="noopener noreferrer"><u>ceac.state.gov</u></a>{" "}
          and consult an immigration attorney for your specific case.
        </span>
      </div>

      <div className="three-col" style={{ marginBottom: 16 }}>
        <div className="rd-stat">
          <div className="kicker">Form sections</div>
          <div className="value accent-col">{DS160_SECTIONS.length}</div>
          <div className="sub">walkthrough below</div>
        </div>
        <div className="rd-stat">
          <div className="kicker">Time to complete</div>
          <div className="value" style={{ color: "var(--info)" }}>30–60 min</div>
          <div className="sub">with documents ready</div>
        </div>
        <div className="rd-stat">
          <div className="kicker">Session timeout</div>
          <div className="value" style={{ color: "var(--warn)" }}>20 min</div>
          <div className="sub">save often</div>
        </div>
      </div>

      <div className="card-head-row" style={{ margin: "28px 0 12px" }}>
        <div>
          <div className="card-title">Before you start — preflight checklist</div>
          <div className="card-subtitle">
            {completedCount}/{DS160_CHECKLIST.length} ready · checks are saved on this device
          </div>
        </div>
      </div>

      <div className="ds160-checklist">
        {DS160_CHECKLIST.map((item) => (
          <label key={item.id} className={`ds160-check${checked[item.id] ? " done" : ""}`}>
            <input
              type="checkbox"
              checked={!!checked[item.id]}
              onChange={() => toggle(item.id)}
            />
            <div className="ds160-check-body">
              <div className="ds160-check-label">{item.label}</div>
              {item.hint && <div className="ds160-check-hint">{item.hint}</div>}
            </div>
          </label>
        ))}
      </div>

      <div className="card-head-row" style={{ margin: "32px 0 12px" }}>
        <div>
          <div className="card-title">Cross-cutting gotchas</div>
          <div className="card-subtitle">Read these once — they apply to every page of the form.</div>
        </div>
      </div>

      <div className="ds160-gotcha-grid">
        {DS160_GOTCHAS.map((g, i) => (
          <div key={i} className="ds160-gotcha">
            <div className="ds160-gotcha-title">
              <span aria-hidden>⚠</span> {g.title}
            </div>
            <p>{g.body}</p>
          </div>
        ))}
      </div>

      <div className="card-head-row" style={{ margin: "32px 0 12px" }}>
        <div>
          <div className="card-title">Page-by-page field guide</div>
          <div className="card-subtitle">
            Click any section to expand its fields. Order matches the DS-160 itself.
          </div>
        </div>
      </div>

      <Accordion type="multiple" className="ds160-accordion">
        {DS160_SECTIONS.map((section, idx) => (
          <AccordionItem key={section.id} value={section.id} className="ds160-section">
            <AccordionTrigger className="ds160-section-trigger">
              <div className="ds160-section-head">
                <span className="ds160-section-num">{String(idx + 1).padStart(2, "0")}</span>
                <div className="ds160-section-meta">
                  <div className="ds160-section-title">{section.title}</div>
                  {section.subtitle && (
                    <div className="ds160-section-subtitle">{section.subtitle}</div>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <dl className="ds160-fields">
                {section.fields.map((f, i) => (
                  <div key={i} className="ds160-field">
                    <dt>{f.label}</dt>
                    <dd>
                      <p>{f.guidance}</p>
                      {f.gotcha && (
                        <div className="ds160-field-gotcha">
                          <span aria-hidden>⚠</span> {f.gotcha}
                        </div>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="ds160-cta">
        <div>
          <div className="ds160-cta-title">Stuck on a specific field?</div>
          <div className="ds160-cta-sub">
            Ask Pulse — our AI assistant trained on H-1B + visa stamping context.
          </div>
        </div>
        <button
          className="rd-btn btn-primary"
          onClick={() => goToPulse("I'm filling out the DS-160 form. Can you help me with ")}
        >
          Ask Pulse →
        </button>
      </div>
    </section>
  );
}
