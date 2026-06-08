import type { EnhancedNarrative } from "@/lib/types";

export const CAREER_MATCH_LABEL = "KARIR YANG SESUAI";

export function shouldShowAlternativePathway(
  narrativeSource: EnhancedNarrative["source"] | undefined,
  careerPathwayAdvice: string[] | undefined
) {
  return narrativeSource === "gemini" && Array.isArray(careerPathwayAdvice) && careerPathwayAdvice.length > 0;
}
