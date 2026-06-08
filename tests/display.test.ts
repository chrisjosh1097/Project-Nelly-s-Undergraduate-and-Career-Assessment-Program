import { describe, expect, it } from "vitest";
import { CAREER_MATCH_LABEL, shouldShowAlternativePathway } from "@/lib/recommendation/display";

describe("recommendation display helpers", () => {
  it("uses the requested career match label", () => {
    expect(CAREER_MATCH_LABEL).toBe("KARIR YANG SESUAI");
  });

  it("only shows alternative pathway advice for Gemini narratives", () => {
    expect(shouldShowAlternativePathway("gemini", ["Langkah 1"])).toBe(true);
    expect(shouldShowAlternativePathway("heuristic", ["Langkah 1"])).toBe(false);
    expect(shouldShowAlternativePathway(undefined, ["Langkah 1"])).toBe(false);
    expect(shouldShowAlternativePathway("gemini", [])).toBe(false);
  });
});
