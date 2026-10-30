import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ verify: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/admin/session", () => ({
  verifyManualAdminRequest: mocks.verify,
}));
vi.mock("@/lib/submissions/store", () => ({ listSubmissions: mocks.list }));
import { GET as list } from "@/app/api/admin/submissions/route";
import { GET as csv } from "@/app/api/admin/export/route";
import { AuthError } from "@/lib/firebase/admin";
beforeEach(() => {
  mocks.verify.mockReset();
  mocks.list.mockReset().mockResolvedValue([]);
});
describe("protected admin queries", () => {
  it.each([list, csv])(
    "authenticates before accessing private rows",
    async (handler) => {
      mocks.verify.mockImplementation(() => {
        throw new AuthError("Login admin diperlukan.");
      });
      expect(
        (await handler(new Request("http://localhost/api/admin/submissions")))
          .status,
      ).toBe(401);
      expect(mocks.list).not.toHaveBeenCalled();
    },
  );
  it.each([list, csv])(
    "passes identical validated pathway filters",
    async (handler) => {
      const response = await handler(
        new Request(
          "http://localhost/api/admin/submissions?educationPathway=vocational&school=Contoh",
        ),
      );
      expect(response.status).toBe(200);
      expect(mocks.list).toHaveBeenCalledWith(
        expect.objectContaining({
          educationPathway: "vocational",
          school: "Contoh",
        }),
      );
    },
  );
  it.each([list, csv])(
    "rejects unknown direction without a database read",
    async (handler) => {
      expect(
        (
          await handler(
            new Request(
              "http://localhost/api/admin/submissions?educationPathway=bad",
            ),
          )
        ).status,
      ).toBe(400);
      expect(mocks.list).not.toHaveBeenCalled();
    },
  );
});
