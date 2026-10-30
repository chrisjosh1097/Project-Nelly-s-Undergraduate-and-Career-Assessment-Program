import { describe, expect, it } from "vitest";
import {
  buildSubmissionPdfTextSnapshot,
  generateSubmissionPdf,
} from "@/lib/pdf/report";
import { buildSubmission, techAnswer } from "./fixtures";

describe("PDF report generation", () => {
  it.each(["vocational", "university"] as const)(
    "records %s direction and all ten programs",
    async (educationPathway) => {
      const submission = buildSubmission({ ...techAnswer, educationPathway });
      const text = buildSubmissionPdfTextSnapshot(submission);
      expect(text).toContain(
        educationPathway === "vocational"
          ? "Vokasi / Terapan"
          : "Universitas / Akademik",
      );
      expect(text).toContain(educationPathway === "vocational" ? "D3" : "S1");
      for (const result of submission.report.recommendations)
        expect(text).toContain(result.majorName);
      expect((await generateSubmissionPdf(submission)).length).toBeGreaterThan(
        1500,
      );
    },
  );
  it("does not infer a legacy direction and safely paginates long content", async () => {
    const submission = buildSubmission();
    delete submission.answers.educationPathway;
    submission.answers.futureVision = "eksplorasi ".repeat(1800);
    submission.report.topRecommendation.majorName = "A".repeat(800);
    expect(buildSubmissionPdfTextSnapshot(submission)).toContain(
      "Belum tercatat",
    );
    const bytes = await generateSubmissionPdf(submission);
    expect(bytes.byteLength).toBeGreaterThan(10000);
  });
  it("generates a non-empty PDF report", async () => {
    const submission = buildSubmission();
    const bytes = await generateSubmissionPdf(submission);
    const header = Buffer.from(bytes.slice(0, 5)).toString("utf8");
    const snapshot = buildSubmissionPdfTextSnapshot(submission);

    expect(header).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(1500);
    expect(snapshot).toContain(submission.report.topRecommendation.majorName);
    expect(snapshot).toContain("KARIR YANG SESUAI");
    expect(snapshot).toContain("Kelebihan kamu");
    expect(snapshot).not.toContain("3 karier niche");
    expect(snapshot).toContain("hanya analisis berdasarkan jawaban");
  });
});
