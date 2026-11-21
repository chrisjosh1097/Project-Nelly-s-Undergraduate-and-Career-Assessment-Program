import { describe, expect, it } from "vitest";
import { majors } from "../data";
import { buildScoringMatrix } from "@/lib/admin/scoringMatrix";
import { calculateAIFutureResilienceScore, getAIFutureResilienceLabel } from "@/lib/recommendation";
import { AI_WEIGHTS, FIT_WEIGHTS } from "@/lib/recommendation/scoringRubric";
import { aiResilienceProfilesById } from "../data";

describe("admin scoring matrix", () => {
  const matrix = buildScoringMatrix();

  it("weights each sum to 100%", () => {
    expect(Math.round(FIT_WEIGHTS.reduce((s, w) => s + w.weight, 0) * 100)).toBe(100);
    expect(Math.round(AI_WEIGHTS.reduce((s, w) => s + w.weight, 0) * 100)).toBe(100);
  });

  it("lists every major once with the scorer's own AI score and label", () => {
    expect(matrix.majors).toHaveLength(majors.length);
    expect(new Set(matrix.majors.map((m) => m.id)).size).toBe(majors.length);
    for (const row of matrix.majors) {
      const major = majors.find((m) => m.id === row.id)!;
      const profile = aiResilienceProfilesById[major.aiFutureResilienceProfileId];
      const score = calculateAIFutureResilienceScore(profile);
      expect(row.aiScore, row.id).toBe(score);
      expect(row.aiLabel, row.id).toBe(getAIFutureResilienceLabel(score));
      expect(row.components).toEqual(AI_WEIGHTS.map((w) => profile[w.key]));
    }
  });

  it("sorts by AI score descending, then name", () => {
    const scores = matrix.majors.map((m) => m.aiScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("contains no student data", () => {
    expect(JSON.stringify(matrix)).not.toMatch(/@|fullName|email|school/i);
  });
});

describe("admin scoring matrix route", () => {
  it("requires an admin session and returns the matrix privately", async () => {
    const { vi } = await import("vitest");
    vi.resetModules();
    const verify = vi.fn();
    vi.doMock("@/lib/admin/session", () => ({ verifyManualAdminRequest: verify }));
    const { AuthError } = await import("@/lib/firebase/admin");
    const { GET } = await import("@/app/api/admin/scoring-matrix/route");

    verify.mockImplementation(() => { throw new AuthError("Login admin diperlukan."); });
    const denied = await GET(new Request("http://localhost/api/admin/scoring-matrix"));
    expect(denied.status).toBe(401);

    verify.mockReset();
    const ok = await GET(new Request("http://localhost/api/admin/scoring-matrix"));
    expect(ok.status).toBe(200);
    expect(ok.headers.get("cache-control")).toBe("private, no-store");
    expect((await ok.json()).majors).toHaveLength(majors.length);
    vi.doUnmock("@/lib/admin/session");
  });
});
