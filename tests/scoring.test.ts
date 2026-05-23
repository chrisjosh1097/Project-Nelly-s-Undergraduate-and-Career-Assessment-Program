import { describe, expect, it } from "vitest";
import {
  calculateAIFutureResilienceScore,
  calculateOverallFitScore,
  calculateScoringBreakdown,
  generateRecommendations,
  getAIFutureResilienceLabel
} from "@/lib/recommendation";
import { aiResilienceProfilesById, majors } from "../data";
import type { StudentAnswer } from "@/lib/types";
import { techAnswer } from "./fixtures";

function answer(overrides: Partial<StudentAnswer>): StudentAnswer {
  return {
    fullName: "Siswa Contoh",
    email: "siswa@example.com",
    gender: "Pria",
    age: "16",
    school: "SMAN 1 Contoh",
    className: "XI",
    currentSchoolMajor: "IPA",
    favoriteSubjects: ["Matematika"],
    favoriteActivities: ["Menghitung/analisis data"],
    skillStrengths: ["Problem solving"],
    workStyle: "Banyak analisis sendiri",
    problemAreas: ["Teknologi"],
    collegePathPreferences: ["Belum tahu"],
    personalConstraints: ["Takut salah jurusan"],
    techComfort: "Biasa saja",
    dreamProfession: "",
    futureVision: "",
    ...overrides
  };
}

describe("heuristic scoring engine", () => {
  it("uses the documented weighted overall score formula", () => {
    const major = majors.find((item) => item.id === "informatika");
    expect(major).toBeDefined();

    const breakdown = calculateScoringBreakdown(techAnswer, major!);
    const score = calculateOverallFitScore(breakdown);
    const manual = Math.round(
      breakdown.interestScore * 0.3 +
        breakdown.skillScore * 0.25 +
        breakdown.subjectScore * 0.15 +
        breakdown.workStyleScore * 0.1 +
        breakdown.problemAreaScore * 0.1 +
        breakdown.constraintFitScore * 0.1
    );

    expect(score).toBe(manual);
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it("generates exactly 10 unique ranked recommendations", () => {
    const report = generateRecommendations(techAnswer);
    const ids = report.recommendations.map((recommendation) => recommendation.majorId);

    expect(report.recommendations).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    expect(report.topRecommendation.rank).toBe(1);
    expect(report.recommendations.map((recommendation) => recommendation.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(report.recommendations.every((recommendation) => recommendation.majorId && recommendation.careerDirection)).toBe(true);
  });

  it("matches coding + math + logic + AI comfort to Technology & Data", () => {
    const report = generateRecommendations(
      answer({
        favoriteSubjects: ["Matematika", "Komputer/TIK", "Fisika"],
        favoriteActivities: ["Coding/teknologi", "Menghitung/analisis data"],
        skillStrengths: ["Logika", "Problem solving", "Teknologi", "Numerik/hitung-hitungan"],
        problemAreas: ["Teknologi", "Bisnis"],
        techComfort: "Sangat nyaman"
      })
    );
    const topIds = report.recommendations.slice(0, 5).map((recommendation) => recommendation.majorId);
    const topMajor = majors.find((major) => major.id === report.topRecommendation.majorId);

    expect(topMajor?.cluster).toBe("Technology & Data");
    expect(topIds).toEqual(expect.arrayContaining(["informatika", "data_science", "sistem_informasi"]));
  });

  it("matches helping people + empathy + biology to health/social recommendations", () => {
    const report = generateRecommendations(
      answer({
        favoriteSubjects: ["Biologi", "Bahasa", "Sosiologi"],
        favoriteActivities: ["Membantu orang", "Eksperimen/lab"],
        skillStrengths: ["Empati", "Komunikasi", "Problem solving"],
        workStyle: "Banyak bertemu orang",
        problemAreas: ["Kesehatan", "Sosial", "Pendidikan"],
        personalConstraints: ["Biaya"]
      })
    );
    const topIds = report.recommendations.slice(0, 7).map((recommendation) => recommendation.majorId);
    const topMajor = majors.find((major) => major.id === report.topRecommendation.majorId);

    expect(["Health & Life Sciences", "Social, Psychology & Education"]).toContain(topMajor?.cluster);
    expect(topIds).toEqual(expect.arrayContaining(["psikologi", "keperawatan", "kesehatan_masyarakat"]));
  });

  it("matches design + creativity + content to Creative & Media", () => {
    const report = generateRecommendations(
      answer({
        currentSchoolMajor: "SMK Kreatif/Multimedia",
        favoriteSubjects: ["Seni/Desain", "Komputer/TIK", "Bahasa"],
        favoriteActivities: ["Membuat desain/konten", "Menulis/berbicara"],
        skillStrengths: ["Kreativitas", "Komunikasi", "Teknologi"],
        workStyle: "Kreatif dan fleksibel",
        problemAreas: ["Kreatif/media", "Bisnis"],
        collegePathPreferences: ["PTS bagus di kota besar"]
      })
    );
    const topIds = report.recommendations.map((recommendation) => recommendation.majorId);
    const topMajor = majors.find((major) => major.id === report.topRecommendation.majorId);

    expect(topMajor?.cluster).toBe("Creative & Media");
    expect(topIds).toEqual(expect.arrayContaining(["desain_komunikasi_visual", "animasi", "komunikasi"]));
  });

  it("matches business + selling + leadership to Business & Management", () => {
    const report = generateRecommendations(
      answer({
        currentSchoolMajor: "IPS",
        favoriteSubjects: ["Ekonomi", "Bahasa", "Matematika"],
        favoriteActivities: ["Berjualan/bisnis", "Mengorganisir acara", "Menulis/berbicara"],
        skillStrengths: ["Leadership", "Komunikasi", "Problem solving", "Public speaking"],
        workStyle: "Banyak bertemu orang",
        problemAreas: ["Bisnis", "Keuangan"],
        personalConstraints: ["Belum tahu minat"]
      })
    );
    const topIds = report.recommendations.map((recommendation) => recommendation.majorId);
    const topMajor = majors.find((major) => major.id === report.topRecommendation.majorId);

    expect(topMajor?.cluster).toBe("Business & Management");
    expect(topIds).toEqual(expect.arrayContaining(["manajemen", "bisnis_digital", "marketing"]));
  });

  it("matches machines + physics + practical work to Engineering & Infrastructure", () => {
    const report = generateRecommendations(
      answer({
        currentSchoolMajor: "SMK Teknik",
        favoriteSubjects: ["Fisika", "Matematika", "Komputer/TIK"],
        favoriteActivities: ["Memperbaiki barang/mesin", "Kerja lapangan", "Eksperimen/lab"],
        skillStrengths: ["Kerja praktik", "Problem solving", "Logika"],
        workStyle: "Praktik langsung",
        problemAreas: ["Infrastruktur", "Teknologi"],
        personalConstraints: ["Ingin cepat kerja"]
      })
    );
    const topIds = report.recommendations.slice(0, 8).map((recommendation) => recommendation.majorId);
    const topMajor = majors.find((major) => major.id === report.topRecommendation.majorId);

    expect(["Engineering & Infrastructure", "Vocational & Applied Skills"]).toContain(topMajor?.cluster);
    expect(topIds).toEqual(expect.arrayContaining(["teknik_mesin", "teknik_elektro", "teknik_industri"]));
  });

  it("calculates AI Future Resilience Score and label from transparent components", () => {
    const profile = aiResilienceProfilesById.clinical_health;
    const score = calculateAIFutureResilienceScore(profile);

    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isNaN(score)).toBe(false);
    expect(getAIFutureResilienceLabel(score)).toBe("Tinggi");
    expect(getAIFutureResilienceLabel(79)).toBe("Sedang");
    expect(getAIFutureResilienceLabel(59)).toBe("Perlu Adaptasi Tinggi");
  });
});
