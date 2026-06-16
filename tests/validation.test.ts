import { describe, expect, it } from "vitest";
import { studentAnswerSchema } from "@/lib/validation";
import { techAnswer } from "./fixtures";

describe("student answer validation", () => {
  it("allows optional aspiration fields to stay empty", () => {
    const parsed = studentAnswerSchema.safeParse({
      ...techAnswer,
      dreamProfession: "",
      futureVision: ""
    });

    expect(parsed.success).toBe(true);
  });

  it("requires meaningful length when optional free-text fields are filled", () => {
    const parsed = studentAnswerSchema.safeParse({
      ...techAnswer,
      dreamProfession: "AI",
      futureVision: "singkat"
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.errors.map((error) => error.message).join(" ")).toContain("minimal");
  });

  it("requires enough detail for selected Lainnya fields", () => {
    const parsed = studentAnswerSchema.safeParse({
      ...techAnswer,
      favoriteSubjects: ["Matematika", "Fisika", "Lainnya"],
      favoriteSubjectsOther: "A",
      collegePathPreferences: [...techAnswer.collegePathPreferences, "Lainnya"],
      collegePathPreferenceOther: "PT"
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.errors.map((error) => error.message).join(" ")).toContain("minimal");
  });

  it("limits favorite subjects to a maximum of 3 choices", () => {
    const parsed = studentAnswerSchema.safeParse({
      ...techAnswer,
      favoriteSubjects: ["Matematika", "Komputer/TIK", "Fisika", "Kimia"]
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.errors.map((error) => error.message).join(" ")).toContain("maksimal 3");
  });

  it("limits favorite activities to a maximum of 3 choices", () => {
    const parsed = studentAnswerSchema.safeParse({
      ...techAnswer,
      favoriteActivities: ["Coding/teknologi", "Menghitung/analisis data", "Eksperimen/lab", "Kerja lapangan"]
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.errors.map((error) => error.message).join(" ")).toContain("maksimal 3");
  });

  it("does not limit other multi-select fields to 3 choices", () => {
    const parsed = studentAnswerSchema.safeParse({
      ...techAnswer,
      skillStrengths: ["Logika", "Problem solving", "Teknologi", "Numerik/hitung-hitungan", "Ketelitian"],
      problemAreas: ["Teknologi", "Bisnis", "Lingkungan", "Infrastruktur"],
      personalConstraints: ["Ingin cepat kerja", "Biaya", "Ingin beasiswa", "Persaingan masuk"]
    });

    expect(parsed.success).toBe(true);
  });
});
