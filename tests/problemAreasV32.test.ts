import { describe, expect, it } from "vitest";
import { majorsById } from "../data";
import { studentAnswerSchema } from "@/lib/validation";
import { normalizeStudentAnswer } from "@/lib/assessment/normalization";
import { getAssessmentSteps } from "@/lib/assessment/steps";
import { isLowInformationAspiration } from "@/lib/assessment/formState";
import { formatProblemAreas } from "@/lib/assessment/problemAreaDisplay";
import { problemAreaOptions } from "@/lib/assessment/options";
import {
  SCORING_VERSION,
  calculateScoringBreakdown,
  generateRecommendations,
} from "@/lib/recommendation/scoring";
import { scoreAspirationMajorIntent } from "@/lib/recommendation/aspirationIntent";
import { techAnswer } from "./fixtures";

const sport = "Kepemudaan dan Kebugaran Jasmani";
const education = "Pemerataan Pendidikan dan Literasi";
const environment = "Lingkungan, Iklim, dan Kehidupan Laut";

describe("problem areas v3.2.0", () => {
  it("bumps the scoring version", () => {
    expect(SCORING_VERSION).toBe("knowledge-base-heuristic-v3.2.0");
  });

  it("accepts 1-3 new labels, rejects 4 or duplicates, keeps legacy labels valid", () => {
    const parse = (problemAreas: string[]) =>
      studentAnswerSchema.safeParse({ ...techAnswer, educationPathway: "university", problemAreas }).success;
    expect(parse([sport])).toBe(true);
    expect(parse(problemAreaOptions.slice(0, 3))).toBe(true);
    expect(parse(problemAreaOptions.slice(0, 4))).toBe(false);
    expect(parse([sport, sport])).toBe(false);
    expect(parse([])).toBe(false);
    expect(parse(["Teknologi", "Bisnis", "Hukum", "Sosial"])).toBe(true);
    expect(parse([sport, "Teknologi"])).toBe(false);
  });

  it("maps new labels to multiple tags with rank weights", () => {
    const normalized = normalizeStudentAnswer({ ...techAnswer, problemAreas: [environment, education] });
    expect(normalized.problemAreaIds).toEqual(expect.arrayContaining(["environment", "food", "education"]));
    expect(normalized.problemAreaRanked?.map((item) => item.weight)).toEqual([1, 0.8]);
    expect(normalizeStudentAnswer(techAnswer).problemAreaRanked).toBeUndefined();
  });

  it("gives the first priority more weight than the second", () => {
    const major = majorsById.pendidikan_jasmani;
    const first = calculateScoringBreakdown({ ...techAnswer, dreamProfession: "", futureVision: "", problemAreas: [sport, environment] }, major);
    const second = calculateScoringBreakdown({ ...techAnswer, dreamProfession: "", futureVision: "", problemAreas: [environment, sport] }, major);
    expect(first.problemAreaScore).toBeGreaterThan(second.problemAreaScore);
  });

  it("makes sport majors reachable through the youth/sport option", () => {
    const report = generateRecommendations({
      ...techAnswer,
      educationPathway: "university",
      favoriteSubjects: ["Olahraga"],
      favoriteActivities: ["Olahraga"],
      problemAreas: [sport],
      dreamProfession: "",
      futureVision: "",
    });
    const ids = report.recommendations.map((item) => item.majorId);
    expect(ids.some((id) => ["ilmu_keolahragaan", "pendidikan_jasmani", "sport_science"].includes(id))).toBe(true);
  });

  it("boosts governance majors for government aspirations", () => {
    const answer = { ...techAnswer, dreamProfession: "Staf khusus menteri", futureVision: "" };
    expect(scoreAspirationMajorIntent(answer, majorsById.administrasi_publik).boost).toBeGreaterThan(0);
    expect(scoreAspirationMajorIntent(answer, majorsById.ilmu_politik).boost).toBeGreaterThan(0);
    expect(normalizeStudentAnswer(answer).problemAreaIds).toContain("public_service");
  });

  it("adds the ranking step only for 2+ choices and formats ranked lists", () => {
    const rankSteps = (count: number) =>
      getAssessmentSteps("university", { problemAreaCount: count }).filter((step) => step.type === "rank").length;
    expect(rankSteps(1)).toBe(0);
    expect(rankSteps(2)).toBe(1);
    expect(formatProblemAreas([sport, education])).toBe(`1. ${sport} 2. ${education}`);
    expect(formatProblemAreas(["Teknologi", "Bisnis"])).toBe("Teknologi, Bisnis");
  });

  it("flags low-information aspiration text only", () => {
    expect(isLowInformationAspiration("")).toBe(false);
    expect(isLowInformationAspiration("ingin sukses")).toBe(true);
    expect(isLowInformationAspiration("belum tahu")).toBe(true);
    expect(isLowInformationAspiration("dokter")).toBe(false);
    expect(isLowInformationAspiration("dokter anak di puskesmas")).toBe(false);
  });
});
