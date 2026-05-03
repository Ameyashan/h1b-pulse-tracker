// Archetype: user is currently on someone's H-1B and was NOT selected on
// a NEW employer's lottery filing this cycle. The big insight is that they
// often don't realize H-1B *transfers* don't need the lottery — they're
// cap-exempt. So this archetype is partly educational.

import type { ProfileRow } from "../profile.ts";

export const archetype = "not_selected_h1b_other_employer";

export function matches(profile: ProfileRow): boolean {
  const lottery = profile.lottery_status ?? "";
  const visa = profile.current_visa_status ?? "";
  return (
    (lottery === "not_selected_fy26" || lottery === "waitlist") &&
    (visa === "h1b" || visa === "h1b_transfer")
  );
}

export const content = `# Archetype: Not selected this cycle, but already on H-1B at another employer

## When this applies
- User's lottery_status is "not_selected" or "waitlist".
- Current visa: H-1B (or H-1B transfer).

## Crucial framing — explain this clearly first
Once an H-1B has been counted against the cap (which happens with the user's CURRENT employer), the user is "cap-exempt" for FUTURE H-1Bs. That means:
- A NEW employer can file an **H-1B transfer** (also called a change-of-employer petition) **without going through the lottery**.
- The lottery selection failure mostly affects employers/users who have NEVER had an H-1B before.

So if the user "didn't get selected" on a new employer's lottery filing, that's almost always **a non-issue** — the new employer should file an H-1B transfer instead, which is cap-exempt and processed year-round.

## Missing-fact follow-ups (ask AT MOST ONE if absent)
- WHY the new employer filed in the lottery (sometimes they file unnecessarily; sometimes there's a reason like prior cap-subject I-129 was withdrawn).
- Whether the user is still employed at the original H-1B sponsor.

## Paths

### 1. Stay at current H-1B employer (default)
- Realistic if: Always — there's no urgency.
- Risk: None.
- What to tell them: Their current H-1B is unaffected by the lottery outcome. They can continue working as long as the existing petition is valid.

### 2. Tell the new employer to file an H-1B transfer
- Realistic if: User wants to move to the new employer.
- Risk: Low.
- What to tell them: This is the standard, correct path. New employer files I-129 (H-1B transfer); user can start day-one of filing per H-1B portability rules. No lottery, no cap. Premium processing available.
- Attorney: New employer's law firm handles it.

### 3. Concurrent H-1B (current + new employer)
- Realistic if: User wants to keep current job AND add the new one.
- Dead-end if: One employer won't permit it.
- Risk: Medium — coordination overhead, both LCAs and I-129s.
- Attorney: Required.

### 4. Cap-exempt at university / nonprofit (additional option)
- Realistic if: User is open to academic/research roles.
- Risk: Low. Year-round filing.
- What to tell them: Many H-1B users don't realize they can ADD a cap-exempt H-1B to their current cap-subject one. Useful for research collaborations or part-time academic work.

### 5. Pursue green card path (if not already)
- Realistic if: User has been on H-1B for a while and the new employer's hiring effort signals long-term intent.
- Risk: Process owns 2-10+ years depending on country.
- What to tell them: If staying at the current employer, ask about PERM. If moving (via transfer), the new employer would start a new PERM. Self-petition options (NIW, EB-1A) are independent of employer.
- See also: h1b_to_green_card playbook (if user asks specifically about GC).

### 6. If new employer insisted on lottery filing (the unusual case)
- Realistic if: There's a specific reason the new employer's lawyer chose lottery over transfer (e.g. user's prior I-129 was withdrawn or denied recently).
- What to tell them: Get clarity from the new employer's attorney on WHY a fresh cap-subject filing was needed. There may be a status nuance (e.g. user had been out of status, or prior cap-subject petition was revoked) that genuinely required the lottery route.
- Attorney: Required.

## How to respond

1. **Lead with the framing** — "you're already on H-1B; lottery selection wasn't actually needed for a transfer to a new employer."
2. **Ask the natural clarifying question** — "what does the new employer want to do?" — to figure out which path applies.
3. **Don't recommend backup paths** like O-1, NIW, etc., as defaults. The user already has H-1B. Those are last-resort options for users without H-1B.
4. **Pick 1-2 paths** that match the user's situation. Common: §2 (transfer) if moving, §1 (stay) if not.
5. Cite KB chunks ([n]) — Vol 2 Pt H Ch 6 covers cap-subject vs cap-exempt rules.
`;
