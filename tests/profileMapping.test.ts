import { describe, expect, it } from "vitest";
import { generateRecommendations } from "@/lib/recommendation";
import type { StudentAnswer } from "@/lib/types";
import { majors } from "../data";

const majorById = new Map(majors.map((major) => [major.id, major]));

function answer(overrides: Partial<StudentAnswer>): StudentAnswer {
  return {
    fullName: "Siswa Audit",
    email: "audit@example.com",
    gender: "Pria",
    age: "16",
    school: "Sekolah Audit",
    className: "XI",
    currentSchoolMajor: "IPA",
    favoriteSubjects: ["Matematika"],
    favoriteSubjectsOther: "",
    favoriteActivities: ["Menghitung/analisis data"],
    skillStrengths: ["Problem solving"],
    workStyle: "Banyak analisis sendiri",
    problemAreas: ["Teknologi"],
    collegePathPreferences: ["Belum tahu"],
    collegePathPreferenceOther: "",
    personalConstraints: ["Takut salah jurusan"],
    techComfort: "Biasa saja",
    dreamProfession: "",
    futureVision: "",
    ...overrides
  };
}

function topIdsFor(profile: StudentAnswer, take = 10) {
  return generateRecommendations(profile).recommendations.slice(0, take).map((recommendation) => recommendation.majorId);
}

function topClusterFor(profile: StudentAnswer) {
  const report = generateRecommendations(profile);
  return majorById.get(report.topRecommendation.majorId)?.cluster;
}

describe("student profile mapping audit", () => {
  it("maps SMA IPA coding, math, and AI comfort to broad technology majors", () => {
    const profile = answer({
      currentSchoolMajor: "IPA",
      favoriteSubjects: ["Matematika", "Komputer/TIK", "Fisika"],
      favoriteActivities: ["Coding/teknologi", "Menghitung/analisis data"],
      skillStrengths: ["Logika", "Problem solving", "Teknologi", "Numerik/hitung-hitungan"],
      workStyle: "Banyak analisis sendiri",
      problemAreas: ["Teknologi", "Bisnis"],
      collegePathPreferences: ["Sertifikasi/bootcamp"],
      personalConstraints: ["Ingin cepat kerja"],
      techComfort: "Sangat nyaman"
    });

    const topIds = topIdsFor(profile);
    expect(topClusterFor(profile)).toBe("Technology & Data");
    expect(topIds).toEqual(expect.arrayContaining(["informatika", "sistem_informasi", "data_science", "software_engineering"]));
  });

  it("maps SMA IPA health, lab, and cost constraints to practical health options", () => {
    const profile = answer({
      currentSchoolMajor: "IPA",
      favoriteSubjects: ["Biologi", "Kimia", "Bahasa"],
      favoriteActivities: ["Membantu orang", "Eksperimen/lab"],
      skillStrengths: ["Empati", "Ketelitian", "Problem solving", "Komunikasi"],
      workStyle: "Banyak bertemu orang",
      problemAreas: ["Kesehatan", "Sosial"],
      collegePathPreferences: ["Kuliah dekat rumah"],
      personalConstraints: ["Biaya", "Ingin beasiswa"]
    });

    const topIds = topIdsFor(profile);
    expect(["Health & Life Sciences", "Social, Psychology & Education"]).toContain(topClusterFor(profile));
    expect(topIds).toEqual(expect.arrayContaining(["keperawatan", "kesehatan_masyarakat", "gizi"]));
  });

  it("maps SMA IPS selling, leadership, and unsure interest to flexible business majors", () => {
    const profile = answer({
      currentSchoolMajor: "IPS",
      favoriteSubjects: ["Ekonomi", "Bahasa", "Matematika"],
      favoriteActivities: ["Berjualan/bisnis", "Mengorganisir acara", "Menulis/berbicara"],
      skillStrengths: ["Leadership", "Komunikasi", "Public speaking", "Problem solving"],
      workStyle: "Banyak bertemu orang",
      problemAreas: ["Bisnis", "Keuangan"],
      personalConstraints: ["Belum tahu minat"]
    });

    const topIds = topIdsFor(profile);
    expect(topClusterFor(profile)).toBe("Business & Management");
    expect(topIds).toEqual(expect.arrayContaining(["manajemen", "bisnis_digital", "marketing"]));
  });

  it("maps SMA IPS debate, law, and public service to law and governance majors", () => {
    const profile = answer({
      currentSchoolMajor: "IPS",
      favoriteSubjects: ["Sosiologi", "Sejarah", "Bahasa"],
      favoriteActivities: ["Menulis/berbicara", "Mengorganisir acara", "Membantu orang"],
      skillStrengths: ["Public speaking", "Komunikasi", "Problem solving", "Leadership"],
      workStyle: "Banyak bertemu orang",
      problemAreas: ["Hukum", "Sosial", "Pendidikan"],
      collegePathPreferences: ["PTN di Jawa"],
      personalConstraints: ["Persaingan masuk"]
    });

    const topIds = topIdsFor(profile);
    expect(["Law, Governance & International", "Social, Psychology & Education"]).toContain(topClusterFor(profile));
    expect(topIds).toEqual(expect.arrayContaining(["hukum", "administrasi_publik", "ilmu_politik"]));
  });

  it("maps SMK Teknik machines, physics, and fast employment to engineering and applied technical paths", () => {
    const profile = answer({
      currentSchoolMajor: "SMK Teknik",
      favoriteSubjects: ["Fisika", "Matematika", "Komputer/TIK"],
      favoriteActivities: ["Memperbaiki barang/mesin", "Kerja lapangan", "Eksperimen/lab"],
      skillStrengths: ["Kerja praktik", "Problem solving", "Logika", "Teknologi"],
      workStyle: "Praktik langsung",
      problemAreas: ["Infrastruktur", "Teknologi"],
      collegePathPreferences: ["Diploma/vokasi", "Sertifikasi/bootcamp"],
      personalConstraints: ["Ingin cepat kerja"]
    });

    const topIds = topIdsFor(profile);
    expect(["Engineering & Infrastructure", "Vocational & Applied Skills"]).toContain(topClusterFor(profile));
    expect(topIds).toEqual(expect.arrayContaining(["teknik_mesin", "teknik_elektro", "teknik_industri"]));
    expect(topIds.some((id) => ["vokasi_teknik", "teknik_otomotif", "industrial_automation_applied"].includes(id))).toBe(true);
  });

  it("maps SMK Kreatif design and content to creative plus applied digital design paths", () => {
    const profile = answer({
      currentSchoolMajor: "SMK Kreatif/Multimedia",
      favoriteSubjects: ["Seni/Desain", "Komputer/TIK", "Bahasa"],
      favoriteActivities: ["Membuat desain/konten", "Menulis/berbicara"],
      skillStrengths: ["Kreativitas", "Komunikasi", "Teknologi"],
      workStyle: "Kreatif dan fleksibel",
      problemAreas: ["Kreatif/media", "Bisnis"],
      collegePathPreferences: ["Diploma/vokasi", "Sertifikasi/bootcamp"],
      personalConstraints: ["Ingin cepat kerja"]
    });

    const topIds = topIdsFor(profile);
    expect(topClusterFor(profile)).toBe("Creative & Media");
    expect(topIds).toEqual(expect.arrayContaining(["desain_komunikasi_visual", "animasi", "multimedia"]));
    expect(topIds.some((id) => ["uiux_design_applied", "digital_marketing_applied", "web_development_applied"].includes(id))).toBe(true);
  });

  it("maps SMK Bisnis fast employment to applied business, admin, and digital marketing paths", () => {
    const profile = answer({
      currentSchoolMajor: "SMK Bisnis",
      favoriteSubjects: ["Ekonomi", "Komputer/TIK", "Matematika"],
      favoriteActivities: ["Berjualan/bisnis", "Mengorganisir acara", "Menghitung/analisis data"],
      skillStrengths: ["Ketelitian", "Komunikasi", "Leadership", "Numerik/hitung-hitungan"],
      workStyle: "Terstruktur dan detail",
      problemAreas: ["Bisnis", "Keuangan"],
      collegePathPreferences: ["Diploma/vokasi", "Kuliah dekat rumah"],
      personalConstraints: ["Ingin cepat kerja", "Biaya"]
    });

    const topIds = topIdsFor(profile);
    expect(["Business & Management", "Finance & Accounting", "Vocational & Applied Skills"]).toContain(topClusterFor(profile));
    expect(topIds).toEqual(expect.arrayContaining(["akuntansi", "administrasi_bisnis"]));
    expect(topIds.some((id) => ["akuntansi_terapan", "administrasi_perkantoran", "digital_marketing_applied"].includes(id))).toBe(true);
  });

  it("maps Bahasa students with foreign language and writing to language, communication, and international paths", () => {
    const profile = answer({
      currentSchoolMajor: "Bahasa",
      favoriteSubjects: ["Bahasa", "Sejarah", "Sosiologi"],
      favoriteActivities: ["Menulis/berbicara", "Membantu orang", "Mengorganisir acara"],
      skillStrengths: ["Bahasa asing", "Komunikasi", "Public speaking", "Kreativitas"],
      workStyle: "Banyak bertemu orang",
      problemAreas: ["Pendidikan", "Sosial", "Hukum"],
      collegePathPreferences: ["PTN di Jawa"],
      personalConstraints: ["Takut salah jurusan"]
    });

    const topIds = topIdsFor(profile);
    expect(["Language & Culture", "Creative & Media", "Law, Governance & International", "Social, Psychology & Education"]).toContain(
      topClusterFor(profile)
    );
    expect(topIds).toEqual(expect.arrayContaining(["sastra_inggris", "penerjemahan", "komunikasi"]));
  });
});
