import { subjectIdsFromText } from "./subjectText";

export type SubjectOptionChoice = { primaryId: string; specificityId?: string };

export type SubjectChoice = {
  /** One scoring slot per checkbox; "other_text" for recognized Lainnya text. */
  primaryId: string;
  candidateIds: string[];
  specificityIds: string[];
};

export const subjectChoiceByOption: Record<string, SubjectOptionChoice> = {
  Matematika: { primaryId: "mathematics" },
  "Matematika Tingkat Lanjut": { primaryId: "mathematics", specificityId: "advanced_mathematics" },
  Fisika: { primaryId: "physics" },
  Kimia: { primaryId: "chemistry" },
  Biologi: { primaryId: "biology" },
  Informatika: { primaryId: "computer" },
  "Bahasa Indonesia": { primaryId: "language" },
  "Bahasa Inggris": { primaryId: "language", specificityId: "foreign_language" },
  "Bahasa Asing Lain (Jepang, Mandarin, Arab, Jerman, Korea, dll.)": { primaryId: "language", specificityId: "foreign_language" },
  Ekonomi: { primaryId: "economics" },
  Akuntansi: { primaryId: "accounting" },
  Sosiologi: { primaryId: "sociology" },
  Geografi: { primaryId: "geography" },
  Sejarah: { primaryId: "history" },
  Antropologi: { primaryId: "anthropology" },
  "Pendidikan Pancasila (PPKn)": { primaryId: "civics" },
  "Pendidikan Agama dan Budi Pekerti": { primaryId: "religion" },
  "Seni Rupa/Desain": { primaryId: "arts_design" },
  "Seni Musik": { primaryId: "performing_arts" },
  "Seni Tari/Teater": { primaryId: "performing_arts" },
  "PJOK (Olahraga)": { primaryId: "sports" },
  "Prakarya dan Kewirausahaan": { primaryId: "entrepreneurship" },
  // Legacy (pre-v3.3.0) labels: still valid for saved answers.
  Bahasa: { primaryId: "language" },
  "Seni/Desain": { primaryId: "arts_design" },
  "Komputer/TIK": { primaryId: "computer" },
  Olahraga: { primaryId: "sports" },
};

const SPECIFICITY_IDS = new Set(["advanced_mathematics", "foreign_language"]);

export function buildSubjectChoices(options: readonly string[], otherText: string): SubjectChoice[] {
  const byPrimary = new Map<string, SubjectChoice>();
  for (const option of options) {
    const mapped = subjectChoiceByOption[option];
    if (!mapped) continue;
    const choice = byPrimary.get(mapped.primaryId) ?? { primaryId: mapped.primaryId, candidateIds: [mapped.primaryId], specificityIds: [] };
    if (mapped.specificityId && !choice.specificityIds.includes(mapped.specificityId)) choice.specificityIds.push(mapped.specificityId);
    byPrimary.set(mapped.primaryId, choice);
  }
  const choices = [...byPrimary.values()];
  if (!options.includes("Lainnya")) return choices;

  const textIds = subjectIdsFromText(otherText);
  for (const id of textIds.filter((value) => SPECIFICITY_IDS.has(value))) {
    // e.g. "matematika tingkat lanjut" refines an already chosen Matematika.
    const owner = choices.find((choice) => choice.primaryId === (id === "advanced_mathematics" ? "mathematics" : "language"));
    if (owner && !owner.specificityIds.includes(id)) owner.specificityIds.push(id);
  }
  const primaries = new Set(choices.map((choice) => choice.primaryId));
  const candidateIds = textIds.filter((id) => !SPECIFICITY_IDS.has(id) && !primaries.has(id));
  const specificityIds = textIds.filter((id) => SPECIFICITY_IDS.has(id) && !choices.some((choice) => choice.specificityIds.includes(id)));
  if (candidateIds.length > 0) choices.push({ primaryId: "other_text", candidateIds, specificityIds });
  return choices;
}

/** Unique union of all subject IDs, for display/evidence. */
export function subjectIdsFromChoices(choices: SubjectChoice[]) {
  return [...new Set(choices.flatMap((choice) => [...choice.candidateIds, ...choice.specificityIds]))];
}
