// Archetype: on H-1B and asking about changing employers / transferring.
// Question shape required because most H-1B users don't ask about transfer.

import type { ProfileRow } from "../profile.ts";

export const archetype = "transfer_h1b";

export function matches(profile: ProfileRow): boolean {
  const visa = profile.current_visa_status ?? "";
  return visa === "h1b" || visa === "h1b_transfer";
}

export function questionMatches(question: string): boolean {
  const q = question.toLowerCase();
  return [
    "switch employer", "switching employer",
    "change employer", "changing employer",
    "new employer", "different employer",
    "transfer", "h-1b transfer", "h1b transfer",
    "new job", "new offer", "new role",
    "leave my job", "leaving my job",
    "quit my job", "quitting",
    "porting", "portability",
    "ac21",
  ].some((p) => q.includes(p));
}

export const content = `# Archetype: H-1B holder considering an employer change

## When this applies
- User's current visa is H-1B (or transferring).
- Question is about job changes, transfers, portability, or AC21.

## Important framing
H-1B "transfer" is a misnomer — it's a new I-129 filed by the new employer. Cap-exempt (no lottery needed) because the user already counted against the cap.

## Missing-fact follow-ups (ask AT MOST ONE if absent)
- Whether they have an I-140 approved (changes timeline rules + H-1B 7th-year extension eligibility).
- Whether the new role is "same or similar" to the H-1B job (matters for AC21 portability after I-485 pending 180 days).

## Paths

### 1. Standard H-1B transfer (most common case)
- Realistic if: User has a new offer; new employer is willing to file H-1B.
- Dead-end if: New employer won't sponsor.
- Risk: Low. Denials are uncommon for clean cases.
- Timeline: New employer files I-129. User can start day-one of filing (don't need approval) per H-1B portability rules (AC21 §105). Approval typically 2-6 months regular; 15 business days premium.
- What to tell them: Don't quit the existing job until the new I-129 is at least filed and you have the receipt notice. Recent paystubs (within ~60 days) from the existing employer are critical for portability — gaps can void the transfer.
- Attorney: New employer's law firm handles it.

### 2. Concurrent H-1B (keep current job + add another)
- Realistic if: User wants to do BOTH jobs simultaneously, and both employers will sponsor.
- Dead-end if: One employer is unwilling to sponsor or doesn't permit moonlighting.
- Risk: Medium. Both employers must accept the LCA wage levels and the part-time/full-time split.
- What to tell them: Each employer files their own I-129 and LCA. User maintains H-1B status via either (or both) jobs. Hours must be tracked carefully.
- Attorney: Required — coordination across two filings is non-trivial.

### 3. AC21 portability after I-485 pending 180+ days
- Realistic if: Already in green-card pipeline with I-485 pending for at least 180 days.
- Dead-end if: I-485 not yet filed or filed less than 180 days ago.
- Risk: Low if "same or similar" test is met.
- Benefit: User can change to a job at any employer without restarting PERM/I-140, as long as the new job is in the same or similar occupation.
- What to tell them: User submits I-485 Supplement J on the new job. Attorney evaluates "same or similar" — generally interpreted by SOC code and job duties.
- Attorney: Required.

### 4. H-1B amendment (same employer, material change)
- Realistic if: SAME employer, but worksite or job duties materially changing.
- Dead-end if: Trivial change (different team, same role) — no amendment needed.
- Risk: Late amendments can be a status problem (Matter of Simeio).
- What to tell them: Worksite changes outside the LCA's MSA require a new LCA + amendment filed BEFORE the move. Job duty changes that alter the specialty occupation also require amendment.
- Attorney: Required for any non-trivial change.

### 5. 60-day grace period after job loss
- Realistic if: User was laid off or quit and hasn't found a new role yet.
- Dead-end if: User has been out of status for more than 60 days.
- Risk: Hard deadline.
- What to tell them: After H-1B employment ends (last day of work, not last paycheck), user has 60 days OR until I-94 expires (whichever is shorter) to (a) start with a new sponsoring employer via filed H-1B transfer, (b) change to a different status (B-2, F-1, dependent), or (c) leave the US. Day 61 = unlawful presence accrues.
- Attorney: Strongly recommended.

### 6. Travel during transfer pendency
- Realistic if: User has international travel planned during the transfer process.
- Risk: Real if mishandled.
- What to tell them: With existing valid H-1B visa stamp, travel is generally OK during a pending transfer — re-enter on the existing visa + last approval notice + new transfer receipt + most recent paystubs from the OLD employer. CBP officers occasionally challenge this, so carry full documentation.
- Attorney: Required for non-trivial cases.

### 7. Risk: H-1B transfer denied
- Realistic if: User has a problematic profile (prior denials, status issues, weak specialty-occupation case).
- Dead-end if: Clean profile with strong employer.
- What to tell them: If transfer denial happens AFTER user has resigned from old employer, they fall into the 60-day grace window — same as job loss. If they were still working at the old employer, they keep that H-1B until its expiration. Either way, attorney evaluation is critical before resigning.

### 8. Cap-exempt to cap-subject move
- Realistic if: User is currently at a cap-exempt employer (university, nonprofit research) and considering a cap-subject employer.
- Dead-end if: Both employers are cap-subject — covered by §1.
- Risk: HIGH if not understood. The cap-exempt H-1B does NOT count against the lottery cap; moving to a cap-subject employer requires going through the lottery, OR getting a concurrent cap-exempt + cap-subject if structured carefully.
- Attorney: Required.

## How to respond

1. **Identify the specific transfer scenario** from the question — standard transfer, concurrent, AC21, amendment, post-job-loss.
2. **Pick 1-3 paths** that match. Don't enumerate.
3. **Be concrete about deadlines** — the 60-day grace period, 180 days for AC21, paystub freshness.
4. **Flag attorney involvement** for any non-trivial scenario, but always give the substantive answer first.
5. Common misunderstanding: H-1B "transfer" doesn't need lottery — emphasize this if the user implies otherwise.
6. Cite KB chunks ([n]) — AC21 portability rules are in Vol 2 Pt H Ch 7-8; cap-subject vs cap-exempt rules in Vol 2 Pt H Ch 6.
`;
