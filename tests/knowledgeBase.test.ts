import { describe, expect, it } from "vitest";
import { careers, majors, sampleScoringExamples } from "../data";
import { scoreSampleProfile, validateKnowledgeBase } from "../scripts/validateKnowledgeBase";

describe("structured knowledge base", () => {
  it("passes structural validation", () => {
    const issues = validateKnowledgeBase();
    expect(issues).toEqual([]);
  });

  it("contains at least 60 majors and 100 careers", () => {
    expect(majors.length).toBeGreaterThanOrEqual(60);
    expect(careers.length).toBeGreaterThanOrEqual(100);
  });

  it("supports deterministic sample scoring examples", () => {
    for (const example of sampleScoringExamples) {
      const ranked = scoreSampleProfile(example);
      const topFiveIds = ranked.slice(0, 5).map((item) => item.major.id);
      expect(topFiveIds).toEqual(expect.arrayContaining(example.expectedTopMajorIds));
    }
  });
});
