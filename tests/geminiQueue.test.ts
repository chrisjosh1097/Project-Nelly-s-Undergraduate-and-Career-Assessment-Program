import { afterEach, describe, expect, it } from "vitest";
import {
  getGeminiQueueConfig,
  isGeminiQueueEnabled,
  isGeminiWorkerAuthorized,
  nextRetryAvailableAt
} from "@/lib/recommendation/geminiQueue";

const originalEnv = { ...process.env };

describe("Gemini narrative queue helpers", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("enables queue only when Gemini enhancement is enabled and queue is not explicitly disabled", () => {
    process.env.ENABLE_GEMINI_ENHANCEMENT = "true";
    delete process.env.GEMINI_QUEUE_ENABLED;
    expect(isGeminiQueueEnabled()).toBe(true);

    process.env.GEMINI_QUEUE_ENABLED = "false";
    expect(isGeminiQueueEnabled()).toBe(false);

    process.env.ENABLE_GEMINI_ENHANCEMENT = "false";
    process.env.GEMINI_QUEUE_ENABLED = "true";
    expect(isGeminiQueueEnabled()).toBe(false);
  });

  it("requires the internal worker bearer secret", () => {
    process.env.GEMINI_WORKER_SECRET = "worker-secret";

    expect(isGeminiWorkerAuthorized(new Request("https://example.test"))).toBe(false);
    expect(
      isGeminiWorkerAuthorized(
        new Request("https://example.test", {
          headers: { authorization: "Bearer wrong-secret" }
        })
      )
    ).toBe(false);
    expect(
      isGeminiWorkerAuthorized(
        new Request("https://example.test", {
          headers: { authorization: "Bearer worker-secret" }
        })
      )
    ).toBe(true);
  });

  it("uses bounded backoff for retry scheduling", () => {
    const now = Date.parse("2026-06-16T00:00:00.000Z");
    expect(Date.parse(nextRetryAvailableAt(1, now)) - now).toBe(15_000);
    expect(Date.parse(nextRetryAvailableAt(8, now)) - now).toBe(60_000);
  });

  it("defaults to the webinar queue settings", () => {
    delete process.env.GEMINI_QUEUE_BATCH_SIZE;
    delete process.env.GEMINI_QUEUE_LOCK_MS;

    expect(getGeminiQueueConfig()).toMatchObject({
      batchSize: 10,
      lockMs: 120_000
    });
  });
});
