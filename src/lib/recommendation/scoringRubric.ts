import type { ScoringBreakdown } from "@/lib/types";

/**
 * Single source of truth for score weights and label thresholds.
 * Used by the scorer and by the admin "Matriks penilaian" tab, so the
 * displayed rubric can never drift from the real calculation.
 */

export const FIT_WEIGHTS = [
  { key: "interestScore", label: "Minat", weight: 0.3 },
  { key: "skillScore", label: "Skill", weight: 0.25 },
  { key: "subjectScore", label: "Mata pelajaran", weight: 0.15 },
  { key: "workStyleScore", label: "Gaya kerja", weight: 0.1 },
  { key: "problemAreaScore", label: "Bidang masalah", weight: 0.1 },
  { key: "constraintFitScore", label: "Kendala dan preferensi", weight: 0.1 },
] as const satisfies ReadonlyArray<{ key: keyof ScoringBreakdown; label: string; weight: number }>;

/** Added on top of the weighted sum when dreamProfession names the major (see aspirationIntent.ts). */
export const ASPIRATION_BOOSTS = { exactPhrase: 6, keywordPair: 4 } as const;

export const FIT_LABEL_THRESHOLDS = [
  { min: 82, label: "Sangat Cocok" },
  { min: 70, label: "Cocok" },
  { min: 58, label: "Cukup Cocok" },
  { min: 0, label: "Perlu Dipertimbangkan Lagi" },
] as const;

export const AI_WEIGHTS = [
  { key: "humanInteraction", label: "Interaksi manusia", weight: 0.15 },
  { key: "creativity", label: "Kreativitas", weight: 0.12 },
  { key: "physicalPractical", label: "Kerja fisik/praktik", weight: 0.1 },
  { key: "ethicalJudgment", label: "Pertimbangan etis", weight: 0.12 },
  { key: "complexProblemSolving", label: "Pemecahan masalah kompleks", weight: 0.15 },
  { key: "professionalAccountability", label: "Akuntabilitas profesional", weight: 0.1 },
  { key: "aiAugmentationPotential", label: "Potensi dibantu AI", weight: 0.12 },
  { key: "industryGrowth", label: "Pertumbuhan industri", weight: 0.09 },
  { key: "nonRoutineWork", label: "Kerja non-rutin", weight: 0.05 },
] as const;

export type AIComponentKey = (typeof AI_WEIGHTS)[number]["key"];

export const AI_LABEL_THRESHOLDS = [
  { min: 80, label: "Tinggi" },
  { min: 60, label: "Sedang" },
  { min: 0, label: "Perlu Adaptasi Tinggi" },
] as const;

export function labelFor<T extends string>(score: number, thresholds: ReadonlyArray<{ min: number; label: T }>): T {
  return (thresholds.find((t) => score >= t.min) ?? thresholds[thresholds.length - 1]).label;
}
