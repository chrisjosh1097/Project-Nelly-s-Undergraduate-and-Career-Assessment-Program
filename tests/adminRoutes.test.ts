import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  list: vi.fn(),
  page: vi.fn(),
  detail: vi.fn(),
}));
vi.mock("@/lib/admin/session", () => ({
  verifyManualAdminRequest: mocks.verify,
}));
vi.mock("@/lib/submissions/store", () => ({
  listSubmissions: mocks.list,
  listAdminSubmissionPage: mocks.page,
  getSubmissionById: mocks.detail,
}));
import { GET as list } from "@/app/api/admin/submissions/route";
import { GET as csv } from "@/app/api/admin/export/route";
import { AuthError } from "@/lib/firebase/admin";
beforeEach(() => {
  mocks.verify.mockReset();
  mocks.list.mockReset().mockResolvedValue([]);
  mocks.page
    .mockReset()
    .mockResolvedValue({
      submissions: [],
      page: 1,
      pageSize: 50,
      total: 0,
      totalPages: 1,
      analytics: { total: 0 },
    });
  mocks.detail.mockReset().mockResolvedValue(null);
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
      expect(mocks.page).not.toHaveBeenCalled();
    },
  );
  it("returns page metadata and passes the same validated search/filter scope to list and CSV", async () => {
    const request = new Request(
      "http://localhost/api/admin/submissions?educationPathway=vocational&school=Contoh&search=Archive&page=2",
    );
    expect(await (await list(request)).json()).toMatchObject({
      pageSize: 50,
      total: 0,
    });
    await csv(request);
    const filters = {
      educationPathway: "vocational",
      school: "Contoh",
      search: "Archive",
    };
    expect(mocks.page).toHaveBeenCalledWith(filters, 2);
    expect(mocks.list).toHaveBeenCalledWith(filters);
  });
  it.each(["0", "-1", "1.5", "abc", "9007199254740992", "", "Infinity"])(
    "rejects invalid page %s without reading",
    async (page) => {
      expect(
        (
          await list(
            new Request("http://localhost/api/admin/submissions?page=" + page),
          )
        ).status,
      ).toBe(400);
      expect(mocks.page).not.toHaveBeenCalled();
      expect(mocks.list).not.toHaveBeenCalled();
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
      expect(mocks.page).not.toHaveBeenCalled();
    },
  );
  it("defaults to page 1 and prevents private data caching", async () => {
    const response = await list(
      new Request("http://localhost/api/admin/submissions"),
    );
    expect(mocks.page).toHaveBeenCalledWith({}, 1);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("protects lazy details before reading and validates missing, malformed and unknown IDs", async () => {
    const { GET } = await import("@/app/api/admin/submissions/[id]/route");
    const request = new Request(
      "http://localhost/api/admin/submissions/synthetic",
    );
    mocks.verify.mockImplementation(() => {
      throw new AuthError("Login admin diperlukan.");
    });
    expect(
      (await GET(request, { params: Promise.resolve({ id: "synthetic" }) }))
        .status,
    ).toBe(401);
    expect(mocks.detail).not.toHaveBeenCalled();
    mocks.verify.mockReset();
    for (const id of ["", "bad/id", "..", "%broken", "bad id"])
      expect(
        (await GET(request, { params: Promise.resolve({ id }) })).status,
      ).toBe(400);
    expect(mocks.detail).not.toHaveBeenCalled();
    expect(
      (await GET(request, { params: Promise.resolve({ id: "synthetic" }) }))
        .status,
    ).toBe(404);
    mocks.detail.mockResolvedValue({
      id: "synthetic",
      report: { narrative: { summary: "Private synthetic report" } },
    });
    const response = await GET(request, {
      params: Promise.resolve({ id: "synthetic" }),
    });
    expect(await response.json()).toMatchObject({
      submission: {
        id: "synthetic",
        report: { narrative: { summary: "Private synthetic report" } },
      },
    });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
