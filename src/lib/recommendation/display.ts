import type { EnhancedNarrative, Submission } from "@/lib/types";

export const CAREER_MATCH_LABEL = "KARIR YANG SESUAI";

export function shouldShowAlternativePathway(
  narrativeSource: EnhancedNarrative["source"] | undefined,
  careerPathwayAdvice: string[] | undefined
) {
  return narrativeSource === "gemini" && Array.isArray(careerPathwayAdvice) && careerPathwayAdvice.length > 0;
}

function shortList(items: string[], fallback: string) {
  const values = items.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  return values.length > 0 ? values.join(", ") : fallback;
}

export function studentStrengthHighlightsFor(submission: Pick<Submission, "answers" | "report">) {
  const narrativeStrengths = submission.report.narrative?.studentStrengths?.filter(Boolean) ?? [];
  if (narrativeStrengths.length > 0) return narrativeStrengths.slice(0, 3);

  const top = submission.report.topRecommendation;
  const answers = submission.answers;
  const skills = top.skillStrengthMatches.length > 0 ? top.skillStrengthMatches : answers.skillStrengths;
  const subjects = [...answers.favoriteSubjects.filter((item) => item !== "Lainnya"), answers.favoriteSubjectsOther].filter(Boolean);
  const activities = answers.favoriteActivities.filter(Boolean);

  return [
    `Kamu punya modal awal di ${shortList(skills, "kekuatan utama yang kamu pilih")}.`,
    `Minat pada ${shortList(subjects.length > 0 ? subjects : activities, "aktivitas dan pelajaran yang kamu isi")} bisa menjadi bahan eksplorasi lanjut.`,
    `Gaya kerja ${answers.workStyle.toLowerCase()} dapat membantu kamu membangun kebiasaan belajar dan portofolio.`
  ].slice(0, 3);
}
