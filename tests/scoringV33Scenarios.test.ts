import { describe, expect, it } from "vitest";
import { majors } from "../data";
import { generateRecommendations, scoreMajor } from "@/lib/recommendation";
import { OFFICIAL_SERVICE_NOTE } from "@/lib/recommendation/aspirationAliases";
import type { StudentAnswer } from "@/lib/types";
import { techAnswer } from "./fixtures";

// Synthetic personas modelled on the patterns teachers reported (no real student data).
const persona = (patch: Partial<StudentAnswer>): StudentAnswer => ({
  ...techAnswer,
  fullName: "Siswa Sintetis",
  email: "sintetis@example.test",
  educationPathway: "exploring",
  favoriteSubjectsOther: "",
  futureVision: "",
  ...patch,
});
const report = (a: StudentAnswer) => generateRecommendations(a);
const top = (a: StudentAnswer) => report(a).recommendations.map((r) => r.majorId);
const major = (id: string) => majors.find((m) => m.id === id)!;
const subjectScore = (a: StudentAnswer, id: string) => scoreMajor(a, major(id)).scoringBreakdown.subjectScore;

const creative = {
  favoriteActivities: ["Membuat desain/konten", "Menulis/berbicara"],
  skillStrengths: ["Kreativitas", "Komunikasi", "Public speaking"],
  workStyle: "Kreatif dan fleksibel" as const,
  problemAreas: ["Seni Berekspresi, Bahasa, dan Estetika"],
};

describe("v3.3.0 scenarios from the reported mismatch patterns", () => {
  it("case A: a creative profile that names arsitektur gets it in the top 10 with the badge", () => {
    const a = persona({ ...creative, favoriteSubjects: ["Fisika", "Bahasa", "Seni/Desain"], dreamProfession: "Arsitektur dan seni desain" });
    const recs = report(a).recommendations;
    expect(recs.find((r) => r.majorId === "arsitektur")?.aspirationMatch).toBe(true);
  });

  it("case B: naming teknik komputer guarantees it even when the profile points elsewhere", () => {
    const a = persona({ ...creative, favoriteSubjects: ["Sejarah", "Matematika", "Komputer/TIK"], dreamProfession: "penasaran dengan teknik komputer" });
    expect(report(a).recommendations.find((r) => r.majorId === "teknik_komputer")?.aspirationMatch).toBe(true);
  });

  it("case C: naming two majors protects both (statistika and sains data)", () => {
    const a = persona({ favoriteSubjects: ["Matematika", "Fisika", "Kimia"], dreamProfession: "kerja di bps, jurusan statistika dan sains data" });
    const prot = report(a).recommendations.filter((r) => r.aspirationMatch).map((r) => r.majorId).sort();
    expect(prot).toEqual(["data_science", "statistika"]);
  });

  it("case D: Lainnya 'matematika tingkat lanjut' raises math-major subject scores", () => {
    const base = persona({ educationPathway: "university", favoriteSubjects: ["Lainnya", "Olahraga", "Kimia"], favoriteSubjectsOther: "tidak tahu", dreamProfession: "" });
    const typed = { ...base, favoriteSubjectsOther: "matematika tingkat lanjut" };
    for (const id of ["pendidikan_matematika", "statistika"]) expect(subjectScore(typed, id), id).toBeGreaterThan(subjectScore(base, id));
  });

  it("case E: Lainnya 'geografi' lifts geography majors above the 18-point no-match floor", () => {
    const a = persona({ favoriteSubjects: ["Ekonomi", "Lainnya"], favoriteSubjectsOther: "geografi", dreamProfession: "" });
    const noText = { ...a, favoriteSubjects: ["Ekonomi"], favoriteSubjectsOther: "" };
    for (const id of ["teknik_geologi", "teknik_geomatika_gis", "perencanaan_wilayah_kota"]) {
      expect(subjectScore(noText, id), id).toBe(18);
      expect(subjectScore(a, id), id).toBeGreaterThan(18);
    }
  });

  it("case E': the explicit Geografi checkbox scores like the recognized text", () => {
    const text = persona({ favoriteSubjects: ["Ekonomi", "Lainnya"], favoriteSubjectsOther: "geografi", dreamProfession: "" });
    const box = { ...text, favoriteSubjects: ["Ekonomi", "Geografi"], favoriteSubjectsOther: "" };
    expect(subjectScore(box, "teknik_geologi")).toBe(subjectScore(text, "teknik_geologi"));
  });

  it("case F: a TNI AU dream adds the official-service note without changing the top 10", () => {
    const a = persona({ dreamProfession: "TNI AU" });
    const r = report(a);
    expect(r.answerPatternNotes).toContain(OFFICIAL_SERVICE_NOTE);
    expect(r.recommendations.map((x) => x.majorId)).toEqual(top({ ...a, dreamProfession: "" }));
    expect(r.recommendations.some((x) => x.aspirationMatch)).toBe(false);
  });

  it("case G: a business profile naming manajemen keeps its top 3", () => {
    const a = persona({
      favoriteSubjects: ["Ekonomi", "Sosiologi"],
      favoriteActivities: ["Berjualan/bisnis", "Mengorganisir acara"],
      skillStrengths: ["Leadership", "Komunikasi"],
      workStyle: "Banyak bertemu orang",
      problemAreas: ["Manajemen dan Transparansi"],
      dreamProfession: "manajemen",
    });
    // The existing soft boost may reorder within the top 3, but its membership is unchanged.
    expect(top(a).slice(0, 3).sort()).toEqual(top({ ...a, dreamProfession: "" }).slice(0, 3).sort());
    expect(report(a).recommendations.find((r) => r.majorId === "manajemen")?.aspirationMatch).toBe(true);
  });
});

describe("v3.3.0 new personas", () => {
  it("PPKn + Sejarah + Agama student leans to law/social majors", () => {
    const a = persona({
      favoriteSubjects: ["Pendidikan Pancasila (PPKn)", "Sejarah", "Pendidikan Agama dan Budi Pekerti"],
      favoriteActivities: ["Menulis/berbicara", "Membantu orang"],
      skillStrengths: ["Komunikasi", "Empati"],
      workStyle: "Banyak bertemu orang",
      problemAreas: ["Perdamaian, Keadilan, dan Kelembagaan yang Tangguh"],
      dreamProfession: "",
    });
    const ids = top(a);
    expect(ids.some((id) => ["hukum", "ilmu_politik", "administrasi_publik", "kriminologi", "hubungan_internasional"].includes(id))).toBe(true);
  });

  it("Seni Musik / Tari student gets performing-arts subject credit", () => {
    const a = persona({ favoriteSubjects: ["Seni Musik", "Seni Tari/Teater"], dreamProfession: "" });
    expect(subjectScore(a, "film_televisi")).toBeGreaterThan(18);
    expect(subjectScore(a, "event_management")).toBeGreaterThan(18);
  });

  it("Bahasa Inggris + Bahasa Asing Lain student scores at least the legacy Bahasa on language majors", () => {
    const legacy = persona({ favoriteSubjects: ["Bahasa"], dreamProfession: "" });
    const specific = persona({ favoriteSubjects: ["Bahasa Inggris", "Bahasa Asing Lain (Jepang, Mandarin, Arab, Jerman, Korea, dll.)"], dreamProfession: "" });
    for (const id of ["sastra_inggris", "sastra_jepang", "penerjemahan"]) expect(subjectScore(specific, id), id).toBeGreaterThanOrEqual(subjectScore(legacy, id));
  });

  it("vocational student naming dokter gets no ineligible kedokteran", () => {
    const a = persona({ educationPathway: "vocational", dreamProfession: "dokter" });
    expect(top(a)).not.toContain("kedokteran");
    expect(report(a).recommendations).toHaveLength(10);
  });

  it("negated dream does not protect the negated major", () => {
    const a = persona({ ...creative, favoriteSubjects: ["Seni/Desain", "Bahasa"], dreamProfession: "bukan dokter, tapi arsitek" });
    const prot = report(a).recommendations.filter((r) => r.aspirationMatch).map((r) => r.majorId);
    expect(prot).toEqual(["arsitektur"]);
  });

  it("every scenario still yields exactly 10 ranked, score-sorted results", () => {
    for (const dream of ["", "arsitek, dokter gigi, hakim, statistika", "TNI AU", "pengusaha"]) {
      const recs = report(persona({ dreamProfession: dream })).recommendations;
      expect(recs.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      for (let i = 1; i < 10; i++) expect(recs[i - 1].overallFitScore).toBeGreaterThanOrEqual(recs[i].overallFitScore);
    }
  });
});
