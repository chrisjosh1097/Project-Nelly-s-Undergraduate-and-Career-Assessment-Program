import {
  careersById,
  aiResilienceProfilesById,
  constraintRules,
  majors as knowledgeMajors,
  type AIFutureResilienceProfile as KnowledgeAIProfile,
  type Major as KnowledgeMajor,
  type WeightedTag
} from "../../../data";
import { normalizeStudentAnswer } from "@/lib/assessment/normalization";
import type {
  AIFutureResilienceLabel,
  FitLabel,
  NormalizedStudentAnswer,
  RecommendationReport,
  RecommendationResult,
  ScoringBreakdown,
  StudentAnswer,
  TechComfort
} from "@/lib/types";
import { clamp, roundScore, unique } from "@/lib/utils";
import { buildRecommendationNarrative } from "@/lib/recommendation/narrative";
import { generatePtnPtsVokasiAdvice } from "@/lib/recommendation/advice";

export const SCORING_VERSION = "knowledge-base-heuristic-v2.0.0";

const FLEXIBLE_FALLBACK_MAJOR_IDS = [
  "sistem_informasi",
  "manajemen",
  "komunikasi",
  "psikologi",
  "pendidikan_guru_sekolah_dasar",
  "bisnis_digital",
  "administrasi_bisnis",
  "data_science",
  "akuntansi",
  "desain_komunikasi_visual"
];

const RELATED_WORK_STYLE_IDS: Record<string, string[]> = {
  people_facing: ["creative_flexible", "dynamic_field"],
  independent_analysis: ["structured_detail"],
  hands_on: ["dynamic_field", "structured_detail"],
  creative_flexible: ["people_facing"],
  structured_detail: ["independent_analysis", "hands_on"],
  dynamic_field: ["hands_on", "people_facing"]
};

const CLUSTER_LABELS: Record<string, string> = {
  "Technology & Data": "Teknologi & Data",
  "Business & Management": "Bisnis & Manajemen",
  "Finance & Accounting": "Keuangan & Akuntansi",
  "Health & Life Sciences": "Kesehatan & Sains Hayati",
  "Engineering & Infrastructure": "Teknik & Infrastruktur",
  "Creative & Media": "Kreatif & Media",
  "Social, Psychology & Education": "Sosial, Psikologi & Pendidikan",
  "Law, Governance & International": "Hukum, Pemerintahan & Internasional",
  "Hospitality, Tourism & Culinary": "Hospitality, Pariwisata & Kuliner",
  "Agriculture, Food & Environment": "Agrikultur, Pangan & Lingkungan",
  "Language & Culture": "Bahasa & Budaya",
  "Sports & Physical Performance": "Olahraga & Performa Fisik",
  "Vocational & Applied Skills": "Vokasi & Skill Terapan"
};

function displayCluster(cluster: string) {
  return CLUSTER_LABELS[cluster] ?? cluster;
}

function tagLabels(tags: WeightedTag[], selectedIds: string[]) {
  const selected = new Set(selectedIds);
  return tags.filter((tag) => selected.has(tag.id)).map((tag) => tag.label);
}

function scoreWeightedTags(selectedIds: string[], tags: WeightedTag[], emptyFallback = 35) {
  const usableSelectedIds = selectedIds.filter((id) => id !== "other");
  if (usableSelectedIds.length === 0 || tags.length === 0) return emptyFallback;

  const weightById = new Map(tags.map((tag) => [tag.id, tag.weight]));
  const matchedWeights = usableSelectedIds.map((id) => weightById.get(id) ?? 0).filter((weight) => weight > 0);
  if (matchedWeights.length === 0) return 18;

  const denominator = Math.min(usableSelectedIds.length, tags.length) * 100;
  const coverage = (matchedWeights.reduce((sum, weight) => sum + weight, 0) / denominator) * 100;
  const breadthBonus = Math.min(matchedWeights.length * 5, 15);
  return clamp(coverage + breadthBonus);
}

function scoreWorkStyle(selectedId: string, tags: WeightedTag[]) {
  const targetIds = tags.map((tag) => tag.id);
  if (targetIds.includes(selectedId)) return 100;
  const related = RELATED_WORK_STYLE_IDS[selectedId] ?? [];
  if (targetIds.some((id) => related.includes(id))) return 70;
  return 36;
}

function techComfortLevel(value: TechComfort) {
  switch (value) {
    case "Sangat nyaman":
      return 1;
    case "Cukup nyaman":
      return 0.8;
    case "Biasa saja":
      return 0.55;
    case "Kurang nyaman":
      return 0.28;
    case "Belum pernah mencoba":
      return 0.12;
  }
}

function levelValue(value: "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi") {
  if (value === "Tinggi" || value === "Sangat Tinggi") return 3;
  if (value === "Sedang") return 2;
  return 1;
}

function jobFlexValue(value: string) {
  if (value === "Tinggi") return 3;
  if (value === "Sedang") return 2;
  return 1;
}

function hasTechnologySignal(major: KnowledgeMajor) {
  return (
    major.cluster === "Technology & Data" ||
    major.relatedSkills.some((tag) => tag.id === "technology") ||
    major.relatedInterests.some((tag) => tag.id === "tech_ai" || tag.id === "coding")
  );
}

function schoolBackgroundBoost(answer: StudentAnswer, major: KnowledgeMajor) {
  const schoolMajor = answer.currentSchoolMajor;
  if (schoolMajor === "SMK Teknik") {
    return major.cluster === "Vocational & Applied Skills" || major.cluster === "Engineering & Infrastructure" || major.cluster === "Technology & Data"
      ? 8
      : 0;
  }
  if (schoolMajor === "SMK Bisnis") {
    return major.cluster === "Business & Management" || major.cluster === "Finance & Accounting" || major.id === "administrasi_perkantoran" ? 8 : 0;
  }
  if (schoolMajor === "SMK Kesehatan") {
    return major.cluster === "Health & Life Sciences" || major.id === "rekam_medis" ? 8 : 0;
  }
  if (schoolMajor === "SMK Kreatif/Multimedia") {
    return major.cluster === "Creative & Media" || major.id === "uiux_design_applied" || major.id === "digital_marketing_applied" ? 8 : 0;
  }
  if (schoolMajor === "IPA") {
    return ["Technology & Data", "Health & Life Sciences", "Engineering & Infrastructure", "Agriculture, Food & Environment"].includes(major.cluster) ? 6 : 0;
  }
  if (schoolMajor === "IPS") {
    return ["Business & Management", "Finance & Accounting", "Social, Psychology & Education", "Law, Governance & International"].includes(major.cluster) ? 6 : 0;
  }
  if (schoolMajor === "Bahasa") {
    return ["Language & Culture", "Creative & Media", "Law, Governance & International", "Social, Psychology & Education"].includes(major.cluster) ? 6 : 0;
  }
  return 0;
}

function scoreConstraints(answer: StudentAnswer, normalized: NormalizedStudentAnswer, major: KnowledgeMajor) {
  let score = 68;
  const notes: string[] = [];

  for (const constraintId of normalized.constraintIds) {
    const rule = constraintRules.find((item) => item.id === constraintId);
    if (rule?.boostMajorIds.includes(major.id)) {
      score += 10;
      notes.push(rule.label.toLowerCase());
    }
    if (rule?.cautionMajorIds.includes(major.id)) {
      score -= 12;
      notes.push(`perlu perhatian: ${rule.label.toLowerCase()}`);
    }
    if (major.recommendedForConstraints.includes(constraintId)) score += 8;
    if (major.notRecommendedForConstraints.includes(constraintId)) score -= 10;
  }

  if (normalized.constraintIds.includes("cost_sensitive")) {
    if (major.educationCostLevel === "Sangat Tinggi") {
      score -= 18;
      notes.push("biaya perlu direncanakan serius");
    } else if (major.educationCostLevel === "Tinggi") {
      score -= 8;
      notes.push("bandingkan biaya dan beasiswa");
    }
  }

  if (normalized.constraintIds.includes("wants_fast_employment") && major.industryPracticality === "Tinggi") {
    score += 10;
    notes.push("punya jalur praktik dan entry-level yang cukup jelas");
  }

  if (
    normalized.constraintIds.includes("prefers_vocational") &&
    major.degreeTypes.some((type) => ["D3", "D4", "Vokasi", "Sertifikasi"].includes(type))
  ) {
    score += 12;
    notes.push("selaras dengan jalur vokasi atau terapan");
  }

  if (normalized.constraintIds.includes("prefers_certification") && major.certificationSuggestions.length > 0) {
    score += 6;
    notes.push("bisa diperkuat dengan sertifikasi atau portofolio");
  }

  if (hasTechnologySignal(major)) {
    const techComfort = techComfortLevel(answer.techComfort);
    score += Math.round((techComfort - 0.45) * 12);
    if (techComfort < 0.35) {
      notes.push("mulai dari literasi digital dan AI dasar");
    }
  }

  const backgroundBoost = schoolBackgroundBoost(answer, major);
  if (backgroundBoost > 0) {
    score += backgroundBoost;
    notes.push("latar sekolah kamu relevan");
  }

  return {
    score: roundScore(score),
    notes: unique(notes).slice(0, 4)
  };
}

export function calculateAIFutureResilienceScore(profile: KnowledgeAIProfile) {
  const components = [
    profile.humanInteraction,
    profile.creativity,
    profile.physicalPractical,
    profile.ethicalJudgment,
    profile.complexProblemSolving,
    profile.professionalAccountability,
    profile.aiAugmentationPotential,
    profile.industryGrowth,
    profile.nonRoutineWork
  ];

  if (components.some((value) => Number.isNaN(value) || value < 0 || value > 100)) return 0;

  return roundScore(
    profile.humanInteraction * 0.15 +
      profile.creativity * 0.12 +
      profile.physicalPractical * 0.1 +
      profile.ethicalJudgment * 0.12 +
      profile.complexProblemSolving * 0.15 +
      profile.professionalAccountability * 0.1 +
      profile.aiAugmentationPotential * 0.12 +
      profile.industryGrowth * 0.09 +
      profile.nonRoutineWork * 0.05
  );
}

export function getAIFutureResilienceLabel(score: number): AIFutureResilienceLabel {
  if (score >= 80) return "Tinggi";
  if (score >= 60) return "Sedang";
  return "Perlu Adaptasi Tinggi";
}

export function getFitLabel(score: number): FitLabel {
  if (score >= 82) return "Sangat Cocok";
  if (score >= 70) return "Cocok";
  if (score >= 58) return "Cukup Cocok";
  return "Perlu Dipertimbangkan Lagi";
}

export function calculateScoringBreakdown(answer: StudentAnswer, major: KnowledgeMajor): ScoringBreakdown {
  const normalized = normalizeStudentAnswer(answer);
  const interestScore = scoreWeightedTags(normalized.interestIds, major.relatedInterests);
  const skillScore = scoreWeightedTags(normalized.skillIds, major.relatedSkills);
  const subjectScore = scoreWeightedTags(normalized.favoriteSubjectIds, major.relatedSubjects);
  const workStyleScore = scoreWorkStyle(normalized.workStyleId, major.relatedWorkStyles);
  const problemAreaScore = scoreWeightedTags(normalized.problemAreaIds, major.relatedProblemAreas);
  const constraint = scoreConstraints(answer, normalized, major);

  return {
    interestScore: roundScore(interestScore),
    skillScore: roundScore(skillScore),
    subjectScore: roundScore(subjectScore),
    workStyleScore: roundScore(workStyleScore),
    problemAreaScore: roundScore(problemAreaScore),
    constraintFitScore: constraint.score,
    matchedSubjects: tagLabels(major.relatedSubjects, normalized.favoriteSubjectIds),
    matchedInterests: tagLabels(major.relatedInterests, normalized.interestIds),
    matchedSkills: tagLabels(major.relatedSkills, normalized.skillIds),
    matchedProblemAreas: tagLabels(major.relatedProblemAreas, normalized.problemAreaIds),
    preferenceNotes: constraint.notes,
    normalizedSubjectIds: normalized.favoriteSubjectIds,
    normalizedInterestIds: normalized.interestIds,
    normalizedSkillIds: normalized.skillIds,
    normalizedWorkStyleId: normalized.workStyleId,
    normalizedProblemAreaIds: normalized.problemAreaIds,
    normalizedConstraintIds: normalized.constraintIds
  };
}

export function calculateOverallFitScore(breakdown: ScoringBreakdown) {
  return roundScore(
    breakdown.interestScore * 0.3 +
      breakdown.skillScore * 0.25 +
      breakdown.subjectScore * 0.15 +
      breakdown.workStyleScore * 0.1 +
      breakdown.problemAreaScore * 0.1 +
      breakdown.constraintFitScore * 0.1
  );
}

function careerTitles(major: KnowledgeMajor) {
  return major.relatedCareers.map((careerId) => careersById[careerId]?.title ?? careerId).slice(0, 5);
}

function buildCareerDirection(major: KnowledgeMajor) {
  return major.careerDirections.slice(0, 3).join(", ") || "Arah karier fleksibel sesuai portofolio dan pengalaman belajar.";
}

function buildSkillGaps(answer: StudentAnswer, major: KnowledgeMajor) {
  const normalized = normalizeStudentAnswer(answer);
  const selected = new Set(normalized.skillIds);
  const missingCoreSkills = major.relatedSkills.filter((skill) => !selected.has(skill.id)).map((skill) => skill.label);
  const suggestions = [...missingCoreSkills, ...major.certificationSuggestions, ...major.portfolioSuggestions];
  return unique(suggestions).slice(0, 5);
}

function buildNextSteps(answer: StudentAnswer, major: KnowledgeMajor) {
  const nextSteps = [
    ...major.beginnerFriendlyNextSteps,
    ...major.portfolioSuggestions.slice(0, 2),
    ...major.internshipSuggestions.slice(0, 1)
  ];

  if (answer.personalConstraints.includes("Ingin cepat kerja")) {
    nextSteps.push("Bangun portofolio, magang, proyek nyata, atau sertifikasi sejak awal.");
  }
  if (answer.personalConstraints.includes("Biaya") || answer.personalConstraints.includes("Ingin beasiswa")) {
    nextSteps.push("Bandingkan biaya PTN, PTS, vokasi, biaya hidup, dan peluang beasiswa sebelum menentukan pilihan.");
  }
  if (answer.personalConstraints.includes("Belum tahu minat") || answer.personalConstraints.includes("Takut salah jurusan")) {
    nextSteps.push("Coba mini project 2 minggu dan diskusikan hasilnya dengan guru BK atau mentor.");
  }
  if (techComfortLevel(answer.techComfort) < 0.35 && hasTechnologySignal(major)) {
    nextSteps.push("Mulai pelajari literasi digital dan AI dasar secara bertahap; AI dapat menjadi alat bantu produktivitas.");
  }

  return unique(nextSteps).slice(0, 6);
}

function costAlternativeText() {
  const alternatives = constraintRules.find((rule) => rule.id === "cost_sensitive")?.alternativeMajorIds ?? [];
  const names = alternatives
    .map((id) => knowledgeMajors.find((major) => major.id === id)?.name)
    .filter(Boolean)
    .slice(0, 4)
    .join(", ");
  return names ? `Alternatif serumpun yang bisa dibandingkan: ${names}.` : "";
}

function buildAnswerPatternNotes(answer: StudentAnswer) {
  const normalized = normalizeStudentAnswer(answer);
  const notes: string[] = [];
  const clearInterests = normalized.interestIds.filter((id) => id !== "other");

  if (clearInterests.length <= 2) {
    notes.push("Jawabanmu masih cukup umum, jadi gunakan hasil ini sebagai titik awal eksplorasi.");
  }
  if (clearInterests.length >= 7 || answer.favoriteActivities.length >= 6) {
    notes.push("Minatmu cukup beragam. Kamu bisa mempertimbangkan jurusan fleksibel dan mencoba beberapa mini project.");
  }
  if (normalized.constraintIds.includes("prefers_ptn_outside_java") && normalized.constraintIds.includes("far_location")) {
    notes.push("Kamu tertarik PTN luar Jawa tetapi juga khawatir jarak; pastikan biaya hidup, adaptasi, dan dukungan keluarga sudah dipertimbangkan.");
  }
  if (techComfortLevel(answer.techComfort) < 0.35) {
    notes.push("Kamu belum terlalu nyaman dengan AI. Tidak apa-apa; mulai dari literasi digital dan penggunaan AI yang aman sebagai alat bantu.");
  }

  return unique(notes);
}

function buildCautionNotes(answer: StudentAnswer, major: KnowledgeMajor) {
  const notes = [...major.cautionNotes, ...buildAnswerPatternNotes(answer)];

  if (answer.personalConstraints.includes("Biaya") && levelValue(major.educationCostLevel) >= 3) {
    notes.push("Karena biaya menjadi pertimbangan, pertahankan rekomendasi ini jika fit tinggi, tetapi siapkan rencana beasiswa dan pilihan serumpun.");
    const alternatives = costAlternativeText();
    if (alternatives) notes.push(alternatives);
  }
  if (answer.personalConstraints.includes("Persaingan masuk")) {
    notes.push("Siapkan pilihan utama dan cadangan dengan cluster serupa agar peluang tetap terbuka.");
  }
  notes.push("Bidang ini tetap relevan, tetapi cara kerjanya akan banyak berubah dengan AI.");
  notes.push("AI dapat menjadi alat bantu untuk meningkatkan produktivitas.");
  notes.push("Skill manusia seperti komunikasi, empati, kreativitas, dan judgement tetap penting.");

  return unique(notes).slice(0, 7);
}

export function scoreMajor(answer: StudentAnswer, major: KnowledgeMajor, rank = 0): RecommendationResult {
  const scoringBreakdown = calculateScoringBreakdown(answer, major);
  const overallFitScore = calculateOverallFitScore(scoringBreakdown);
  const aiProfile = aiResilienceProfilesById[major.aiFutureResilienceProfileId];
  const aiFutureResilienceScore = aiProfile
    ? calculateAIFutureResilienceScore(aiProfile)
    : roundScore(major.aiFutureResilienceScore);
  const recommendation: RecommendationResult = {
    rank,
    majorId: major.id,
    majorName: major.name,
    cluster: displayCluster(major.cluster),
    careerDirection: buildCareerDirection(major),
    relatedCareers: careerTitles(major),
    overallFitScore,
    fitLabel: getFitLabel(overallFitScore),
    aiFutureResilienceScore,
    aiFutureResilienceLabel: getAIFutureResilienceLabel(aiFutureResilienceScore),
    reasonBullets: [],
    skillStrengthMatches: scoringBreakdown.matchedSkills,
    skillGaps: buildSkillGaps(answer, major),
    recommendedNextSteps: buildNextSteps(answer, major),
    cautionNotes: buildCautionNotes(answer, major),
    scoringBreakdown
  };

  recommendation.reasonBullets = buildRecommendationNarrative(answer, major, recommendation);
  return recommendation;
}

function validRecommendation(recommendation: RecommendationResult) {
  return Boolean(recommendation.majorId && recommendation.majorName && recommendation.careerDirection);
}

export function generateRecommendations(answer: StudentAnswer): RecommendationReport {
  const scored = knowledgeMajors
    .map((major) => ({ major, recommendation: scoreMajor(answer, major) }))
    .filter(({ recommendation }) => validRecommendation(recommendation))
    .sort((left, right) => {
      if (right.recommendation.overallFitScore !== left.recommendation.overallFitScore) {
        return right.recommendation.overallFitScore - left.recommendation.overallFitScore;
      }
      if (right.recommendation.aiFutureResilienceScore !== left.recommendation.aiFutureResilienceScore) {
        return right.recommendation.aiFutureResilienceScore - left.recommendation.aiFutureResilienceScore;
      }
      const jobFlexDiff = jobFlexValue(right.major.jobMarketFlexibility) - jobFlexValue(left.major.jobMarketFlexibility);
      if (jobFlexDiff !== 0) return jobFlexDiff;
      return left.recommendation.majorName.localeCompare(right.recommendation.majorName, "id-ID");
    });

  const byId = new Map<string, RecommendationResult>();
  const strongMatches = scored.filter((item) => item.recommendation.overallFitScore >= 58);

  for (const item of strongMatches) {
    byId.set(item.recommendation.majorId, item.recommendation);
    if (byId.size >= 10) break;
  }

  for (const majorId of FLEXIBLE_FALLBACK_MAJOR_IDS) {
    if (byId.size >= 10) break;
    const fallback = knowledgeMajors.find((major) => major.id === majorId);
    if (fallback && !byId.has(fallback.id)) byId.set(fallback.id, scoreMajor(answer, fallback));
  }

  for (const item of scored) {
    if (byId.size >= 10) break;
    if (!byId.has(item.recommendation.majorId)) byId.set(item.recommendation.majorId, item.recommendation);
  }

  const recommendations = Array.from(byId.values())
    .slice(0, 10)
    .map((recommendation, index) => ({ ...recommendation, rank: index + 1 }));

  if (recommendations.length !== 10) {
    throw new Error("Recommendation engine failed to produce exactly 10 recommendations.");
  }

  return {
    generatedAt: new Date().toISOString(),
    topRecommendation: recommendations[0],
    recommendations,
    scoringVersion: SCORING_VERSION,
    narrativeVersion: "heuristic-template-v2.0.0",
    ptnPtsVokasiAdvice: generatePtnPtsVokasiAdvice(answer),
    answerPatternNotes: buildAnswerPatternNotes(answer)
  };
}
