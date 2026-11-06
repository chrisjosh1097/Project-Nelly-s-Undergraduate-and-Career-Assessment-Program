import { describe, it, expect, vi, beforeEach } from "vitest";
import { techAnswer } from "./fixtures";
const storage = vi.hoisted(() => vi.fn());
vi.mock("@/lib/submissions/store", () => ({ createOrGetSubmission: storage }));
vi.mock("@/lib/firebase/admin", async (original) => ({
  ...(await original<typeof import("@/lib/firebase/admin")>()),
  verifyFirebaseRequest: async () => ({
    email: "nelly@example.com",
    email_verified: true,
  }),
}));
import { POST } from "@/app/api/submissions/route";
beforeEach(() => {
  storage.mockReset();
  storage.mockResolvedValue({
    created: true,
    submission: { status: "completed" },
  });
});
const request = (body: unknown) =>
  new Request("http://localhost/api/submissions", {
    method: "POST",
    body: JSON.stringify(body),
  });
describe("submission boundary", () => {
  it("rejects wrong verified email", async () => {
    expect(
      (await POST(request({ ...techAnswer, email: "other@example.com" })))
        .status,
    ).toBe(403);
    expect(storage).not.toHaveBeenCalled();
  });
  it("rejects invalid pathway before writing", async () => {
    expect(
      (await POST(request({ ...techAnswer, educationPathway: "bad" }))).status,
    ).toBe(400);
    expect(storage).not.toHaveBeenCalled();
  });
  it.each(["vocational", undefined])(
    "stores valid or absent direction %s",
    async (educationPathway) => {
      expect(
        (await POST(request({ ...techAnswer, educationPathway }))).status,
      ).toBe(200);
      expect(storage.mock.calls[0][0].educationPathway).toBe(educationPathway);
    },
  );
});
