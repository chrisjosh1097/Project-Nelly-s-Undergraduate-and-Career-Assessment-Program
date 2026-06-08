import { describe, expect, it } from "vitest";
import { buildSubmissionPdfTextSnapshot, generateSubmissionPdf } from "@/lib/pdf/report";
import { buildSubmission } from "./fixtures";

describe("PDF report generation", () => {
  it("generates a non-empty PDF report", async () => {
    const submission = buildSubmission();
    const bytes = await generateSubmissionPdf(submission);
    const header = Buffer.from(bytes.slice(0, 5)).toString("utf8");
    const snapshot = buildSubmissionPdfTextSnapshot(submission);

    expect(header).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(1500);
    expect(snapshot).toContain(submission.report.topRecommendation.majorName);
    expect(snapshot).toContain("KARIR YANG SESUAI");
    expect(snapshot).not.toContain("3 karier niche");
    expect(snapshot).toContain("hanya analisis berdasarkan jawaban");
  });
});
