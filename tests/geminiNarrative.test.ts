import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateRecommendations } from "@/lib/recommendation/scoring";
import { enhanceRecommendationReport, enhanceRecommendationReportWithGemini } from "@/lib/recommendation/narrative";
import { completeGeminiNarrative, technicalAspirationAnswer as answer } from "./narrativeFixtures";

const report = generateRecommendations(answer);
const response = (text: string, finishReason: string | undefined = "STOP") => Response.json({ candidates: [{ finishReason, content: { parts: [{ text }] } }] });

beforeEach(() => {
  vi.stubEnv("ENABLE_GEMINI_ENHANCEMENT", "true");
  vi.stubEnv("GEMINI_API_KEY", "test-only-key");
  vi.stubEnv("GEMINI_TIMEOUT_MS", "25000");
  vi.stubEnv("GEMINI_MAX_OUTPUT_TOKENS", "5200");
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("complete and bounded Gemini enrichment", () => {
  it.each(["fetch", "body"])("enforces a total deadline on a hanging %s with one attempt", async phase => {
    vi.useFakeTimers();
    vi.stubEnv("GEMINI_TIMEOUT_MS", "1000");
    const fetch = vi.fn(async () => phase === "fetch"
      ? new Promise<Response>(() => {})
      : { ok: true, json: () => new Promise(() => {}) } as Response);
    vi.stubGlobal("fetch", fetch);
    let outcome = "pending";
    void enhanceRecommendationReportWithGemini(answer, report).catch(error => { outcome = error.message; });
    await vi.advanceTimersByTimeAsync(1001);
    expect(outcome).toMatch(/Gemini.*timeout/i);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("reports HTTP status without waiting on or exposing the provider error body", async () => {
    vi.useFakeTimers();
    vi.stubEnv("GEMINI_TIMEOUT_MS", "1000");
    vi.stubGlobal("fetch", async () => new Response("private synthetic payload", { status: 503 }));
    await expect(enhanceRecommendationReportWithGemini(answer, report)).rejects.toThrow(/^Gemini request failed: 503\.?$/);
  });
  it("accepts a complete response without changing ranked data or the saved input", async () => {
    const original = structuredClone(report);
    const fetch = vi.fn(async () => response(JSON.stringify(completeGeminiNarrative(report))));
    vi.stubGlobal("fetch", fetch);
    const result = await enhanceRecommendationReportWithGemini(answer, report);
    expect(result.narrative?.source).toBe("gemini");
    for (let i=0;i<result.recommendations.length;i++) {
      const r = result.recommendations[i];
      for (const field of ["rank","majorId","overallFitScore","aiFutureResilienceScore","fitLabel","aiFutureResilienceLabel","degreeTypes","scoringBreakdown"] as const)
        expect(r[field]).toEqual(original.recommendations[i][field]);
    }
    expect(result.scoringVersion).toBe(original.scoringVersion);
    expect(result.generatedAt).toBe(original.generatedAt);
    expect(report).toEqual(original);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("does not label a heuristic fallback as Gemini after an earlier enrichment", async () => {
    const saved = { ...structuredClone(report), narrativeVersion: "gemini:earlier-model" };
    vi.stubGlobal("fetch", async () => { throw new Error("Synthetic offline"); });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await enhanceRecommendationReport(answer, saved);
    expect(result.narrative?.source).toBe("heuristic");
    expect(result.narrativeVersion).not.toMatch(/^gemini:/);
    expect(saved.narrativeVersion).toBe("gemini:earlier-model");
  });
  it("does not echo model-supplied keys into stored schema errors", async () => {
    const payload = completeGeminiNarrative(report);
    (payload.careerPersonalizations as Record<string, unknown>)["private-synthetic@example.test"] = {};
    vi.stubGlobal("fetch", async () => response(JSON.stringify(payload)));
    let message = "";
    try { await enhanceRecommendationReportWithGemini(answer, report); }
    catch (error) { message = (error as Error).message; }
    expect(message).toMatch(/Gemini.*schema invalid/);
    expect(message).not.toContain("private-synthetic@example.test");
  });

  it.each(["{}", "[]", "null", '"text"', '{"summary":', "```json\n{}\n```", "prefix {}", ""])("rejects invalid JSON/enrichment: %s", async text => {
    const fetch = vi.fn(async () => response(text)); vi.stubGlobal("fetch", fetch);
    await expect(enhanceRecommendationReportWithGemini(answer, report)).rejects.toThrow(/Gemini/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(["MAX_TOKENS", "SAFETY", "RECITATION", "", "UNKNOWN"])("rejects non-complete finish reason %s even with valid JSON", async reason => {
    vi.stubGlobal("fetch", vi.fn(async () => response(JSON.stringify(completeGeminiNarrative(report)), reason)));
    await expect(enhanceRecommendationReportWithGemini(answer, report)).rejects.toThrow(/Gemini.*(finish|MAX_TOKENS|complete)/);
  });
  it("requires finish metadata", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ candidates: [{ content: { parts: [{text: JSON.stringify(completeGeminiNarrative(report))}] } }] }));
    await expect(enhanceRecommendationReportWithGemini(answer, report)).rejects.toThrow(/Gemini/);
  });
  it.each([null, [], [null], [{ text: 42 }], "bad parts"].map(parts => [parts]))("rejects malformed text parts with an actionable Gemini error: %j", async parts => {
    vi.stubGlobal("fetch", async () => Response.json({ candidates: [{ finishReason: "STOP", content: { parts } }] }));
    await expect(enhanceRecommendationReportWithGemini(answer, report)).rejects.toThrow(/Gemini.*(empty|invalid|missing)/i);
  });
  it("rejects a malformed provider response envelope with an actionable error", async () => {
    vi.stubGlobal("fetch", async () => new Response("not JSON"));
    await expect(enhanceRecommendationReportWithGemini(answer, report)).rejects.toThrow(/Gemini.*JSON/);
  });
  it("reports MAX_TOKENS before attempting malformed JSON parsing", async () => {
    vi.stubGlobal("fetch", async () => response('{"summary":', "MAX_TOKENS"));
    await expect(enhanceRecommendationReportWithGemini(answer, report)).rejects.toThrow(/MAX_TOKENS/);
  });

  it.each([
    ["missing strengths", (v: any) => { delete v.studentStrengths; }],
    ["blank summary", (v: any) => { v.summary = "  "; }],
    ["wrong type", (v: any) => { v.summary = 42; }],
    ["missing major", (v: any) => { delete v.recommendationReasons[report.topRecommendation.majorId]; }],
    ["unknown major", (v: any) => { v.recommendationReasons.fake = ["a", "b"]; }],
    ["missing personalization", (v: any) => { delete v.careerPersonalizations[report.topRecommendation.majorId]; }],
    ["missing advice", (v: any) => { v.careerPersonalizations[report.topRecommendation.majorId].pathwayAdvice = []; }],
    ["duplicate strengths", (v: any) => { v.studentStrengths = ["same", "same", "same"]; }],
    ["sanitization collision", (v: any) => { v.careerPersonalizations[report.topRecommendation.majorId].nicheCareerPaths = ['Role|', 'Role', 'Other']; }],
    ["ranking mutation", (v: any) => { v.recommendations = [{ majorId: "fake", rank: 1, overallFitScore: 100 }]; }],
    ["nested degree mutation", (v: any) => { v.careerPersonalizations[report.topRecommendation.majorId].degreeTypes = ["S1"]; }],
    ["oversized summary", (v: any) => { v.summary = "x".repeat(10000); }],
  ])("rejects %s without mutating the report", async (_label, mutate) => {
    const value = completeGeminiNarrative(report); mutate(value);
    const original = structuredClone(report);
    vi.stubGlobal("fetch", async () => response(JSON.stringify(value)));
    await expect(enhanceRecommendationReportWithGemini(answer, report)).rejects.toThrow(/Gemini/);
    expect(report).toEqual(original);
  });

  it("requests all expected IDs through a schema with the original default budget", async () => {
    let body: any;
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      body = JSON.parse(String(init.body)); return response(JSON.stringify(completeGeminiNarrative(report)));
    });
    const timeout = vi.spyOn(AbortSignal, "timeout");
    await enhanceRecommendationReportWithGemini(answer, report);
    expect(body.generationConfig.maxOutputTokens).toBe(5200);
    expect(timeout).toHaveBeenCalledWith(25000);
    expect(body.generationConfig.responseSchema.properties.recommendationReasons.required).toEqual(report.recommendations.map(r=>r.majorId));
    expect(body.generationConfig.responseSchema.properties.careerPersonalizations.required).toEqual(report.recommendations.map(r=>r.majorId));
  });

  it.each([["-100", 1000, 512], ["99999999", 25000, 5200], ["NaN", 25000, 5200], ["", 25000, 5200]])(
    "bounds timeout and token config %s", async (setting, timeoutMs, tokens) => {
      vi.stubEnv("GEMINI_TIMEOUT_MS", setting); vi.stubEnv("GEMINI_MAX_OUTPUT_TOKENS", setting);
      const timeout = vi.spyOn(AbortSignal, "timeout"); let body: any;
      vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => { body = JSON.parse(String(init.body)); return response(JSON.stringify(completeGeminiNarrative(report))); });
      await enhanceRecommendationReportWithGemini(answer, report);
      expect(timeout).toHaveBeenCalledWith(timeoutMs);
      expect(body.generationConfig.maxOutputTokens).toBe(tokens);
    },
  );

  it.each(["network", "timeout", "http", "empty candidates"])("keeps usable heuristics on %s failure with one request", async failure => {
    const fetch = vi.fn(async () => {
      if (failure === "http") return new Response("synthetic failure", {status: 503});
      if (failure === "empty candidates") return Response.json({candidates: []});
      throw new Error(failure === "timeout" ? "The operation was aborted due to timeout" : "offline");
    });
    vi.stubGlobal("fetch", fetch); vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await enhanceRecommendationReport(answer, report);
    expect(result.narrative?.source).toBe("heuristic");
    expect(result.recommendations.map(r=>[r.majorId,r.overallFitScore])).toEqual(report.recommendations.map(r=>[r.majorId,r.overallFitScore]));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
