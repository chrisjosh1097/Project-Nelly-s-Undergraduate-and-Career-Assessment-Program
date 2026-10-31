import type { RecommendationResult } from "@/lib/types";

/** Display-only normalization: never edits stored arrays or report values. */
export function cleanLines(items?: readonly string[]) {
  return [...new Set((items ?? []).map(item => item.trim()).filter(Boolean))];
}

export function scoreText(score?: number) {
  return typeof score === "number" && Number.isFinite(score)
    ? `${score}/100` : "Belum tercatat";
}

export function fitContextFor(r: Pick<RecommendationResult, "overallFitScore" | "fitLabel">) {
  const score = r.overallFitScore;
  const savedLabel = r.fitLabel;
  if (!Number.isFinite(score) || score < 0 || score > 100) return {
    interpretation: Number.isFinite(score) ? "Skor perlu diperiksa" : "Kecocokan belum tercatat",
    explanation: "Periksa nilai laporan tersimpan sebelum menafsirkan kecocokannya.",
    savedLabel, conflicts: true,
  };
  const band = score >= 82
    ? { interpretation: "Sangat cocok", expected: "Sangat Cocok", explanation: "Banyak bagian profil mendukung arah ini; tetap uji melalui kurikulum dan pengalaman praktik." }
    : score >= 70
      ? { interpretation: "Cocok", expected: "Cocok", explanation: "Profil mendukung arah ini; bandingkan tuntutan belajar dan keterampilan yang perlu dikembangkan." }
      : score >= 58
        ? { interpretation: "Kecocokan sedang", expected: "Cukup Cocok", explanation: "Sebagian jawabanmu mendukung arah ini. Uji kecocokannya melalui kurikulum, latihan, dan pengalaman praktik." }
        : { interpretation: "Alternatif eksplorasi", expected: "Perlu Dipertimbangkan Lagi", explanation: "Kecocokan masih terbatas; perlu dipertimbangkan lagi melalui materi pengantar dan proyek kecil." };
  return { interpretation: band.interpretation, explanation: band.explanation, savedLabel, conflicts: savedLabel !== band.expected };
}

export function componentEvidenceFor(r: RecommendationResult, workStyle?: string) {
  const b = r.scoringBreakdown;
  return [
    { label: "Minat", score: b?.interestScore, evidence: cleanLines(b?.matchedInterests) },
    { label: "Skill", score: b?.skillScore, evidence: cleanLines(b?.matchedSkills) },
    { label: "Mata pelajaran", score: b?.subjectScore, evidence: cleanLines(b?.matchedSubjects) },
    { label: "Gaya kerja", score: b?.workStyleScore, evidence: workStyle?.trim() ? [`Pilihanmu: ${workStyle.trim()}`] : [] },
    { label: "Area masalah", score: b?.problemAreaScore, evidence: cleanLines(b?.matchedProblemAreas) },
    { label: "Pertimbangan pribadi", score: b?.constraintFitScore, evidence: cleanLines(b?.preferenceNotes) },
  ];
}

export function comparisonSignalFor(r: RecommendationResult) {
  if (r.overallFitScore < 58) {
    const gap = cleanLines(r.skillGaps)[0];
    if (gap) return `Perlu dilatih: ${gap}`;
    return cleanLines([...(r.cautionNotes ?? []), ...(r.careerCautions ?? [])])[0] ?? "Periksa tuntutan kurikulum sebelum memilih.";
  }
  const match = cleanLines([
    ...(r.scoringBreakdown?.matchedSkills ?? []),
    ...(r.scoringBreakdown?.matchedSubjects ?? []),
    ...(r.scoringBreakdown?.matchedInterests ?? []),
  ])[0];
  return match ? `Sinyal dari jawabanmu: ${match}` : "Rincian kecocokan dapat dilihat di bawah.";
}

/** Generic career-level AI cautions; hidden only when the saved report carries a per-field AI note. */
export const GENERIC_CAREER_AI_CAUTIONS = [
  "Pekerjaan ini tidak hilang, tetapi cara kerjanya akan berubah.",
  "AI bisa menjadi alat bantu, bukan pengganti penuh.",
  "Tetap bangun skill manusia seperti komunikasi, empati, kreativitas, dan judgement.",
];

export function visibleCareerCautions(r: RecommendationResult): string[] {
  const cautions = r.careerCautions ?? [];
  return r.actionGuidance?.aiNote ? cautions.filter(line => !GENERIC_CAREER_AI_CAUTIONS.includes(line.trim())) : cautions;
}
