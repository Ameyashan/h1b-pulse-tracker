# Pulse AI Archetype Playbooks

This directory holds the Layer 3 decision-tree playbooks. Each playbook
encodes the realistic paths for a specific user archetype (e.g. "not selected
this cycle, on F-1 OPT") so Claude can produce a *prescriptive* shortlist
instead of a generic enumeration.

## How matching works

1. `ask-pulse/index.ts` loads the user's profile from `public.profiles`.
2. Calls `matchPlaybook(profile, question, history)`.
3. If both:
   - The profile matches an archetype's `matches()` predicate AND
   - The question looks open-ended (`OPEN_ENDED_PHRASES`) OR it's the user's first turn
4. ...the matched playbook's `content` is injected as a fourth system block:
   `<archetype_playbook archetype="...">...</archetype_playbook>`.
5. Claude is instructed (via `BASE_SYSTEM`) to follow that block's
   "How to respond" rules first.

If no playbook matches, the request falls through to the existing Layer 1+2
behavior (profile context + KB retrieval + web search).

## Adding a new archetype

1. Create `<archetype_id>.ts` next to the existing playbooks.
2. Export three things:

   ```ts
   export const archetype = "selected_pre_petition";
   export function matches(profile: ProfileRow): boolean { ... }
   export const content = `# Archetype: ...`;
   ```

3. Add it to the `PLAYBOOKS` array in `index.ts` in precedence order. More
   specific archetypes go first — `matchPlaybook` returns the first hit.
4. `supabase functions deploy ask-pulse --project-ref rkwcpnoqnxporjqqlxjt`.

## Authoring guidelines for the `content` string

Each playbook follows the same structure so Claude's behavior stays consistent:

- **When this applies** — a plain-English description of the trigger conditions.
- **Missing-fact follow-ups** — list profile fields that materially change the
  answer if absent. Claude will ask AT MOST ONE.
- **Paths** — 6-10 realistic paths. Each path has:
  - Realistic if (positive eligibility signals)
  - Dead-end if (negative signals)
  - Risk (with explicit ⚠️ flag for risky paths like Day-1 CPT)
  - Attorney (whether legal counsel is required, and what kind)
- **How to respond** — the procedural instructions for Claude. Always tells
  the model: classify, pick 2-3, explain briefly, ask ONE follow-up if needed,
  do not deflect to "talk to a lawyer".

Keep each playbook under ~3000 tokens. Claude has the whole thing in its
context window every time the playbook fires; verbose playbooks burn tokens
without improving answer quality.

## Roadmap (planned archetypes)

- `not_selected_f1_opt` ✅ shipped
- `selected_pre_petition` — selected, I-129 not yet filed
- `selected_post_petition` — I-129 filed, awaiting decision
- `h1b_to_green_card` — on H-1B, considering EB-2/EB-3
- `transfer_h1b` — transferring employers
- `not_selected_h1b_other_employer` — currently on H-1B at a different employer, didn't get a fresh selection (less common but real)
