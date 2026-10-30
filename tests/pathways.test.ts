import { describe, it, expect } from "vitest";
import { studentAnswerSchema } from "@/lib/validation";
import { normalizeStudentAnswer } from "@/lib/assessment/normalization";
import { educationPathwayLabel, eligibleDegreeTypes } from "@/lib/assessment/pathways";
import { techAnswer } from "./fixtures";

describe("education pathway compatibility", () => {
  it.each(["university", "vocational", "exploring"] as const)("preserves explicit %s", (educationPathway) => {
    const parsed = studentAnswerSchema.parse({ ...techAnswer, educationPathway });
    expect(parsed.educationPathway).toBe(educationPathway);
    expect(normalizeStudentAnswer(parsed).educationPathway).toBe(educationPathway);
  });
  it.each(["SMA", "", null])("rejects invalid direction %s", (educationPathway) => {
    expect(studentAnswerSchema.safeParse({ ...techAnswer, educationPathway }).success).toBe(false);
  });
  it("does not infer a legacy preference or write undefined", () => {
    const parsed = studentAnswerSchema.parse({ ...techAnswer, currentSchoolMajor: "SMK Teknik", collegePathPreferences: ["Diploma/vokasi"] });
    expect(parsed).not.toHaveProperty("educationPathway");
    expect(normalizeStudentAnswer(parsed)).not.toHaveProperty("educationPathway");
    expect(educationPathwayLabel()).toBe("Belum tercatat");
    expect(educationPathwayLabel("exploring")).not.toBe("Belum tercatat");
  });
  it("shows only supported degrees for the chosen route", () => {
    const degrees = ["S1", "D3", "D4", "Sertifikasi"];
    expect(eligibleDegreeTypes(degrees, "university")).toEqual(["S1"]);
    expect(eligibleDegreeTypes(degrees, "vocational")).toEqual(["D3", "D4"]);
    expect(eligibleDegreeTypes(degrees, "exploring")).toEqual(degrees);
    expect(eligibleDegreeTypes(degrees)).toEqual(degrees);
  });
});
