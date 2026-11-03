import { describe, expect, it } from "vitest";
import { narrativeLabel, narrativeStatusLabel, scoringVersionLabel } from "../src/lib/admin/labels";

describe("admin display labels", () => {
  it("shortens scoring versions without changing unknown values", () => {
    expect(scoringVersionLabel("knowledge-base-heuristic-v3.2.0")).toBe("v3.2.0 (aturan tetap)");
    expect(scoringVersionLabel("custom")).toBe("custom");
    expect(scoringVersionLabel(undefined)).toBe("—");
  });
  it("names narrative source and status in Indonesian", () => {
    expect(narrativeLabel("completed", "gemini:gemini-2.5-flash")).toBe("Gemini · selesai");
    expect(narrativeLabel("skipped", "heuristic-template-v2.1.0")).toBe("Template · dilewati");
    expect(narrativeLabel(undefined, undefined)).toBe("— · dilewati");
    expect(narrativeStatusLabel("failed")).toBe("gagal");
  });
});
