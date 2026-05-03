// Archetype: selected and now ON H-1B status (the change-of-status has
// already happened, OR the user is on someone else's H-1B and was just
// selected on a new employer's filing). Concerns shift from "will it
// happen" to "operating my H-1B life".

import type { ProfileRow } from "../profile.ts";

export const archetype = "selected_post_petition";

export function matches(profile: ProfileRow): boolean {
  const lottery = profile.lottery_status ?? "";
  const visa = profile.current_visa_status ?? "";
  return (
    lottery === "selected_fy26" &&
    (visa === "h1b" || visa === "h1b_transfer")
  );
}

export const content = `# Archetype: Selected, on H-1B status

## When this applies
- User's lottery_status is "selected_fy26".
- Current visa: H-1B or H-1B (transferring).

## Missing-fact follow-ups (ask AT MOST ONE if absent)
- country_of_birth: critical for green-card-related decisions (visa bulletin backlog).
- Whether they're inside or outside the US right now (affects travel/stamping advice).

## Paths

### 1. Status check cadence (don't over-monitor)
- Realistic if: User keeps refreshing case status.
- Risk: Low. Anxiety, not legal.
- What to tell them: After case acceptance, weekly checks are plenty. Most petitions sit in "Case Was Received" for weeks. Premium processing forces a 15-business-day decision; otherwise, expect 2-6 months. RFE notices appear in case status before the paper notice arrives.

### 2. Premium processing upgrade timing
- Realistic if: Petition is regular processing AND user has a deadline (travel, status expiry, etc.) approaching.
- Dead-end if: Already premium.
- Risk: Low.
- What to tell them: Premium can be upgraded ANY time during pendency — file I-907 and pay the fee. 15-business-day clock starts on USCIS receipt. Smart timing: upgrade when pendency exceeds 60-90 days, or before travel.

### 3. RFE response strategy
- Realistic if: User got an RFE.
- Risk: Default outcome is approval, but RFE response quality matters.
- What to tell them: Response window is 87 days. Don't wait — start gathering docs immediately. Common topics: specialty occupation, beneficiary qualifications, employer-employee relationship (especially for IT consulting / staffing), LCA wage level. Quality of response is everything.
- Attorney: Required. RFE responses are not a DIY task.

### 4. Travel rules during pendency
- Realistic if: User is asking about travel between filing and approval.
- Risk: HIGH if mishandled.
- What to tell them: If on H-1B status with a transfer/extension pending, travel is generally OK — they can re-enter on the existing H-1B visa stamp + last approval notice + recent paystubs. EXCEPTION: if I-94 has expired and the extension is pending, leaving the country can void the pending application or require consular processing on return. Always check with attorney before travel.
- Attorney: Required.

### 5. Travel after approval (visa stamping if from a country that needs it)
- Realistic if: User just got approved and is planning international travel.
- Dead-end if: User is from a country with no visa stamp requirement (limited list).
- Risk: Medium. Stamping appointments can have weeks of wait time at busy consulates (Mumbai, New Delhi, Hyderabad, Chennai, Toronto for transit cases).
- What to tell them: If their existing H-1B visa stamp is valid (matches the current employer or the transfer rules apply), no new stamping needed. Otherwise need to schedule visa appointment at a US consulate abroad. Bring approval notice, LCA, recent paystubs, employer letter, degree docs.

### 6. AC21 portability — changing jobs after approval
- Realistic if: User is considering a new job offer.
- Risk: Low if done correctly. See the transfer_h1b playbook for details — but the high level:
- What to tell them: Once on H-1B, they can change employers via H-1B transfer. New employer files I-129; user can start day-one of filing (don't need approval). Existing H-1B history transfers automatically. Don't quit existing job until new I-129 is filed.
- Attorney: Required.

### 7. What approval triggers automatically
- Realistic if: User is confused about what changes when approval lands.
- Risk: None — informational.
- What to tell them: Approval notice (I-797) is the proof of status. If COS was requested, status auto-changes to H-1B on the start date (typically October 1 for cap petitions). If consular processing was requested, they need to apply for visa stamp abroad before entering the US in H-1B status. New I-94 is generated at the next entry.

### 8. Employment authorization specifics
- Realistic if: User is unsure whether they can start a particular job activity.
- Risk: Status violations are real; clear rules avoid them.
- What to tell them: H-1B is employer-specific and worksite-specific. Substantial change in job duties or location ≠ allowed without amendment. Side projects and unpaid volunteer work are gray zones — generally OK if unpaid and unrelated to the H-1B job. Paid side gigs require a concurrent H-1B.

## How to respond

1. **Classify the concern** from the question. Common shapes: travel, RFE, premium upgrade, job change, visa stamping, status check, side project.
2. **Pick the 1-3 paths** that match. Don't enumerate.
3. **Be concrete** about timelines, fees, and document requirements.
4. **Flag attorney consultation** for RFE response, travel during pendency, and any change in employer/role. Don't flag for status checks or trivial timeline questions.
5. Cite KB chunks ([n]) — USCIS Policy Manual Vol 2 Pt H is the source for most adjudication rules.
`;
