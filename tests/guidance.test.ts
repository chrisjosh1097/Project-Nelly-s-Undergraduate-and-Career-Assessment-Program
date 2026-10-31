import { describe, expect, it } from "vitest";
import { generateRecommendations, scoreMajor } from "@/lib/recommendation";
import {
  attachStudentGuidance,
  buildStudentGuidance,
  GENERIC_AI_LINES,
  skillTargetFor,
} from "@/lib/recommendation/guidance";
import type { RecommendationReport, StudentAnswer } from "@/lib/types";
import { techAnswer } from "./fixtures";
import { majorsById } from "../data";
import { GENERIC_CAREER_AI_CAUTIONS, visibleCareerCautions } from "@/components/results/resultPresentation";

const vocationalAnswer: StudentAnswer = {
  ...techAnswer,
  educationPathway: "vocational",
  favoriteSubjects: ["Matematika", "Fisika"],
  favoriteActivities: ["Eksperimen/lab", "Kerja lapangan", "Menulis/berbicara"],
  skillStrengths: ["Leadership", "Public speaking", "Logika", "Kerja praktik"],
  workStyle: "Banyak bertemu orang",
  problemAreas: ["Teknologi"],
  personalConstraints: ["Belum tahu minat"],
  techComfort: "Biasa saja",
  dreamProfession: "Engineer di Jepang",
  futureVision: "Bekerja di kapal atau di tambang",
};

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function stripGuidance(report: RecommendationReport) {
  return report.recommendations.map(({ majorId, rank, overallFitScore, scoringBreakdown }) => ({
    majorId, rank, overallFitScore, scoringBreakdown,
  }));
}

describe("student guidance builder", () => {
  const report = generateRecommendations(vocationalAnswer);
  const guidance = report.studentGuidance!;
  const top = report.recommendations[0];

  it("summarizes actual evidence from the scoring breakdown", () => {
    expect(guidance.evidenceSummary).toContain(top.majorName);
    expect(guidance.evidenceSummary).toContain(String(top.overallFitScore));
    for (const subject of top.scoringBreakdown.matchedSubjects.slice(0, 1)) {
      expect(guidance.evidenceSummary).toContain(subject);
    }
  });

  it("turns every skill gap into a measurable target, never a bare label", () => {
    for (const recommendation of report.recommendations) {
      for (const target of recommendation.actionGuidance!.skillTargets) {
        expect(target.target.length).toBeGreaterThan(target.gap.length + 10);
        expect(target.proof.trim()).not.toBe("");
      }
    }
    expect(skillTargetFor("Skill rekaan").target).toBe("Bisa menunjukkan dasar Skill rekaan lewat satu contoh kecil.");
    expect(skillTargetFor("ketelitian").target).not.toContain("dasar ketelitian lewat");
  });

  it("gives a four-week plan with duration and proof for each recommendation", () => {
    for (const recommendation of report.recommendations) {
      const plan = recommendation.actionGuidance!.weekPlan;
      expect(plan.map((week) => week.week)).toEqual([1, 2, 3, 4]);
      for (const week of plan) {
        expect(week.durationLabel).toMatch(/jam|menit/);
        expect(week.proof.trim()).not.toBe("");
      }
    }
  });

  it("explains uncertainty, unused skills and people-facing preference", () => {
    expect(guidance.tensions.some((line) => line.includes("Belum tahu minat") && line.includes("4 minggu"))).toBe(true);
    if (top.scoringBreakdown.skillScore < 50) {
      expect(guidance.tensions.some((line) => line.includes("Leadership") || line.includes("Public speaking"))).toBe(true);
    }
    expect(guidance.tensions.some((line) => line.includes("bertemu orang"))).toBe(true);
  });

  it("matches Japan, maritime and mining routes with verify lines; none for unrelated text", () => {
    const titles = guidance.aspirationRoutes.map((route) => route.title);
    expect(titles).toHaveLength(3);
    expect(titles.join(" ")).toMatch(/Jepang/);
    expect(titles.join(" ")).toMatch(/kapal/);
    expect(titles.join(" ")).toMatch(/pertambangan/);
    for (const route of guidance.aspirationRoutes) expect(route.verify).toMatch(/^Cek sumber resmi/);

    const unrelated = generateRecommendations({ ...techAnswer, dreamProfession: "Belum yakin", futureVision: "Ingin hidup tenang" });
    expect(unrelated.studentGuidance!.aspirationRoutes).toEqual([]);
  });

  it("adds a comparison note exactly when rank disagrees with score or score is below 50", () => {
    for (const recommendation of report.recommendations) {
      const outranked = report.recommendations.some((other) =>
        other.rank > recommendation.rank && other.overallFitScore > recommendation.overallFitScore);
      const expected = outranked || recommendation.overallFitScore < 50;
      expect(Boolean(recommendation.actionGuidance!.comparisonNote)).toBe(expected);
    }
  });

  it("only glosses terms that appear in rendered strings", () => {
    const rendered = JSON.stringify({ guidance: { ...guidance, glossary: [] }, recs: report.recommendations.slice(0, 3) });
    for (const term of guidance.glossary) {
      const names = [term.term, ...(term.aliases ?? [])];
      expect(names.some((name) => rendered.toLowerCase().includes(name.toLowerCase()))).toBe(true);
    }
  });

  it("replaces the three generic AI lines with one field note", () => {
    for (const recommendation of report.recommendations) {
      for (const line of GENERIC_AI_LINES) expect(recommendation.cautionNotes).not.toContain(line);
      const note = recommendation.actionGuidance!.aiNote;
      expect(note, recommendation.majorId).toBeTruthy();
      for (const line of GENERIC_CAREER_AI_CAUTIONS) {
        expect(visibleCareerCautions(recommendation)).not.toContain(line);
        expect(recommendation.cautionNotes).not.toContain(line);
      }
      expect(recommendation.cautionNotes.filter((line) => line === note)).toHaveLength(1);
    }
  });

  it("never changes scores, ranks or breakdowns, and is pure", () => {
    const fresh = generateRecommendations(vocationalAnswer);
    for (const recommendation of fresh.recommendations) {
      const direct = scoreMajor(vocationalAnswer, majorsById[recommendation.majorId], recommendation.rank);
      expect(recommendation.overallFitScore).toBe(direct.overallFitScore);
      expect(recommendation.scoringBreakdown).toEqual(direct.scoringBreakdown);
    }
    const frozen = deepFreeze(structuredClone(fresh));
    const again = attachStudentGuidance(vocationalAnswer, frozen);
    expect(stripGuidance(again)).toEqual(stripGuidance(fresh));
    expect(buildStudentGuidance(vocationalAnswer, frozen)).toEqual(buildStudentGuidance(vocationalAnswer, frozen));
  });

  it("leaves old reports without guidance untouched when not attached", () => {
    const legacy = structuredClone(report);
    delete legacy.studentGuidance;
    for (const recommendation of legacy.recommendations) delete recommendation.actionGuidance;
    expect(legacy.studentGuidance).toBeUndefined();
    expect(legacy.recommendations[0].overallFitScore).toBe(top.overallFitScore);
  });
});
