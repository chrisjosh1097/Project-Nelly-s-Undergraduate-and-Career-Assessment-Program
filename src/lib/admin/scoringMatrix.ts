import { aiResilienceProfilesById, majors } from "../../../data";
import { calculateAIFutureResilienceScore, displayCluster, getAIFutureResilienceLabel } from "@/lib/recommendation/scoring";
import {
  AI_LABEL_THRESHOLDS,
  AI_WEIGHTS,
  ASPIRATION_BOOSTS,
  FIT_LABEL_THRESHOLDS,
  FIT_WEIGHTS,
} from "@/lib/recommendation/scoringRubric";
import type { AIFutureResilienceLabel } from "@/lib/types";

export type ScoringMatrixMajor = {
  id: string;
  name: string;
  cluster: string;
  profileName: string;
  /** Same order as `aiWeights`. */
  components: number[];
  aiScore: number;
  aiLabel: AIFutureResilienceLabel;
};

export type ScoringMatrix = ReturnType<typeof buildScoringMatrix>;

/** Read-only rubric + per-major AI matrix for the admin tab. Contains no student data. */
export function buildScoringMatrix() {
  const rows: ScoringMatrixMajor[] = majors.map((major) => {
    const profile = aiResilienceProfilesById[major.aiFutureResilienceProfileId];
    const aiScore = calculateAIFutureResilienceScore(profile);
    return {
      id: major.id,
      name: major.name,
      cluster: displayCluster(major.cluster),
      profileName: profile.name,
      components: AI_WEIGHTS.map((w) => profile[w.key]),
      aiScore,
      aiLabel: getAIFutureResilienceLabel(aiScore),
    };
  });
  rows.sort((a, b) => b.aiScore - a.aiScore || a.name.localeCompare(b.name, "id-ID"));
  return {
    fitWeights: FIT_WEIGHTS.map(({ label, weight }) => ({ label, weight })),
    fitThresholds: [...FIT_LABEL_THRESHOLDS],
    aspirationBoosts: ASPIRATION_BOOSTS,
    aiWeights: AI_WEIGHTS.map(({ label, weight }) => ({ label, weight })),
    aiThresholds: [...AI_LABEL_THRESHOLDS],
    majors: rows,
  };
}
