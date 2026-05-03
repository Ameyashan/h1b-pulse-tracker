// Playbook registry + matcher. Edge function ask-pulse calls matchPlaybook()
// at request time; if both the profile shape and the question shape match a
// known archetype, the playbook content is injected as a system block.
//
// Adding a new archetype:
//   1. Create _shared/playbooks/<archetype_id>.ts (export `archetype`,
//      `matches`, optional `questionMatches`, `content`).
//   2. Append it to PLAYBOOKS below in precedence order (most specific first).
//   3. Redeploy ask-pulse.

import type { ProfileRow } from "../profile.ts";
import * as notSelectedF1Opt from "./not_selected_f1_opt.ts";
import * as notSelectedH1bOther from "./not_selected_h1b_other_employer.ts";
import * as selectedPrePetition from "./selected_pre_petition.ts";
import * as selectedPostPetition from "./selected_post_petition.ts";
import * as transferH1b from "./transfer_h1b.ts";
import * as h1bToGreenCard from "./h1b_to_green_card.ts";

interface Playbook {
  archetype: string;
  matches: (profile: ProfileRow) => boolean;
  // Optional: per-playbook question-shape gate. If absent, the default
  // OPEN_ENDED_PHRASES list is used. Use this for archetypes that should
  // only fire on specific question intents (e.g. h1b_to_green_card needs
  // GC-specific phrasing because most H-1B users ask other things).
  questionMatches?: (question: string) => boolean;
  content: string;
}

// Order matters: matchPlaybook returns the FIRST match. Put narrower
// archetypes (with specific question shapes) before broader ones so the
// narrower playbook wins when both could apply.
const PLAYBOOKS: Playbook[] = [
  // Narrowest first: profile + specific question shape.
  transferH1b,         // H-1B + question about job change
  h1bToGreenCard,      // H-1B + question about green card

  // Profile-specific archetypes (default OPEN_ENDED_PHRASES for question shape).
  notSelectedH1bOther, // H-1B holder, not selected this cycle
  selectedPostPetition,
  selectedPrePetition,
  notSelectedF1Opt,
];

// Default phrases that signal an open-ended "what do I do" question.
// Used when a playbook does not export its own questionMatches.
const OPEN_ENDED_PHRASES = [
  "what are my options",
  "what now",
  "what should i do",
  "what's next",
  "whats next",
  "where do i go from here",
  "alternatives",
  "other paths",
  "if not selected",
  "didn't get picked",
  "didnt get picked",
  "wasn't selected",
  "wasnt selected",
  "not selected",
  "didn't get selected",
  "didnt get selected",
];

function isOpenEndedQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return OPEN_ENDED_PHRASES.some((p) => q.includes(p));
}

export interface PlaybookMatch {
  archetype: string;
  content: string;
}

export function matchPlaybook(
  profile: ProfileRow | null,
  question: string,
  history: { role: string; content: string }[],
): PlaybookMatch | null {
  if (!profile) return null;

  // Find the first registered playbook whose profile predicate matches.
  for (const pb of PLAYBOOKS) {
    if (!pb.matches(profile)) continue;

    // Question-shape gate: per-playbook override or default open-ended.
    let questionOk: boolean;
    if (pb.questionMatches) {
      questionOk = pb.questionMatches(question);
    } else {
      const firstTurn = !history || history.length === 0;
      questionOk = firstTurn || isOpenEndedQuestion(question);
    }
    if (!questionOk) continue;

    return { archetype: pb.archetype, content: pb.content };
  }

  return null;
}
