import { describe, expect, it } from "vitest";
import { replayAggregate } from "../scripts/replayAggregate";
import { techAnswer } from "./fixtures";

describe("aggregate-only replay", () => {
  it("returns counts only, never student-level data", () => {
    const records = [
      { answers: { ...techAnswer, dreamProfession: "arsitek" }, storedTop10: [] },
      { answers: { ...techAnswer, dreamProfession: "TNI AU" } },
      { answers: { ...techAnswer, dreamProfession: "desainer interior" } },
      null as never, // corrupt record counts as an error, not a crash
    ];
    const summary = replayAggregate(records);
    expect(summary).toEqual({
      total: 4, errors: 1, withTenResults: 3, top10Changed: 1,
      usedGuarantee: 2, guaranteedMajors: 2, relatedGuarantees: 1, officialServiceNote: 1,
    });
    const text = JSON.stringify(summary);
    for (const leak of [techAnswer.fullName, techAnswer.email, "arsitektur", "arsitek"]) expect(text).not.toContain(leak);
  });
});
