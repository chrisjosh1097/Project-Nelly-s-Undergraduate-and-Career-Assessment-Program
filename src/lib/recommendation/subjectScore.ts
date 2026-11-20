import type { SubjectChoice } from "@/lib/assessment/subjectChoices";
import type { WeightedTag } from "../../../data/types";

const SPECIFICITY_BONUS = 4;
const SPECIFICITY_BONUS_CAP = 8;

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function baseScore(choices: SubjectChoice[], tags: WeightedTag[]) {
  if (choices.length === 0 || tags.length === 0) return 35;
  const weightById = new Map(tags.map((tag) => [tag.id, tag.weight]));
  const matched = choices
    .map((choice) => Math.max(0, ...choice.candidateIds.map((id) => weightById.get(id) ?? 0)))
    .filter((weight) => weight > 0);
  if (matched.length === 0) return 18;
  const denominator = Math.min(choices.length, tags.length) * 100;
  const coverage = (matched.reduce((sum, weight) => sum + weight, 0) / denominator) * 100;
  return coverage + Math.min(matched.length * 5, 15);
}

/**
 * v3.3.0 subject score.
 * - One slot per checkbox, so a choice with extra IDs cannot dilute the denominator
 *   or earn extra breadth credit. Single-ID (legacy) choices equal v3.2.0 exactly.
 * - Recognized "Lainnya" text can only help: the score is the better of with/without it.
 * - Specific options (e.g. Matematika Tingkat Lanjut) add a bounded bonus when the
 *   major lists that specificity tag.
 */
export function scoreSubjectChoices(choices: SubjectChoice[], tags: WeightedTag[]) {
  const explicit = choices.filter((choice) => choice.primaryId !== "other_text");
  const base = Math.max(baseScore(explicit, tags), explicit.length === choices.length ? -Infinity : baseScore(choices, tags));
  const tagIds = new Set(tags.map((tag) => tag.id));
  const hits = choices.flatMap((choice) => choice.specificityIds).filter((id) => tagIds.has(id)).length;
  return clamp(base + Math.min(hits * SPECIFICITY_BONUS, SPECIFICITY_BONUS_CAP));
}
