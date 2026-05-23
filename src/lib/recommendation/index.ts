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
  type EnhancedNarrative,
  type RecommendationNarrativeEnhancer
} from "@/lib/recommendation/narrative";
export { generatePtnPtsVokasiAdvice } from "@/lib/recommendation/advice";
