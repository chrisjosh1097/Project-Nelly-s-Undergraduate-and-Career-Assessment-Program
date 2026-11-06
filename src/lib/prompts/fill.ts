import { aiPrompts, PROMPT_ENDING, resultPromptIds, type AiPrompt, type PromptField } from "../../../data/aiPrompts";
import { formatSchoolMajor } from "@/lib/assessment/schoolMajorDisplay";
import type { RecommendationResult, StudentAnswer } from "@/lib/types";

export type PromptValues = Partial<Record<PromptField, string>>;

/** Shown when a field is empty, so the student knows what to type before sending. */
export const PROMPT_FIELD_FALLBACK: Record<PromptField, string> = {
  jurusanSekolah: "[jurusan sekolahmu]",
  aktivitas: "[kegiatan yang kamu suka]",
  jurusanKuliah: "[jurusan kuliah]",
  karier: "[nama karier]",
};

export const PROMPT_FIELD_MAX = 80;

function clean(value?: string) {
  return (value ?? "").replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, PROMPT_FIELD_MAX);
}

/** Fills placeholders and appends the shared safety ending. Unknown/empty fields keep a visible [placeholder]. */
export function fillPrompt(prompt: Pick<AiPrompt, "template">, values: PromptValues): string {
  const body = prompt.template.replace(/\{(jurusanSekolah|aktivitas|jurusanKuliah|karier)\}/g,
    (_, key: PromptField) => clean(values[key]) || PROMPT_FIELD_FALLBACK[key]);
  return `${body} ${PROMPT_ENDING}`;
}

/** Display-only values from a stored report. Works for legacy reports without nicheCareerPaths or the "Lainnya" text. */
export function promptValuesFor(answers: Pick<StudentAnswer, "currentSchoolMajor" | "favoriteActivities"> & { currentSchoolMajorOther?: string },
  recommendation: Pick<RecommendationResult, "majorName" | "relatedCareers" | "nicheCareerPaths">): PromptValues {
  const careers = [...(recommendation.nicheCareerPaths ?? []), ...(recommendation.relatedCareers ?? [])].map(c => clean(c)).filter(Boolean);
  const activities = (answers.favoriteActivities ?? []).map(a => clean(a)).filter(a => a && a !== "Lainnya").slice(0, 3);
  return {
    // "Lainnya — X" reads oddly inside a sentence; use the typed text, or leave the placeholder.
    jurusanSekolah: answers.currentSchoolMajor === "Lainnya" ? clean(answers.currentSchoolMajorOther) : clean(formatSchoolMajor(answers)),
    aktivitas: activities.join(", "),
    jurusanKuliah: clean(recommendation.majorName),
    karier: careers[0] ?? "",
  };
}

export function resultPrompts(): AiPrompt[] {
  return resultPromptIds.map(id => aiPrompts.find(p => p.id === id)!);
}

/** Query string for /prompt. Only non-identifying fields: school major, college major and career. */
export function promptBankHref(values: PromptValues): string {
  const params = new URLSearchParams();
  for (const key of ["jurusanSekolah", "jurusanKuliah", "karier"] as const) {
    const value = clean(values[key]);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/prompt?${query}` : "/prompt";
}
