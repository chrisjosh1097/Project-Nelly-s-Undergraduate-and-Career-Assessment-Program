import { describe, expect, it } from "vitest";
import baseline from "./fixtures/v32-baseline.json" with { type: "json" };
import { majors, subjects } from "../data";
import { eligibleMajors } from "@/lib/recommendation/eligibility";
import { generateRecommendations, scoreMajor, SCORING_VERSION } from "@/lib/recommendation";
import { favoriteSubjectOptions, legacyFavoriteSubjectOptions } from "@/lib/assessment/options";
import { subjectIdsFromText } from "@/lib/assessment/subjectText";
import { buildSubjectChoices, subjectChoiceByOption } from "@/lib/assessment/subjectChoices";
import { normalizeStudentAnswer } from "@/lib/assessment/normalization";
import { scoreSubjectChoices } from "@/lib/recommendation/subjectScore";
import { studentAnswerSchema } from "@/lib/validation";
import type { StudentAnswer } from "@/lib/types";
import { techAnswer } from "./fixtures";

const answer = (patch: Partial<StudentAnswer>): StudentAnswer => ({ ...techAnswer, dreamProfession: "", futureVision: "", ...patch });
const majorById = (id: string) => majors.find((m) => m.id === id)!;

describe("v3.3 subject options", () => {
  it("lists every SMA subject explicitly and ends with Lainnya", () => {
    expect(favoriteSubjectOptions).toEqual([
      "Matematika", "Matematika Tingkat Lanjut", "Fisika", "Kimia", "Biologi", "Informatika",
      "Bahasa Indonesia", "Bahasa Inggris", "Bahasa Asing Lain (Jepang, Mandarin, Arab, Jerman, Korea, dll.)",
      "Ekonomi", "Akuntansi", "Sosiologi", "Geografi", "Sejarah", "Antropologi",
      "Pendidikan Pancasila (PPKn)", "Pendidikan Agama dan Budi Pekerti", "Seni Rupa/Desain", "Seni Musik",
      "Seni Tari/Teater", "PJOK (Olahraga)", "Prakarya dan Kewirausahaan", "Lainnya",
    ]);
    expect(legacyFavoriteSubjectOptions).toEqual(["Bahasa", "Seni/Desain", "Komputer/TIK", "Olahraga"]);
  });

  it("maps every option to known subject IDs", () => {
    const known = new Set(subjects.map((s) => s.id));
    for (const option of [...favoriteSubjectOptions, ...legacyFavoriteSubjectOptions]) {
      if (option === "Lainnya") continue;
      const choice = subjectChoiceByOption[option];
      expect(choice, option).toBeDefined();
      expect(known.has(choice.primaryId), option).toBe(true);
      if (choice.specificityId) expect(known.has(choice.specificityId), option).toBe(true);
    }
  });

  it("validates new, legacy and mixed answers but rejects four choices or unknown labels", () => {
    const ok = (favoriteSubjects: string[]) => studentAnswerSchema.safeParse(answer({ favoriteSubjects })).success;
    expect(ok(["Geografi", "Pendidikan Pancasila (PPKn)", "Matematika Tingkat Lanjut"])).toBe(true);
    expect(ok(["Bahasa", "Seni/Desain", "Komputer/TIK"])).toBe(true);
    expect(ok(["Olahraga", "Geografi"])).toBe(true);
    expect(ok(["Matematika", "Fisika", "Kimia", "Biologi"])).toBe(false);
    expect(ok(["Astrologi"])).toBe(false);
  });
});

describe("free-text subject regex", () => {
  it.each([
    ["geografi, agama", ["geography", "religion"]],
    ["Geografis", ["geography"]],
    ["PPKn", ["civics"]],
    ["pkn", ["civics"]],
    ["pendidikan pancasila", ["civics"]],
    ["antropologi", ["anthropology"]],
    ["seni tari", ["performing_arts"]],
    ["musik", ["performing_arts"]],
    ["bahasa inggris", ["language", "foreign_language"]],
    ["bahasa jepang", ["language", "foreign_language"]],
    ["matematika tingkat lanjut", ["mathematics", "advanced_mathematics"]],
    ["informatika", ["computer"]],
    ["wirausaha", ["entrepreneurship"]],
    ["fisipol", []],
    ["nggak tahu", []],
    ["--", []],
    ["", []],
  ])("%s", (text, expected) => {
    expect(subjectIdsFromText(text)).toEqual(expected);
  });

  it("does not match short tokens inside other words", () => {
    expect(subjectIdsFromText("sampai pagi")).toEqual([]);
    expect(subjectIdsFromText("geometri")).toEqual([]);
  });
});

describe("subject choices", () => {
  it("merges choices with the same primary subject", () => {
    expect(buildSubjectChoices(["Matematika", "Matematika Tingkat Lanjut"], "")).toEqual([
      { primaryId: "mathematics", candidateIds: ["mathematics"], specificityIds: ["advanced_mathematics"] },
    ]);
  });

  it("only reads Lainnya text when Lainnya is checked, as one slot", () => {
    expect(buildSubjectChoices(["Fisika"], "geografi")).toHaveLength(1);
    expect(buildSubjectChoices(["Fisika", "Lainnya"], "geografi dan ppkn")).toEqual([
      { primaryId: "physics", candidateIds: ["physics"], specificityIds: [] },
      { primaryId: "other_text", candidateIds: ["geography", "civics"], specificityIds: [] },
    ]);
    expect(buildSubjectChoices(["Fisika", "Lainnya"], "fisika lagi")).toHaveLength(1);
    expect(buildSubjectChoices(["Lainnya"], "tidak ada")).toEqual([]);
  });

  it("exposes merged IDs on the normalized answer", () => {
    const normalized = normalizeStudentAnswer(answer({ favoriteSubjects: ["Matematika Tingkat Lanjut", "Lainnya"], favoriteSubjectsOther: "geografi" }));
    expect(normalized.favoriteSubjectIds).toEqual(["mathematics", "advanced_mathematics", "geography"]);
    expect(normalized.favoriteSubjectChoices).toHaveLength(2);
  });
});

describe("choice-based subject score", () => {
  const tags = majorById("teknik_geologi").relatedSubjects;

  it("keeps the v3.2 fallbacks", () => {
    expect(scoreSubjectChoices([], tags)).toBe(35);
    expect(scoreSubjectChoices(buildSubjectChoices(["Ekonomi"], ""), majorById("teknik_geomatika_gis").relatedSubjects)).toBe(18);
  });

  it("never lets a specific option score below its base option", () => {
    for (const major of majors) {
      const base = scoreSubjectChoices(buildSubjectChoices(["Matematika"], ""), major.relatedSubjects);
      const specific = scoreSubjectChoices(buildSubjectChoices(["Matematika Tingkat Lanjut"], ""), major.relatedSubjects);
      expect(specific, major.id).toBeGreaterThanOrEqual(base);
      const lang = scoreSubjectChoices(buildSubjectChoices(["Bahasa Indonesia"], ""), major.relatedSubjects);
      const english = scoreSubjectChoices(buildSubjectChoices(["Bahasa Inggris"], ""), major.relatedSubjects);
      expect(english, major.id).toBeGreaterThanOrEqual(lang);
    }
  });

  it("gives advanced mathematics a bounded bonus on math-heavy majors", () => {
    const stat = majorById("statistika").relatedSubjects;
    const base = scoreSubjectChoices(buildSubjectChoices(["Matematika", "Ekonomi"], ""), stat);
    const specific = scoreSubjectChoices(buildSubjectChoices(["Matematika Tingkat Lanjut", "Ekonomi"], ""), stat);
    expect(specific - base).toBe(Math.min(4, 100 - base));
    const sd = majorById("pendidikan_matematika").relatedSubjects;
    const sdBase = scoreSubjectChoices(buildSubjectChoices(["Matematika", "Biologi", "Sejarah"], ""), sd);
    expect(scoreSubjectChoices(buildSubjectChoices(["Matematika Tingkat Lanjut", "Biologi", "Sejarah"], ""), sd)).toBe(Math.min(100, sdBase + 4));
  });

  it("counts recognized Lainnya text once and ignores unmatched text", () => {
    const geo = majorById("teknik_geologi").relatedSubjects;
    const without = scoreSubjectChoices(buildSubjectChoices(["Ekonomi", "Lainnya"], "tidak tahu"), geo);
    const withGeo = scoreSubjectChoices(buildSubjectChoices(["Ekonomi", "Lainnya"], "geografi"), geo);
    expect(without).toBe(scoreSubjectChoices(buildSubjectChoices(["Ekonomi"], ""), geo));
    expect(withGeo).toBeGreaterThan(without);
    // Recognized text can only help (Fisika alone already matches strongly).
    const fis = scoreSubjectChoices(buildSubjectChoices(["Fisika"], ""), geo);
    expect(scoreSubjectChoices(buildSubjectChoices(["Fisika", "Lainnya"], "geografi"), geo)).toBeGreaterThanOrEqual(fis);
    const many = scoreSubjectChoices(buildSubjectChoices(["Lainnya"], "geografi kimia fisika"), geo);
    expect(many).toBeLessThanOrEqual(100);
  });
});

describe("v3.2 baseline is preserved for legacy-label answers", () => {
  it("uses the v3.3.0 scoring version", () => {
    expect(SCORING_VERSION).toBe("knowledge-base-heuristic-v3.3.0");
  });

  for (const [index, item] of (baseline.cases as unknown as Array<{ answer: StudentAnswer; topIds: string[]; scores: Record<string, [number, number]> }>).entries()) {
    it(`case ${index}: identical top 10 and per-major scores`, () => {
      expect(generateRecommendations(item.answer).recommendations.map((r) => r.majorId)).toEqual(item.topIds);
      for (const major of eligibleMajors(majors, item.answer.educationPathway)) {
        const r = scoreMajor(item.answer, major);
        expect([r.scoringBreakdown.subjectScore, r.overallFitScore], major.id).toEqual(item.scores[major.id]);
      }
    });
  }
});

describe("KB subject tags", () => {
  const appended: Record<string, string[]> = {
    geography: ["teknik_geologi", "teknik_geomatika_gis", "perencanaan_wilayah_kota", "teknik_pertambangan", "teknik_pertambangan_terapan", "ilmu_lingkungan", "teknik_lingkungan", "kehutanan", "perikanan", "agroteknologi", "pariwisata", "travel_management"],
    civics: ["hukum", "ilmu_politik", "administrasi_publik", "hubungan_internasional", "kriminologi", "pendidikan_guru_sekolah_dasar"],
    religion: ["bimbingan_konseling", "ilmu_kesejahteraan_sosial", "pendidikan_anak_usia_dini", "pendidikan_guru_sekolah_dasar"],
    anthropology: ["sosiologi", "pariwisata", "hubungan_internasional", "kriminologi", "ilmu_kesejahteraan_sosial", "komunikasi"],
    performing_arts: ["film_televisi", "broadcasting", "event_management", "animasi", "pendidikan_anak_usia_dini"],
    advanced_mathematics: ["matematika_terapan", "statistika", "aktuaria", "data_science", "pendidikan_matematika", "teknik_industri", "informatika", "artificial_intelligence"],
    foreign_language: ["sastra_inggris", "sastra_jepang", "sastra_mandarin", "penerjemahan", "linguistik", "pendidikan_bahasa_inggris", "hubungan_internasional", "pariwisata", "perhotelan"],
  };

  it("appends new subject IDs to the listed majors without reordering", () => {
    for (const [subjectId, majorIds] of Object.entries(appended)) {
      for (const id of majorIds) {
        const ids = majorById(id).relatedSubjects.map((t) => t.id);
        expect(ids, `${id} ${subjectId}`).toContain(subjectId);
      }
    }
    const newIds = new Set(Object.keys(appended));
    for (const major of majors) {
      const ids = major.relatedSubjects.map((t) => t.id);
      const firstNew = ids.findIndex((id) => newIds.has(id));
      if (firstNew >= 0) expect(ids.slice(firstNew).every((id) => newIds.has(id)), major.id).toBe(true);
    }
  });
});
