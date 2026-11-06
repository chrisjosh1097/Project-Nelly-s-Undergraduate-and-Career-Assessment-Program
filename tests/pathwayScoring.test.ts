import { describe, it, expect } from "vitest";
import { majors } from "../data";
import { generateRecommendations } from "@/lib/recommendation/scoring";
import {
  isMajorEligible,
  validatePathwayCapacity,
} from "@/lib/recommendation/eligibility";
import { techAnswer } from "./fixtures";

describe("degree-constrained recommendations", () => {
  it.each(["university", "vocational"] as const)(
    "keeps ten unique eligible %s results, including low-fit fallbacks",
    (educationPathway) => {
      for (const favoriteActivities of [
        techAnswer.favoriteActivities,
        ["Menulis/berbicara"],
      ]) {
        const input = {
          ...techAnswer,
          educationPathway,
          favoriteActivities,
          dreamProfession: "",
          futureVision: "",
        };
        const result = generateRecommendations(input).recommendations;
        expect(result).toHaveLength(10);
        expect(new Set(result.map((r) => r.majorId)).size).toBe(10);
        for (const r of result) {
          const m = majors.find((m) => m.id === r.majorId)!;
          expect(
            m.degreeTypes.some((d) =>
              educationPathway === "university"
                ? d === "S1"
                : ["D3", "D4"].includes(d),
            ),
          ).toBe(true);
          expect(r.degreeTypes?.length).toBeGreaterThan(0);
          expect(
            r.degreeTypes?.every((d) =>
              educationPathway === "university"
                ? d === "S1"
                : ["D3", "D4"].includes(d),
            ),
          ).toBe(true);
        }
        expect(generateRecommendations(input).recommendations).toEqual(result);
      }
    },
  );
  it("does not confuse certifications or generic vocational labels with degrees", () => {
    expect(
      isMajorEligible({ degreeTypes: ["Sertifikasi", "Vokasi"] }, "vocational"),
    ).toBe(false);
    expect(isMajorEligible({ degreeTypes: ["S1", "D4"] }, "vocational")).toBe(
      true,
    );
    expect(isMajorEligible({ degreeTypes: ["S1", "D4"] }, "university")).toBe(
      true,
    );
  });
  it("keeps explicit exploring and historical scoring equivalent", () => {
    expect(
      generateRecommendations({ ...techAnswer, educationPathway: "exploring" })
        .recommendations,
    ).toEqual(generateRecommendations(techAnswer).recommendations);
  });
  it("rejects undersized pools rather than borrowing wrong-degree programs", () => {
    expect(
      validatePathwayCapacity([{ ...majors[0], degreeTypes: ["S1"] }]),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("vocational"),
        expect.stringContaining("university"),
      ]),
    );
    expect(validatePathwayCapacity(majors)).toEqual([]);
  });
});
