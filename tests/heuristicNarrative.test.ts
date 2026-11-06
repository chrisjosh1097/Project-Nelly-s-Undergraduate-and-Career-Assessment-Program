import { describe, expect, it } from "vitest";
import { buildHeuristicNarrativeReport, buildHeuristicSummary } from "@/lib/recommendation/narrative";
import { generateRecommendations } from "@/lib/recommendation/scoring";
import { techAnswer } from "./fixtures";

describe("heuristic narrative", () => {
  it("never cuts strength sentences with an ellipsis, even with long answers", async () => {
    const answer = {
      ...techAnswer,
      skillStrengths: ["Analisis data", "Komunikasi", "Kepemimpinan", "Kreativitas"],
      favoriteSubjects: ["Matematika", "Fisika", "Kimia"],
      favoriteActivities: ["Membuat proyek coding", "Menulis cerita panjang", "Diskusi kelompok"],
    };
    const report = await buildHeuristicNarrativeReport(answer, generateRecommendations(answer));
    const strengths = report.narrative?.studentStrengths ?? [];
    expect(strengths.length).toBeGreaterThan(0);
    for (const line of strengths) {
      expect(line.endsWith("...")).toBe(false);
      expect(line.split(/\s+/).length).toBeLessThanOrEqual(30);
    }
  });

  it("builds a specific two-sentence summary without the student name or score", () => {
    const top = generateRecommendations(techAnswer).topRecommendation;
    const summary = buildHeuristicSummary(top);
    expect(summary).toContain(top.majorName);
    expect(summary).toMatch(/Mulai (minggu ini|dengan)/);
    expect(summary).not.toContain(techAnswer.fullName);
    expect(summary).not.toMatch(/\/100/);
    expect(summary.split(/(?<=\.)\s+/).length).toBe(2);
  });
});
