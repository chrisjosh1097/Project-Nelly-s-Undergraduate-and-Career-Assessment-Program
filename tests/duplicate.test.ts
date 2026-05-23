import { describe, expect, it } from "vitest";
import { decideSubmissionAction } from "@/lib/submissions/duplicate";
import { buildSubmission } from "./fixtures";

describe("one email one submission guard", () => {
  it("allows creation when no submission exists", () => {
    expect(decideSubmissionAction(null)).toEqual({ action: "create" });
  });

  it("returns the existing completed submission instead of regenerating", () => {
    const existing = buildSubmission();
    const decision = decideSubmissionAction(existing);

    expect(decision.action).toBe("return-existing");
    if (decision.action !== "return-existing") throw new Error("Expected existing submission decision.");
    expect(decision.submission.report.topRecommendation.majorId).toBe(existing.report.topRecommendation.majorId);
  });

  it("keeps processing submissions from being submitted again", () => {
    const existing = { ...buildSubmission(), status: "processing" as const };
    const decision = decideSubmissionAction(existing);

    expect(decision.action).toBe("processing");
  });
});
