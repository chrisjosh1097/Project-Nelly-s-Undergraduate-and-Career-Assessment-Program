import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { replayAggregate } from "../scripts/replayAggregate";
import { generateRecommendations } from "@/lib/recommendation";
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

  it("counts a rank-only change as changed", () => {
    const ids = generateRecommendations(techAnswer).recommendations.map((r) => r.majorId);
    expect(replayAggregate([{ answers: techAnswer, storedTop10: ids }]).top10Changed).toBe(0);
    expect(replayAggregate([{ answers: techAnswer, storedTop10: [...ids].reverse() }]).top10Changed).toBe(1);
  });

  it("prints a fixed diagnostic without file contents on malformed JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "replay-"));
    const file = join(dir, "bad.json");
    writeFileSync(file, '[{"answers":{"fullName":"Synthetic Siti","email":"siti@example.test"}},]');
    let output = "";
    try {
      execFileSync(process.execPath, ["--import", "tsx", "scripts/replayAggregate.ts", file], { encoding: "utf8", stdio: "pipe" });
    } catch (error) {
      const e = error as { stdout?: string; stderr?: string; status?: number };
      output = `${e.stdout ?? ""}${e.stderr ?? ""}`;
      expect(e.status).toBe(1);
    }
    expect(output).toContain("Replay input could not be read");
    for (const leak of ["Synthetic", "siti@example.test", "fullName"]) expect(output).not.toContain(leak);
  }, 60_000);
});
