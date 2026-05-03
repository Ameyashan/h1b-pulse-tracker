// Archetype: on H-1B and asking about the green-card path. Question shape
// is required (specific GC-related phrasing) because H-1B users ask all
// kinds of questions, not just about green cards.

import type { ProfileRow } from "../profile.ts";

export const archetype = "h1b_to_green_card";

export function matches(profile: ProfileRow): boolean {
  const visa = profile.current_visa_status ?? "";
  return visa === "h1b" || visa === "h1b_transfer" || visa === "green_card_pending";
}

export function questionMatches(question: string): boolean {
  const q = question.toLowerCase();
  return [
    "green card", "greencard",
    "permanent residence", "permanent resident",
    "perm",
    "i-140", "i140",
    "i-485", "i485",
    "eb-1", "eb1",
    "eb-2", "eb2",
    "eb-3", "eb3",
    "niw", "national interest",
    "gc process", "gc path",
    "priority date",
    "visa bulletin",
  ].some((p) => q.includes(p));
}

export const content = `# Archetype: On H-1B, exploring the green-card path

## When this applies
- User's current visa is H-1B (or H-1B transfer or green-card pending).
- Question references green cards, EB categories, PERM, I-140, NIW, priority dates, or visa bulletin movement.

## Missing-fact follow-ups (ask AT MOST ONE if absent)
- country_of_birth: critical. India- and China-born users face EB-2/EB-3 backlogs measured in years; the right path can flip entirely based on this. ALWAYS ask if not in profile.
- field_of_study + employer_type: sometimes determines whether NIW is realistic vs PERM.

## Paths

### 1. Employer-sponsored EB-2 / EB-3 via PERM
- Realistic if: Employer is willing to sponsor (most large tech companies do; many smaller ones don't); user plans to stay at this employer for 1-3 years to complete the process.
- Dead-end if: Employer doesn't sponsor; user wants to change jobs frequently.
- Risk: Process owns 2-4 years (PERM 12-18 months → I-140 6-12 months → I-485 wait depends on country backlog).
- Country backlog reality: For India, EB-2 priority dates are 10+ years behind; EB-3 sometimes faster. For China, EB-2 is faster than India. ROW (rest of world) is usually current.
- Attorney: Employer's law firm handles it. User mostly provides documents.

### 2. EB-2 NIW self-petition
- Realistic if: STEM field with national-importance angle (climate, healthcare, AI safety, semiconductors, defense-adjacent); demonstrable record advancing the field; well-positioned to advance the proposed endeavor.
- Dead-end if: Generalist work without national-importance framing.
- Major advantage over PERM: No employer sponsorship needed. User owns the petition. Can change jobs without restarting.
- Country backlog: Same EB-2 backlog applies. India/China-born users wait years for I-485 even after I-140 approval.
- Risk: Medium-high evidentiary bar. Petition letter is the case.
- Attorney: NIW specialist required.

### 3. EB-1A self-petition
- Realistic if: Top of field — multiple major awards, original contributions of major significance, sustained acclaim, work judged or peer-reviewed at high levels.
- Dead-end if: Most users.
- Major advantages: No employer sponsorship; EB-1 backlog is shorter than EB-2 even for India/China.
- Risk: Highest evidentiary bar. Denials common without a tight portfolio.
- Attorney: EB-1A specialist required.

### 4. EB-1B (outstanding professor / researcher)
- Realistic if: Academic / research position with 3+ years experience; international recognition.
- Dead-end if: Industry-only career path.
- Risk: Medium. Easier than EB-1A but requires academic context.
- Attorney: Required.

### 5. EB-1C multinational manager
- Realistic if: User has 1+ year as a manager/exec at the foreign affiliate of a multinational; usually paired with prior L-1A history.
- Dead-end if: Pure IC career; no foreign-affiliate history.
- Risk: Medium. Specific evidentiary requirements around managerial role.
- Attorney: Required.

### 6. Concurrent I-140 + I-485 filing
- Realistic if: User's priority date is current OR will be current in the same window.
- Dead-end if: Long backlog (most India/China cases).
- Risk: Low (the only risk is the I-140 being denied while I-485 is pending).
- Benefit: Once I-485 is pending for 180 days, user gets EAD + AP (work + travel without H-1B), and AC21 portability lets them change employers as long as new job is "same or similar."
- Attorney: Required.

### 7. Cross-charge to spouse's country
- Realistic if: Married to someone born in a different (less-backlogged) country.
- Risk: Low.
- Benefit: User can use spouse's country for visa-bulletin charging — can dramatically shorten wait if spouse is from a current country.
- What to tell them: This is a real, often-missed strategy. Discuss with attorney.

### 8. AC21 portability after I-140 approval + 180 days
- Realistic if: Already has I-140 approved AND 180 days have passed since I-485 filing (if filed) — or just I-140 approved + extending H-1B beyond 6-year max.
- Risk: Low if done right.
- Benefit: Allows job changes without restarting PERM/I-140. Also allows H-1B extensions in 1-3 year increments past the normal 6-year max.
- Attorney: Required to confirm "same or similar" job rules.

## How to respond

1. **Classify the user.** Country of birth is the biggest filter. If unknown, ASK before recommending paths — "current backlog is X years for India; what's your country of birth?"
2. **Pick 1-3 paths** that fit profile + country of birth + employer willingness.
3. **Be honest about timelines.** Don't soft-pedal a 10-year EB-2 India wait. Mention NIW as parallel-track-worth-pursuing for India/China users with strong profiles.
4. **Distinguish self-petition vs employer-sponsored** clearly — many users don't realize NIW and EB-1A don't need an employer.
5. **Flag attorney requirement** for any self-petition path. Employer-sponsored cases use the employer's lawyer.
6. Cite KB chunks ([n]) — Vol 6 Pt E and Pt F cover EB categories; the visa bulletin chunks have current movement.
`;
