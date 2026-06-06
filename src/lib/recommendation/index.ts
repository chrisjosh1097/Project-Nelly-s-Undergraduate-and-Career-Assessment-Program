export {
  SCORING_VERSION,
  calculateAIFutureResilienceScore,
  calculateOverallFitScore,
  calculateScoringBreakdown,
  generateRecommendations,
  getAIFutureResilienceLabel,
  getFitLabel,
  scoreMajor
} from "@/lib/recommendation/scoring";
export { majors, careers } from "../../../data";
export {
  GeminiNarrativeEnhancer,
  HeuristicTemplateNarrativeEnhancer,
  enhanceRecommendationReport,
  type RecommendationNarrativeEnhancer
} from "@/lib/recommendation/narrative";
export type { EnhancedNarrative } from "@/lib/types";
export { generatePtnPtsVokasiAdvice } from "@/lib/recommendation/advice";
