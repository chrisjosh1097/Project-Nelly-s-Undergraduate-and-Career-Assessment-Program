import { describe, expect, it } from "vitest";
import { studentAnswerSchema } from "@/lib/validation";
import { formatSchoolMajor } from "@/lib/assessment/schoolMajorDisplay";
import { validateAssessmentStep } from "@/lib/assessment/formState";
import { getAssessmentSteps } from "@/lib/assessment/steps";
import { serializeSubmissionsCsv } from "@/lib/submissions/csv";
import { buildSubmission, techAnswer } from "./fixtures";

describe("school major 'Lainnya' free text", () => {
  it("requires the text only when Lainnya is chosen", () => {
    const missing = studentAnswerSchema.safeParse({ ...techAnswer, currentSchoolMajor: "Lainnya", currentSchoolMajorOther: "" });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues[0]?.message).toBe("Isi jurusan sekolahmu.");
    expect(studentAnswerSchema.safeParse({ ...techAnswer, currentSchoolMajor: "Lainnya", currentSchoolMajorOther: "Keagamaan" }).success).toBe(true);
    expect(studentAnswerSchema.safeParse({ ...techAnswer, currentSchoolMajor: "IPA" }).success).toBe(true);
  });

  it("still validates old answers without the field", () => {
    const legacy = { ...techAnswer } as Record<string, unknown>;
    delete legacy.currentSchoolMajorOther;
    const parsed = studentAnswerSchema.safeParse(legacy);
    expect(parsed.success).toBe(true);
  });

  it("blocks the school major step until the text is filled", () => {
    const step = getAssessmentSteps("university").find((s) => s.key === "currentSchoolMajor")!;
    expect(validateAssessmentStep(step, { ...techAnswer, currentSchoolMajor: "Lainnya", currentSchoolMajorOther: "" })).toBe("Isi jurusan sekolahmu.");
    expect(validateAssessmentStep(step, { ...techAnswer, currentSchoolMajor: "Lainnya", currentSchoolMajorOther: "Pariwisata" })).toBeNull();
  });

  it("formats the display label and falls back for legacy answers", () => {
    expect(formatSchoolMajor({ currentSchoolMajor: "Lainnya", currentSchoolMajorOther: " Keagamaan " })).toBe("Lainnya — Keagamaan");
    expect(formatSchoolMajor({ currentSchoolMajor: "Lainnya" })).toBe("Lainnya");
    expect(formatSchoolMajor({ currentSchoolMajor: "IPA", currentSchoolMajorOther: "x" })).toBe("IPA");
  });

  it("exports the free text in CSV", () => {
    const submission = buildSubmission({ ...techAnswer, currentSchoolMajor: "Lainnya", currentSchoolMajorOther: "Keagamaan" });
    expect(serializeSubmissionsCsv([submission])).toContain("Lainnya — Keagamaan");
  });
});
