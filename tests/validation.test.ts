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
      favoriteSubjects: [...techAnswer.favoriteSubjects, "Lainnya"],
      favoriteSubjectsOther: "A",
      collegePathPreferences: [...techAnswer.collegePathPreferences, "Lainnya"],
      collegePathPreferenceOther: "PT"
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.errors.map((error) => error.message).join(" ")).toContain("minimal");
  });
});
