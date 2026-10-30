import { describe, it, expect } from "vitest";
import {
  matchesSubmissionFilters,
  parseSubmissionFilters,
} from "@/lib/submissions/filters";
import { serializeSubmissionsCsv } from "@/lib/submissions/csv";
import { buildSubmission, techAnswer } from "./fixtures";
describe("admin pathway data", () => {
  it("distinguishes missing and explicitly exploring", () => {
    const old = buildSubmission();
    const exploring = buildSubmission({
      ...techAnswer,
      educationPathway: "exploring",
    });
    expect(
      matchesSubmissionFilters(old, { educationPathway: "unrecorded" }),
    ).toBe(true);
    expect(
      matchesSubmissionFilters(old, { educationPathway: "exploring" }),
    ).toBe(false);
    expect(
      matchesSubmissionFilters(exploring, { educationPathway: "unrecorded" }),
    ).toBe(false);
    expect(
      matchesSubmissionFilters(exploring, { educationPathway: "exploring" }),
    ).toBe(true);
  });
  it("combines existing filters with pathway and rejects unknown query values", () => {
    const row = buildSubmission({
      ...techAnswer,
      educationPathway: "vocational",
    });
    expect(
      matchesSubmissionFilters(row, {
        school: "CONTOH",
        className: "XI",
        educationPathway: "vocational",
        status: "completed",
        dateFrom: "2026-05-23",
        dateTo: "2026-05-23",
      }),
    ).toBe(true);
    expect(
      matchesSubmissionFilters(row, { educationPathway: "university" }),
    ).toBe(false);
    expect(matchesSubmissionFilters(row, { school: "missing" })).toBe(false);
    expect(matchesSubmissionFilters(row, { dateFrom: "2026-05-24" })).toBe(
      false,
    );
    expect(
      parseSubmissionFilters(
        new URLSearchParams("educationPathway=vocational&school=Contoh"),
      ),
    ).toMatchObject({ educationPathway: "vocational", school: "Contoh" });
    expect(() =>
      parseSubmissionFilters(new URLSearchParams("educationPathway=SMK")),
    ).toThrow();
  });
  it("appends columns without losing existing CSV fields or escaping", () => {
    const row = buildSubmission({
      ...techAnswer,
      fullName: 'Nelly, "Siswa"\nBaru',
      educationPathway: "vocational",
    });
    const csv = serializeSubmissionsCsv([row, buildSubmission()]);
    const header = csv.split("\n")[0];
    expect(header).toMatch(
      /^"createdAt","updatedAt","status","fullName","email"/,
    );
    expect(header).toContain(
      '"top10RecommendationsJson","scoringVersion","educationPathway","topDegreeTypes"',
    );
    expect(csv).toContain('"Nelly, ""Siswa""\nBaru"');
    expect(csv).toContain('"vocational","D3; D4"');
    expect(csv).toContain(row.report.topRecommendation.majorName);
  });
});
