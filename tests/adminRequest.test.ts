import { afterEach, describe, expect, it, vi } from "vitest";
import * as requests from "@/components/admin/request";
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("bounded admin requests", () => {
  it("rejects a hanging access fetch so the UI can leave its spinner and retry", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", () => new Promise(() => {}));
    let outcome = "pending";
    void requests
      .adminRequest("/api/admin/submissions", (r) => r.json())
      .catch((error) => {
        outcome = error.message;
      });
    await vi.advanceTimersByTimeAsync(15_001);
    expect(outcome).toMatch(/waktu|Coba lagi/i);
  });
  it("bounds a hanging response body as well as the network request", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", async () => ({ json: () => new Promise(() => {}) }));
    let outcome = "pending";
    void requests
      .adminRequest("/api/admin/submissions", (r) => r.json())
      .catch((error) => {
        outcome = error.message;
      });
    await vi.advanceTimersByTimeAsync(15_001);
    expect(outcome).toMatch(/waktu|Coba lagi/i);
  });
  it("returns status and data and propagates ordinary failures without waiting for the deadline", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({ error: "Login" }), { status: 401 }),
    );
    expect(
      await requests.adminRequest("/api/admin/submissions", (r) => r.json()),
    ).toMatchObject({ response: { status: 401 }, data: { error: "Login" } });
    vi.stubGlobal("fetch", async () => {
      throw new Error("Offline");
    });
    await expect(
      requests.adminRequest("/api/admin/submissions", (r) => r.json()),
    ).rejects.toThrow("Offline");
  });
  it("recognizes unauthorized access without parsing an invalid or hanging error body", async () => {
    const response = new Response("invalid JSON", { status: 401 });
    await expect(requests.readAdminJson(response)).resolves.toEqual({});
  });
});
