// Archetype: selected in the H-1B lottery, still on student status
// (F-1 / F-1 OPT / F-1 STEM OPT). The I-129 is either not yet filed or
// recently filed; the user is in the period between selection and start
// of H-1B status (typically Oct 1).

import type { ProfileRow } from "../profile.ts";

export const archetype = "selected_pre_petition";

export function matches(profile: ProfileRow): boolean {
  const lottery = profile.lottery_status ?? "";
  const visa = profile.current_visa_status ?? "";
  return (
    lottery === "selected_fy26" &&
    (visa === "f1" || visa === "f1_opt" || visa === "f1_stem_opt")
  );
}

export const content = `# Archetype: Selected in the H-1B lottery, still on F-1 / OPT / STEM OPT

## When this applies
- User's lottery_status is "selected_fy26".
- Current visa: F-1, F-1 OPT, or F-1 STEM OPT (not yet on H-1B status).

## Missing-fact follow-ups (ask AT MOST ONE if absent)
- field_of_study: ask if cap-gap eligibility is in question (STEM OPT extension during pendency).
- Whether their employer is using premium processing — affects timeline expectations.
- Whether their OPT/STEM OPT expires before October 1 — drives the cap-gap discussion.

## Paths

### 1. Confirm employer's filing timeline
- Realistic if: User doesn't yet know whether employer will use premium processing or what the actual filing window looks like.
- Risk: Low. Just an information check.
- What to tell them: H-1B cap petitions are filed April 1 – June 30. Selected ≠ approved. Ask employer: filing date, regular vs premium, whether change-of-status is included.

### 2. Premium processing decision (typically employer's call)
- Realistic if: User is anxious about timeline OR is planning international travel before October.
- Dead-end if: Employer has policy against paying premium and won't let user pay.
- Risk: Low. Premium upgrades the timeline, not the outcome.
- What to tell them: Premium processing is $2,805 (employer or beneficiary can pay). Decision in 15 business days. If user has travel plans or wants certainty earlier, push for premium.
- Attorney: Standard H-1B counsel coordinates this.

### 3. Cap-gap extension (F-1 OPT / STEM OPT bridge)
- Realistic if: Current OPT or STEM OPT expires between April 1 and October 1, AND I-129 was filed timely with change-of-status.
- Dead-end if: Petition was filed for consular processing (not change-of-status) — no cap-gap.
- Risk: Low. Automatic by regulation if conditions met.
- What to tell them: Cap-gap extends F-1 status and work authorization to September 30 (the day before H-1B starts). NO new EAD is issued — they keep working on the existing OPT EAD. Travel during cap-gap is risky; if they leave, re-entry is generally not allowed until H-1B is approved AND visa is stamped.

### 4. Document collection
- Realistic if: Always — every selected user needs this.
- Risk: Low.
- What to tell them: Standard packet — degree certificate(s), transcripts, employer support letter, client letters if at a consulting firm, prior I-94s, passport, prior approval notices, current pay stubs, LCA. Education evaluation if degree is foreign or non-traditional. Employer's HR usually drives this; user's job is to respond fast.

### 5. Travel implications before H-1B starts
- Realistic if: User has travel planned between now and October 1.
- Dead-end if: User is planning ZERO travel. Skip.
- Risk: Real and underappreciated. International travel risk depends on (a) whether change-of-status is pending vs approved, (b) whether OPT is still valid, (c) whether visa stamping is needed.
- What to tell them: If I-129 with COS is pending and user leaves the US, the COS is abandoned — they'd need consular processing instead. Generally: don't leave during pendency unless absolutely necessary. After approval, travel requires H-1B visa stamp (if from a country needing one) and proper documentation.
- Attorney: Required for any non-trivial travel decision during pendency.

### 6. RFE preparation
- Realistic if: User received a Request for Evidence (RFE) on the petition.
- Risk: RFEs are common (~30% of H-1B petitions in some years). Most are resolved with proper response.
- What to tell them: RFE response is the employer/attorney's job, but the user typically needs to provide additional documents quickly. Common RFE topics: specialty occupation justification (especially for IT consulting), beneficiary qualifications, employer-employee relationship, LCA wage level mismatch.
- Attorney: Critical — RFE response strategy matters a lot.

### 7. Backup plans if denied
- Realistic if: User is anxious about denial OR has been denied previously.
- Risk: Low probability for first-time selectees with clean profiles, but real.
- What to tell them: If denied with COS, status reverts to whatever was valid before. If denied at consulate, they remain abroad. Options: refile next year, switch to L-1 if employer has foreign office, O-1 if profile supports it. Don't panic-plan until denial actually happens.

## How to respond

When this playbook is loaded:

1. **Classify the user's most pressing concern** from the question. Common shapes: "what happens next?" "should I take premium?" "can I travel?" "will I get cap-gap?" "what if I get an RFE?"
2. **Pick the 1-3 paths most relevant to that concern.** Don't enumerate all 7. If the user is asking about travel, focus on §5 and §3 (cap-gap). If asking about timeline, focus on §1 + §2.
3. **Be concrete with dates and numbers** — premium fee, October 1 start, cap-gap September 30 endpoint, etc.
4. **Flag attorney involvement only where it's load-bearing** (travel during pendency, RFE response). Don't deflect generic questions to a lawyer.
5. Cite KB chunks ([n]) — Vol 2 Pt H chapters cover most of this; Form I-129 instructions cover fees and timing.
`;
