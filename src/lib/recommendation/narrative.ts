import type { Major as KnowledgeMajor } from "../../../data";
import type { RecommendationResult, StudentAnswer } from "@/lib/types";

export interface EnhancedNarrative {
  summary: string;
  recommendationReasons: Record<string, string[]>;
}

export interface RecommendationNarrativeEnhancer {
  enhance(input: {
    answers: StudentAnswer;
    recommendations: RecommendationResult[];
  }): Promise<EnhancedNarrative>;
}

export class HeuristicTemplateNarrativeEnhancer implements RecommendationNarrativeEnhancer {
  async enhance({
    answers,
    recommendations
  }: {
    answers: StudentAnswer;
    recommendations: RecommendationResult[];
  }): Promise<EnhancedNarrative> {
    const top = recommendations[0];
    return {
      summary: top
        ? `Rekomendasi utama untuk ${answers.fullName} adalah ${top.majorName} dengan skor kecocokan ${top.overallFitScore}/100.`
        : "Belum ada rekomendasi yang bisa ditampilkan.",
      recommendationReasons: Object.fromEntries(recommendations.map((recommendation) => [recommendation.majorId, recommendation.reasonBullets]))
    };
  }
}

export class GeminiNarrativeEnhancer implements RecommendationNarrativeEnhancer {
  async enhance(): Promise<EnhancedNarrative> {
    if (process.env.ENABLE_GEMINI_ENHANCEMENT !== "true") {
      throw new Error("Gemini enhancement is disabled for the MVP.");
    }
    throw new Error(
      "GeminiNarrativeEnhancer is a future extension point only. It must not change rankings, major IDs, scores, AI resilience, or scoring breakdowns."
    );
  }
}

function joinPreview(items: string[], fallback: string) {
  if (items.length === 0) return fallback;
  return items.slice(0, 3).join(", ");
}

export function buildRecommendationNarrative(
  answer: StudentAnswer,
  major: KnowledgeMajor,
  recommendation: RecommendationResult
) {
  const topInterests = joinPreview(
    recommendation.scoringBreakdown.matchedInterests,
    answer.favoriteActivities.slice(0, 2).join(", ") || "minat yang kamu pilih"
  );
  const topSkills = joinPreview(
    recommendation.scoringBreakdown.matchedSkills,
    answer.skillStrengths.slice(0, 2).join(", ") || "kekuatan utama kamu"
  );
  const matchedSubjects = joinPreview(recommendation.scoringBreakdown.matchedSubjects, "mata pelajaran pilihanmu");
  const preferenceNote = recommendation.scoringBreakdown.preferenceNotes[0];
  const requiredSkills = joinPreview(
    major.relatedSkills.map((skill) => skill.label),
    "kombinasi skill teknis dan manusia"
  );

  const bullets = [
    `Berdasarkan minat kamu pada ${topInterests} dan kekuatan kamu di ${topSkills}, jurusan ${major.name} cocok karena bidang ini membutuhkan ${requiredSkills}.`,
    `Mata pelajaran seperti ${matchedSubjects} memberi sinyal awal yang relevan dengan arah ${recommendation.cluster}.`,
    `Arah karier yang bisa kamu pertimbangkan adalah ${recommendation.careerDirection}.`,
    `Di era AI, bidang ini memiliki ketahanan ${recommendation.aiFutureResilienceLabel.toLowerCase()} karena ${major.aiFutureResilienceReason}`,
    "AI dapat menjadi alat bantu untuk meningkatkan produktivitas.",
    "Skill manusia seperti komunikasi, empati, kreativitas, dan judgement tetap penting."
  ];

  if (preferenceNote) {
    bullets.splice(3, 0, `Dari sisi preferensi dan batasan, ${preferenceNote}.`);
  }

  return bullets.slice(0, 6);
}
