import {
  aspirationRoutes as curatedRoutes,
  fieldAiNotes,
  genericWeekPlan,
  glossary as curatedGlossary,
  majorsById,
  skillTargets as curatedTargets,
  skillsById,
  weekPlansByCluster,
  weekPlansBySubCluster,
  type GlossaryTerm,
  type SkillTarget,
  type WeekAction,
} from "../../../data";
import type {
  ActionGuidance,
  RecommendationReport,
  RecommendationResult,
  StudentAnswer,
  StudentGuidance,
} from "@/lib/types";
import { normalizeStudentAnswer } from "@/lib/assessment/normalization";

/** Generic AI lines that the per-field note replaces in new reports. */
export const GENERIC_AI_LINES = [
  "Bidang ini tetap relevan, tetapi cara kerjanya akan banyak berubah dengan AI.",
  "AI dapat menjadi alat bantu untuk meningkatkan produktivitas.",
  "Skill manusia seperti komunikasi, empati, kreativitas, dan judgement tetap penting.",
];

const MAX_SKILL_TARGETS = 3;
const MAX_ROUTES = 3;
const MAX_GLOSSARY = 8;
const LOW_SCORE = 50;
const SPECIFIC_ROUTE_IDS = ["japan", "maritime", "mining"];

const targetsByGap = new Map(curatedTargets.map((item) => [normalize(item.gap), item]));
const notesByCluster = new Map(fieldAiNotes.map((item) => [item.cluster, item.note]));

function normalize(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("id-ID");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(text: string, term: string) {
  const caseSensitive = term.length <= 3 && term === term.toUpperCase();
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${escapeRegExp(term)}(?=$|[^\\p{L}\\p{N}])`,
    caseSensitive ? "u" : "iu",
  ).test(text);
}

function listText(values: string[]) {
  if (values.length <= 1) return values[0] ?? "";
  return `${values.slice(0, -1).join(", ")} dan ${values[values.length - 1]}`;
}

export function skillTargetFor(gap: string): SkillTarget {
  const curated = targetsByGap.get(normalize(gap));
  if (curated) return { ...curated };
  return {
    gap,
    target: `Bisa menunjukkan dasar ${gap} lewat satu contoh kecil.`,
    proof: "Simpan satu contoh hasil latihan dan minta guru memberi catatan.",
  };
}

function weekPlanFor(recommendation: RecommendationResult): WeekAction[] {
  const major = majorsById[recommendation.majorId];
  const plan = (major && weekPlansBySubCluster[major.subCluster])
    ?? weekPlansByCluster[recommendation.cluster]
    ?? genericWeekPlan;
  return plan.map((item) => ({ ...item }));
}

function comparisonNoteFor(
  recommendation: RecommendationResult,
  recommendations: RecommendationResult[],
) {
  const higherScoredBelow = recommendations
    .filter((other) => other.rank > recommendation.rank
      && other.overallFitScore > recommendation.overallFitScore)
    .sort((a, b) => b.overallFitScore - a.overallFitScore)[0];
  if (higherScoredBelow) {
    return `Ditampilkan di urutan ${recommendation.rank} agar pilihanmu lebih beragam. Skornya ${recommendation.overallFitScore}, lebih rendah dari ${higherScoredBelow.majorName} (${higherScoredBelow.overallFitScore}).`;
  }
  if (recommendation.overallFitScore < LOW_SCORE) {
    return `Skor ${recommendation.overallFitScore} di bawah ${LOW_SCORE}. Anggap ini pilihan eksplorasi, bukan pilihan utama.`;
  }
  return undefined;
}

function buildActionGuidance(
  recommendation: RecommendationResult,
  recommendations: RecommendationResult[],
): ActionGuidance {
  const aiNote = notesByCluster.get(recommendation.cluster);
  const comparisonNote = comparisonNoteFor(recommendation, recommendations);
  return {
    skillTargets: recommendation.skillGaps.slice(0, MAX_SKILL_TARGETS).map(skillTargetFor),
    weekPlan: weekPlanFor(recommendation),
    ...(aiNote ? { aiNote } : {}),
    ...(comparisonNote ? { comparisonNote } : {}),
  };
}

const COMPONENT_LABELS: [keyof RecommendationResult["scoringBreakdown"], string][] = [
  ["interestScore", "minat"],
  ["skillScore", "skill"],
  ["subjectScore", "mata pelajaran"],
  ["workStyleScore", "gaya kerja"],
  ["problemAreaScore", "bidang masalah"],
  ["constraintFitScore", "kondisi pribadi"],
];

function evidenceSummaryFor(top: RecommendationResult) {
  const breakdown = top.scoringBreakdown;
  const components = COMPONENT_LABELS
    .map(([key, label]) => ({ label, score: Number(breakdown[key]) }))
    .filter((item) => Number.isFinite(item.score));
  const strongest = [...components].sort((a, b) => b.score - a.score).slice(0, 2);
  const weakest = [...components].sort((a, b) => a.score - b.score)[0];
  const evidence = [
    breakdown.matchedSubjects.length ? `mata pelajaran ${listText(breakdown.matchedSubjects.slice(0, 3))}` : "",
    breakdown.matchedProblemAreas.length ? `bidang masalah ${listText(breakdown.matchedProblemAreas.slice(0, 2))}` : "",
    breakdown.matchedInterests.length ? `minat ${listText(breakdown.matchedInterests.slice(0, 2))}` : "",
  ].filter(Boolean);
  const sentences = [
    `Hasil teratasmu ${top.majorName} dengan skor ${top.overallFitScore} (${top.fitLabel}).`,
    strongest.length
      ? `Nilai terkuat: ${strongest.map((item) => `${item.label} ${item.score}`).join(" dan ")}.`
      : "",
    evidence.length ? `Sinyalnya: ${evidence.join("; ")}.` : "",
    weakest && weakest.score < 60
      ? `Nilai terlemah: ${weakest.label} ${weakest.score}. Mulai dari target skill di bawah.`
      : "",
  ];
  return sentences.filter(Boolean).join(" ");
}

const PEOPLE_ROLE_PATTERN = /advisor|support|service|sales|entrepreneur|trainer|konsult|consult|layanan|pelayanan|helpdesk/i;

function tensionsFor(answers: StudentAnswer, top: RecommendationResult) {
  const tensions: string[] = [];
  const breakdown = top.scoringBreakdown;
  const constraints = answers.personalConstraints ?? [];
  if (constraints.includes("Belum tahu minat") || constraints.includes("Takut salah jurusan")) {
    const label = constraints.includes("Belum tahu minat") ? "Belum tahu minat" : "Takut salah jurusan";
    tensions.push(`Kamu memilih "${label}". Jalankan rencana 4 minggu untuk menguji ${top.majorName} sebelum memutuskan.`);
  }

  const major = majorsById[top.majorId];
  const majorSkillIds = new Set(major?.relatedSkills.map((tag) => tag.id) ?? []);
  const unmatchedSkills = normalizeStudentAnswer(answers).skillIds
    .filter((id) => id !== "other" && !majorSkillIds.has(id))
    .map((id) => skillsById[id]?.label)
    .filter((label): label is string => Boolean(label));
  if (breakdown.skillScore < LOW_SCORE && unmatchedSkills.length) {
    tensions.push(`Skill pilihanmu (${listText(unmatchedSkills.slice(0, 3))}) tidak termasuk skill utama ${top.majorName}. Karena itu skor skill hanya ${breakdown.skillScore}.`);
  }

  const peopleFacing = answers.workStyle === "Banyak bertemu orang";
  const majorPeopleFacing = major?.relatedWorkStyles.some((tag) => tag.id === "people_facing") ?? false;
  if (peopleFacing && !majorPeopleFacing) {
    const role = major?.careerDirections.find((direction) => PEOPLE_ROLE_PATTERN.test(direction));
    tensions.push(role
      ? `Kamu suka banyak bertemu orang, sedangkan ${top.majorName} lebih banyak kerja praktik. Peran yang lebih sering bertemu orang: ${role}.`
      : `Kamu suka banyak bertemu orang, sedangkan ${top.majorName} lebih banyak kerja praktik. Tanyakan peran yang melayani pelanggan saat wawancara minggu 3.`);
  }
  return tensions;
}

function aspirationTextOf(answers: StudentAnswer) {
  return [answers.favoriteSubjectsOther, answers.collegePathPreferenceOther, answers.dreamProfession, answers.futureVision]
    .filter(Boolean).join(" ");
}

function routesFor(answers: StudentAnswer) {
  const text = aspirationTextOf(answers);
  if (!text.trim()) return [];
  const matched = curatedRoutes.filter((route) => route.keywords.some((keyword) => containsTerm(text, keyword)));
  const ordered = [
    ...matched.filter((route) => SPECIFIC_ROUTE_IDS.includes(route.id)),
    ...matched.filter((route) => !SPECIFIC_ROUTE_IDS.includes(route.id)),
  ];
  return ordered.slice(0, MAX_ROUTES).map((route) => ({
    title: route.title,
    steps: [...route.steps],
    verify: route.verify,
  }));
}

function glossaryFor(strings: string[]): GlossaryTerm[] {
  const text = strings.join("\n");
  return curatedGlossary
    .filter((term) => [term.term, ...(term.aliases ?? [])].some((name) => containsTerm(text, name)))
    .slice(0, MAX_GLOSSARY)
    .map((term) => ({ ...term, ...(term.aliases ? { aliases: [...term.aliases] } : {}) }));
}

function renderedStrings(recommendations: RecommendationResult[], guidance: Omit<StudentGuidance, "glossary">) {
  const strings: string[] = [guidance.evidenceSummary, ...guidance.tensions];
  for (const route of guidance.aspirationRoutes) strings.push(route.title, ...route.steps, route.verify);
  for (const recommendation of recommendations.slice(0, 3)) {
    strings.push(
      recommendation.majorName,
      recommendation.careerDirection,
      ...(recommendation.degreeTypes ?? []),
      ...recommendation.skillGaps,
      ...recommendation.recommendedNextSteps,
    );
    const action = recommendation.actionGuidance;
    if (action) {
      for (const target of action.skillTargets) strings.push(target.gap, target.target, target.proof);
      for (const week of action.weekPlan) strings.push(week.action, week.proof);
      if (action.aiNote) strings.push(action.aiNote);
      if (action.comparisonNote) strings.push(action.comparisonNote);
    }
  }
  return strings;
}

export function buildStudentGuidance(
  answers: StudentAnswer,
  report: RecommendationReport,
): StudentGuidance {
  const recommendations = report.recommendations;
  const top = recommendations[0] ?? report.topRecommendation;
  const base = {
    evidenceSummary: evidenceSummaryFor(top),
    tensions: tensionsFor(answers, top),
    aspirationRoutes: routesFor(answers),
  };
  return { ...base, glossary: glossaryFor(renderedStrings(recommendations, base)) };
}

/**
 * Attach-only step for new reports: adds guidance and swaps the generic AI lines for one field note.
 * Never changes scores, ranks, IDs, eligibility or scoring breakdowns. Returns a new object.
 */
export function attachStudentGuidance(
  answers: StudentAnswer,
  report: RecommendationReport,
): RecommendationReport {
  const recommendations = report.recommendations.map((recommendation) => {
    const actionGuidance = buildActionGuidance(recommendation, report.recommendations);
    const cautionNotes = [
      ...recommendation.cautionNotes.filter((note) => !GENERIC_AI_LINES.includes(note)),
      ...(actionGuidance.aiNote ? [actionGuidance.aiNote] : []),
    ];
    return { ...recommendation, cautionNotes, actionGuidance };
  });
  const withActions = { ...report, recommendations, topRecommendation: recommendations[0] };
  return { ...withActions, studentGuidance: buildStudentGuidance(answers, withActions) };
}
