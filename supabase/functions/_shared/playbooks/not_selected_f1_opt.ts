// Archetype playbook: F-1 student / F-1 OPT / F-1 STEM-OPT user who was NOT
// selected (or waitlisted) in the H-1B lottery this cycle.
//
// This is the largest current segment in the Pulse user base. The playbook
// encodes the 10 realistic paths with eligibility heuristics, dead-end
// signals, risk flags, and attorney-required markers — Claude is told to
// classify the user, pick 2-3 best fits, and explain.
//
// To add a path or refine an eligibility rule: edit the `content` string
// below, then redeploy ask-pulse. No DB or schema change needed.

import type { ProfileRow } from "../profile.ts";

export const archetype = "not_selected_f1_opt";

export function matches(profile: ProfileRow): boolean {
  const lottery = profile.lottery_status ?? "";
  const visa = profile.current_visa_status ?? "";
  return (
    (lottery === "not_selected_fy26" || lottery === "waitlist") &&
    (visa === "f1" || visa === "f1_opt" || visa === "f1_stem_opt")
  );
}

export const content = `# Archetype: Not selected, F-1 / F-1 OPT / F-1 STEM OPT

## When this applies
- User's lottery_status is "not_selected" or "waitlist".
- Current visa: F-1, F-1 OPT, or F-1 STEM OPT.

## Missing-fact follow-ups (ask AT MOST ONE if absent from the user's profile)
- country_of_birth: ask if any path you're recommending depends on visa-bulletin movement (EB-2/EB-3 backlog) — India- and China-born users face years of waiting that materially change which path makes sense.
- field_of_study: ask if eligibility for STEM-OPT extension or EB-2 NIW depends on whether the user's degree is on the STEM Designated Degree Program List.
- employer_type: ask if the user might already be at a cap-exempt employer without realizing it (some private companies have university affiliations that qualify them).

## Paths

### 1. Stay on STEM OPT, re-enter next lottery
- Realistic if: STEM-eligible degree, ≥1 year remaining on OPT/STEM OPT, current employer willing to file again.
- Dead-end if: OPT runway expires before next March's cap registration; non-STEM degree without time to file STEM OPT extension.
- Risk: Low. The user effectively gets two more bites at the apple over the STEM OPT period.
- Attorney: Standard H-1B counsel (often the employer's existing immigration team) for next year's filing.

### 2. Cap-exempt H-1B (university / nonprofit research / govt research)
- Realistic if: Open to academic or research roles; STEM PhD or strong research credentials; willing to relocate.
- Dead-end if: Pure private-sector software engineer who won't consider academia/research; no PhD and no research portfolio.
- Risk: Low. Real path. Cap-exempt employers can file year-round, no lottery, no cap.
- Attorney: Standard H-1B counsel; the institution's international office often handles it directly.

### 3. Concurrent cap-exempt + private H-1B
- Realistic if: Already lined up a cap-exempt role AND wants to keep the private job too.
- Dead-end if: No cap-exempt offer in hand.
- Risk: Medium — concurrent filing requires the private employer to also sponsor an H-1B, and the user must work both jobs to maintain status. Coordination overhead is real.
- Attorney: Required — coordinating two filings with different employers and tracking dual status is not DIY territory.

### 4. O-1A (extraordinary ability)
- Realistic if: 3+ years of post-degree experience; publications, patents, or measurable industry impact; awards, press, leadership in well-known companies; recognized contributions to the field.
- Dead-end if: Junior IC with no public visibility, no publications, no awards, no media coverage, no leadership roles.
- Risk: High evidentiary bar. Denials are common when the portfolio is thin. Even with a strong portfolio, RFEs are routine.
- Attorney: O-1 specialist required. The petition packet is the case.

### 5. EB-2 NIW (national interest waiver) self-petition
- Realistic if: STEM field with a clear "national importance" angle (climate, healthcare, AI safety, semiconductors, defense-adjacent); demonstrable record of advancing the field; well-positioned to advance the proposed endeavor in the US.
- Dead-end if: Generalist work (e.g. CRUD-app SWE) with no clear "national importance" framing; no published work or measurable impact.
- Risk: Medium-high evidentiary bar. Country-of-birth matters a lot — for India/China-born users, the EB-2 backlog can mean 5-10+ years before adjustment of status, even after I-140 approval.
- Attorney: NIW specialist required. The petition letter (the "Dhanasar" three-prong analysis) is 80% of the case.

### 6. EB-1A self-petition
- Realistic if: Top of field — multiple major awards, original contributions of major significance to the field, sustained acclaim, work that has been judged or peer-reviewed at high levels.
- Dead-end if: Most users. EB-1A is the highest evidentiary bar in employment-based immigration.
- Risk: Highest bar. India/China-born users face a backlog here too, but EB-1 historically moves faster than EB-2.
- Attorney: EB-1A specialist required.

### 7. L-1 via foreign transfer
- Realistic if: Current employer (or a willing employer) has a qualifying foreign office; user willing to spend 1+ year abroad working for that affiliate before returning.
- Dead-end if: Domestic-only employer; user not willing to relocate; user is in a junior IC role L-1B specialized-knowledge would be a stretch for.
- Risk: Medium. Real path but disruptive — 1+ year abroad, family/visa logistics, return uncertain if business needs change.
- Attorney: Required. L-1 has its own evidentiary requirements (qualifying employment relationship, specialized knowledge or managerial duties).

### 8. Canada Global Talent Stream
- Realistic if: Tech worker; employer willing to set up Canadian entity OR user accepting a Canadian job offer; want to stay in North America and potentially return on a TN later.
- Dead-end if: Family ties or immigration trajectory require staying in the US continuously.
- Risk: Low operationally — Canadian work permit processes in ~2 weeks for qualifying tech roles. But it IS a relocation decision.
- Attorney: Canadian immigration counsel for the work permit; US counsel if planning eventual return.

### 9. Day-1 CPT
- ⚠️ FLAG AS RISKY by default. Mention this option only if the user explicitly asks about it.
- Realistic if: User explicitly asks AND demonstrates understanding of the risk.
- Dead-end signals: Anyone hoping to keep the path "clean" for future filings (RFEs on later H-1B/green card applications can question Day-1 CPT history).
- Risk: HIGH. USCIS scrutinizes Day-1 CPT programs. Some are legitimate (genuine integrated curricular coursework requiring practical training from day one), many are diploma mills. Future H-1B/green card filings can be denied if CPT is deemed status fraud.
- Attorney: Required before enrolling. Cyrus Mehta, Murthy, and other reputable firms have written extensively on the risks.

### 10. F-1 second degree
- Realistic if: User has time, money, and a genuine academic interest; the new degree resets cap eligibility (and STEM-OPT eligibility if STEM).
- Dead-end if: User wants to keep working full-time; no funding plan.
- Risk: Low legally; high opportunity cost (2 years of forgone industry experience and salary).
- Attorney: Not required.

## How to respond

When this playbook is loaded, do NOT enumerate all 10 paths. Instead:

1. **Classify the user** using their profile. If a path-determining fact is missing (see "Missing-fact follow-ups"), note which one.
2. **Pick 2-3 best-fit paths** based on the profile. Skip paths whose dead-end signals match. Honor any preferences the user has stated (e.g. "I want to stay in tech" → drop academia paths; "I won't relocate" → drop L-1 and Canada).
3. **Briefly explain** WHY those paths and not others — but don't enumerate every path you considered. Focus on the chosen ones.
4. **If a critical fact is missing from the profile**, ask ONE specific follow-up question at the end. Otherwise don't ask.
5. Mark any path that requires an attorney as such, but do NOT use this as a deflection — give the substantive recommendation first.
6. Cite KB chunks ([n]) when the relevant source supports your reasoning. The <knowledge> block typically covers cap-exempt rules, NIW criteria, O-1 criteria, etc.
`;
