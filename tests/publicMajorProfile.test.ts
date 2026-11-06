import { describe, expect, it } from "vitest";
import { allMajorIds, majorIndex, publicMajorProfile } from "../src/lib/majors/publicProfile";
import { skills } from "../data/skills";

describe("public major profiles", () => {
  it("builds a complete profile for every KB major", () => {
    const skillLabels = new Set(skills.map((s) => s.label));
    expect(allMajorIds()).toHaveLength(115);
    for (const id of allMajorIds()) {
      const p = publicMajorProfile(id)!;
      expect(p, id).toBeTruthy();
      expect(p.description.length, id).toBeGreaterThan(20);
      expect(p.degreeTypes.length, id).toBeGreaterThan(0);
      expect(p.degreeTypes.every((d) => ["D3", "D4", "S1"].includes(d)), id).toBe(true);
      expect(p.subjects.length && p.skills.length && p.careers.length, id).toBeTruthy();
      expect(p.skills.every((s) => skillLabels.has(s)), id).toBe(true);
      expect(p.aiScore).toBeGreaterThanOrEqual(0);
      expect(p.aiScore).toBeLessThanOrEqual(100);
    }
  });
  it("rejects unknown or unsafe ids", () => {
    expect(publicMajorProfile("tidak_ada")).toBeNull();
    expect(publicMajorProfile("../etc")).toBeNull();
    expect(publicMajorProfile("Informatika")).toBeNull();
  });
  it("groups every major exactly once in the index", () => {
    const ids = majorIndex().flatMap((g) => g.majors.map((m) => m.id));
    expect(new Set(ids).size).toBe(115);
  });
});
