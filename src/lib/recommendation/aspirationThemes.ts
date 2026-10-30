import type { StudentAnswer } from "@/lib/types";

// Narrative themes only: these must never change numeric aspiration boosts.
export function aspirationFlags(answers?: StudentAnswer) {
  const text = answers
    ? [answers.favoriteSubjectsOther, answers.collegePathPreferenceOther,
      answers.dreamProfession, answers.futureVision]
      .join(" ").replace(/\s+/g, " ").trim().toLowerCase()
    : "";
  const has = (terms: string) => new RegExp(
    `(?:^|[^\\p{L}\\p{N}])(?:${terms})(?=$|[^\\p{L}\\p{N}])`, "iu",
  ).test(text);
  return {
    hasText: text.trim().length > 0,
    hasHelping: has("membantu|bantu|menolong|mendampingi|melayani|pelayanan|berdampak|impact"),
    hasRights: has("ham|hak asasi|keadilan|advokasi|memperjuangkan|hukum|legal|kebijakan|policy|regulasi"),
    hasEnvironment: has("lingkungan|iklim|climate|sustainability|sustainable|keberlanjutan|konservasi|hutan|limbah|alam|esg"),
    hasEducation: has("pendidikan|mengajar|guru|sekolah|anak|literasi"),
    hasHealth: has("kesehatan|medis|rumah sakit|dokter|perawat|gizi|mental"),
    hasEngineering: has("teknik|engineer|engineering|insinyur|teknisi"),
    hasMaritime: has("maritim|maritime|kelautan|perkapalan|kapal|pelayaran"),
    hasMining: has("tambang|pertambangan|mining|mineral"),
    hasOverseas: has("luar negeri|overseas|internasional|international|abroad"),
    hasJapan: has("jepang|japan"),
  };
}
