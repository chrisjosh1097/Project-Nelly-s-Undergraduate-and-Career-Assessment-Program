import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateRecommendations } from "@/lib/recommendation/scoring";
import { completeGeminiNarrative, technicalAspirationAnswer as answer } from "./narrativeFixtures";

// All persistence is in memory; importing this suite cannot initialize Firebase.
const mock = vi.hoisted(() => ({ db: null as any }));
vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: () => mock.db }));
import { drainGeminiNarrativeJobs } from "@/lib/recommendation/geminiQueue";
import { getGeminiQueueConfig } from "@/lib/recommendation/geminiQueue";

const jobPath = "geminiNarrativeJobs/synthetic";
const submissionPath = "submissions/synthetic";
const savedReport = generateRecommendations(answer);
let docs: Map<string, any>;
let processingErrors: unknown[];
let slotFailure: boolean;
let afterRecoveryScan: (() => void) | undefined;

function reference(path: string): any {
  return {
    id: path.split("/").at(-1),
    get: async () => ({ exists: docs.has(path), id: path.split("/").at(-1), data: () => structuredClone(docs.get(path)) }),
    set: async (patch: any) => {
      docs.set(path, { ...docs.get(path), ...structuredClone(patch) });
      if (path === submissionPath && patch.narrativeStatus === "processing") processingErrors.push(docs.get(path).narrativeError);
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-30T00:00:00Z"));
  for (const [key, value] of Object.entries({ENABLE_GEMINI_ENHANCEMENT:"true", GEMINI_QUEUE_ENABLED:"true", GEMINI_API_KEY:"test-only-key", GEMINI_QUEUE_DELAY_MS:"0", GEMINI_QUEUE_MAX_ATTEMPTS:"3", GEMINI_QUEUE_LOCK_MS:"120000", GEMINI_TIMEOUT_MS:"25000"})) vi.stubEnv(key, value);
  processingErrors = []; slotFailure = false; afterRecoveryScan = undefined;
  docs = new Map([
    [jobPath, {id:"synthetic",submissionId:"synthetic",status:"queued",attempts:0,availableAt:new Date().toISOString(),createdAt:new Date().toISOString(),lastError:"old error"}],
    [submissionPath, {answers:answer,report:structuredClone(savedReport),narrativeStatus:"pending",narrativeError:"old error"}],
  ]);
  mock.db = {
    doc: (path: string) => { if (slotFailure) throw new Error("Synthetic slot failure"); return reference(path); },
    collection: (name: string) => ({
      doc: (id: string) => reference(`${name}/${id}`),
      where: (field: string, _operator: string, value: unknown) => ({ limit: (limit: number) => ({
        get: async () => {
          const snapshot = { docs: [...docs].filter(([path,data]) => path.startsWith(`${name}/`) && data[field] === value).slice(0,limit).map(([path,data]) => ({id:path.split("/").at(-1),ref:reference(path),data:()=>structuredClone(data)})) };
          if (field === "status" && value === "processing") afterRecoveryScan?.();
          return snapshot;
        },
      }) }),
    }),
    runTransaction: async (fn: any) => fn({ get: (ref: any) => ref.get(), set: (ref: any, patch: any) => ref.set(patch) }),
    batch: () => {
      const writes: Array<[any,any]> = [];
      return { set: (ref: any, patch: any) => writes.push([ref,patch]), commit: async () => Promise.all(writes.map(([ref,patch])=>ref.set(patch))) };
    },
  };
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Gemini queue report lifecycle", () => {
  it("does not recover an expired snapshot after another worker completed it", async () => {
    docs.set(jobPath, { ...docs.get(jobPath), status: "processing", attempts: 3, lockedUntil: new Date(Date.now() - 1000).toISOString() });
    afterRecoveryScan = () => {
      docs.set(jobPath, { ...docs.get(jobPath), status: "completed", lastError: "" });
      docs.set(submissionPath, { ...docs.get(submissionPath), narrativeStatus: "completed", narrativeError: "" });
    };
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await drainGeminiNarrativeJobs();
    expect(docs.get(jobPath)).toMatchObject({ status: "completed", lastError: "" });
    expect(docs.get(submissionPath)).toMatchObject({ narrativeStatus: "completed", narrativeError: "" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("bounds slot waits rather than keeping an attempt locked behind distant reservations", async () => {
    docs.set("system/geminiRateLimiter", { nextAllowedAtMillis: Date.now() + 120_000 });
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    let finished = false;
    const draining = drainGeminiNarrativeJobs().then(() => { finished = true; });
    await vi.advanceTimersByTimeAsync(10_001);
    expect(finished).toBe(true);
    await draining;
    expect(fetch).not.toHaveBeenCalled();
    expect(docs.get(jobPath)).toMatchObject({ status: "queued", attempts: 1 });
    expect(docs.get(submissionPath).report).toEqual(savedReport);
  });
  it("keeps the lease longer than bounded provider and slot waits", () => {
    vi.stubEnv("GEMINI_QUEUE_LOCK_MS", "10000");
    expect(getGeminiQueueConfig().lockMs).toBeGreaterThanOrEqual(40_000);
  });
  it.each(["success", "failure"])("does not let an expired worker's %s overwrite newer completion", async outcome => {
    const newerReport = { ...savedReport, narrativeVersion: "newer-synthetic" };
    vi.stubGlobal("fetch", async () => {
      docs.set(jobPath, { ...docs.get(jobPath), status: "completed", attempts: 2, lastError: "" });
      docs.set(submissionPath, { ...docs.get(submissionPath), report: newerReport, narrativeStatus: "completed", narrativeError: "" });
      if (outcome === "failure") throw new Error("Synthetic stale failure");
      return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(completeGeminiNarrative(savedReport)) }] } }] });
    });
    await drainGeminiNarrativeJobs();
    expect(docs.get(jobPath)).toMatchObject({ status: "completed", attempts: 2, lastError: "" });
    expect(docs.get(submissionPath)).toMatchObject({ report: newerReport, narrativeStatus: "completed", narrativeError: "" });
  });
  it("clears the old active error while retrying and clears both errors on success", async () => {
    const fetch = vi.fn(async () => Response.json({ candidates: [{finishReason:"STOP",content:{parts:[{text:JSON.stringify(completeGeminiNarrative(savedReport))}]}}] }));
    vi.stubGlobal("fetch", fetch);
    await drainGeminiNarrativeJobs();
    expect(processingErrors).toEqual([""]);
    expect(docs.get(submissionPath)).toMatchObject({narrativeStatus:"completed",narrativeError:"",report:{narrative:{source:"gemini"}}});
    expect(docs.get(jobPath)).toMatchObject({status:"completed",lastError:"",attempts:1});
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(["MAX_TOKENS", "invalid JSON", "missing fields", "network"])("preserves saved report through bounded %s retries", async failure => {
    const fetch = vi.fn(async () => {
      if (failure === "network") throw new Error("Synthetic offline failure");
      return Response.json({ candidates: [{finishReason:failure === "MAX_TOKENS" ? "MAX_TOKENS" : "STOP",content:{parts:[{text:failure === "invalid JSON" ? '{"summary":' : '{}'}]}}] });
    });
    vi.stubGlobal("fetch", fetch);
    for (let attempt=1; attempt<=3; attempt++) {
      await drainGeminiNarrativeJobs();
      expect(docs.get(submissionPath).report).toEqual(savedReport);
      expect(docs.get(submissionPath).narrativeStatus).toBe(attempt === 3 ? "failed" : "pending");
      expect(docs.get(submissionPath).narrativeError).toBeTruthy();
      expect(docs.get(jobPath).attempts).toBe(attempt);
      if (attempt < 3) {
        expect(Date.parse(docs.get(jobPath).availableAt) - Date.now()).toBe(attempt * 15000);
        await drainGeminiNarrativeJobs(); // not due: must not call provider
      }
      vi.advanceTimersByTime(61000);
    }
    await drainGeminiNarrativeJobs();
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it.each(["processing", "queued"])("does not exceed attempts after exhausted %s job recovery", async status => {
    docs.set(jobPath, {...docs.get(jobPath),status,attempts:3,lockedUntil:new Date(Date.now()-1000).toISOString()});
    const fetch = vi.fn(async () => { throw new Error("Must not call provider"); }); vi.stubGlobal("fetch", fetch);
    await drainGeminiNarrativeJobs();
    expect(fetch).not.toHaveBeenCalled();
    expect(docs.get(jobPath)).toMatchObject({status:"failed",attempts:3});
    expect(docs.get(submissionPath)).toMatchObject({narrativeStatus:"failed",report:savedReport});
  });

  it("recovers an expired attempt below the ceiling with one bounded retry", async () => {
    docs.set(jobPath, {...docs.get(jobPath),status:"processing",attempts:1,lockedUntil:new Date(Date.now()-1000).toISOString()});
    vi.stubGlobal("fetch", async () => { throw new Error("Synthetic offline failure"); });
    await drainGeminiNarrativeJobs();
    expect(docs.get(jobPath)).toMatchObject({status:"queued",attempts:2});
    expect(docs.get(submissionPath).report).toEqual(savedReport);
  });

  it("handles slot reservation failure through the existing retry path", async () => {
    slotFailure = true;
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(drainGeminiNarrativeJobs()).resolves.toMatchObject({processed:1});
    expect(docs.get(jobPath)).toMatchObject({status:"queued",attempts:1});
    expect(docs.get(submissionPath)).toMatchObject({narrativeStatus:"pending",report:savedReport});
    expect(fetch).not.toHaveBeenCalled();
  });
});
