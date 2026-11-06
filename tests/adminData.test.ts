import { describe, it, expect } from "vitest";
import {
  matchesSubmissionFilters,
  parseSubmissionFilters,
} from "@/lib/submissions/filters";
import { serializeSubmissionsCsv } from "@/lib/submissions/csv";
import { buildSubmission, techAnswer } from "./fixtures";
describe("admin pathway data", () => {
  it("exports processing records whose reports are not available yet", () => {
    const row = buildSubmission({
      ...techAnswer,
      fullName: "Synthetic Pending Student",
      email: "pending@example.test",
    });
    row.status = "processing";
    Reflect.deleteProperty(row, "report");
    expect(serializeSubmissionsCsv([row])).toContain(
      '"processing","Synthetic Pending Student","pending@example.test"',
    );
  });
  it("parses general search and ANDs it with every existing filter", () => {
    const row = buildSubmission({
      ...techAnswer,
      fullName: "Synthetic Archive Student",
      email: "archive@example.test",
      educationPathway: "vocational",
    });
    const filters = {
      search: "ARCHIVE",
      school: "Contoh",
      className: "XI",
      status: "completed",
      educationPathway: "vocational" as const,
      dateFrom: "2026-05-23",
      dateTo: "2026-05-23",
      topRecommendation: row.report.topRecommendation.majorName,
      cluster: row.report.topRecommendation.cluster,
    };
    expect(
      parseSubmissionFilters(new URLSearchParams("search=%20ARCHIVE%20")),
    ).toEqual({ search: "ARCHIVE" });
    expect(matchesSubmissionFilters(row, filters)).toBe(true);
    for (const key of [
      "school",
      "className",
      "status",
      "educationPathway",
      "topRecommendation",
      "cluster",
    ] as const)
      expect(
        matchesSubmissionFilters(row, { ...filters, [key]: "missing" }),
      ).toBe(false);
    for (const search of [
      row.fullName,
      row.email,
      row.school,
      row.className,
      row.report.topRecommendation.majorName,
      row.report.topRecommendation.cluster,
    ])
      expect(
        matchesSubmissionFilters(row, { search: search.toUpperCase() }),
      ).toBe(true);
    expect(
      matchesSubmissionFilters(row, { search: "unknown archive phrase" }),
    ).toBe(false);
  });
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
