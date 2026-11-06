import { describe, it, expect } from "vitest";
import { getAssessmentSteps } from "@/lib/assessment/steps";
import {
  emptyAnswer,
  validateAssessmentStep,
  assessmentProgress,
  assessmentReviewWarnings,
} from "@/lib/assessment/formState";
import { techAnswer } from "./fixtures";
describe("contextual assessment flow", () => {
  it("routes after school and ends with a review", () => {
    const steps = getAssessmentSteps();
    expect(
      steps[steps.findIndex((s) => s.key === "currentSchoolMajor") + 1].key,
    ).toBe("educationPathway");
    expect(steps.at(-1)?.type).toBe("review");
    expect(new Set(steps.map((s) => s.section)).size).toBe(5);
  });
  it("preserves canonical options while tailoring guidance", () => {
    const a = getAssessmentSteps("university"),
      b = getAssessmentSteps("vocational");
    expect(a.map((s) => s.options)).toEqual(b.map((s) => s.options));
    expect(a.find((s) => s.key === "favoriteActivities")?.guidance).not.toBe(
      b.find((s) => s.key === "favoriteActivities")?.guidance,
    );
  });
  it("requires explicit direction and validates companion/optional fields", () => {
    const steps = getAssessmentSteps();
    const step = (key: string) => steps.find((s) => s.key === key)!;
    expect(emptyAnswer()).not.toHaveProperty("educationPathway");
    expect(
      validateAssessmentStep(step("educationPathway"), techAnswer),
    ).toBeTruthy();
    expect(
      validateAssessmentStep(step("favoriteSubjects"), {
        ...techAnswer,
        favoriteSubjects: ["Lainnya"],
        favoriteSubjectsOther: "",
      }),
    ).toBeTruthy();
    expect(
      validateAssessmentStep(step("favoriteActivities"), {
        ...techAnswer,
        favoriteActivities: [
          "Coding/teknologi",
          "Menulis/berbicara",
          "Kerja lapangan",
          "Membantu orang",
        ],
      }),
    ).toBeTruthy();
    expect(
      validateAssessmentStep(step("dreamProfession"), {
        ...techAnswer,
        dreamProfession: "x",
      }),
    ).toBeTruthy();
    expect(
      validateAssessmentStep(step("dreamProfession"), {
        ...techAnswer,
        dreamProfession: "",
      }),
    ).toBeNull();
    expect(
      validateAssessmentStep(step("review"), {
        ...techAnswer,
        educationPathway: "university",
      }),
    ).toBeNull();
  });
  it("keeps progress below complete and warns without changing conflicting answers", () => {
    expect(assessmentProgress(17, 18)).toBeLessThan(100);
    const input = {
      ...techAnswer,
      educationPathway: "university" as const,
      collegePathPreferences: ["Diploma/vokasi"],
    };
    expect(assessmentReviewWarnings(input).length).toBeGreaterThan(0);
    expect(input.collegePathPreferences).toEqual(["Diploma/vokasi"]);
  });
});
