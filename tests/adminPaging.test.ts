import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({
  rows: [] as Record<string, any>[],
  projections: [] as string[][],
  sizes: [] as number[],
}));
vi.mock("@/lib/firebase/admin", async (original) => ({
  ...(await original<typeof import("@/lib/firebase/admin")>()),
  getAdminDb: () => ({
    collection: () => {
      let offset = 0,
        size = Infinity,
        fields: string[] | undefined;
      const query = {
        orderBy: () => query,
        select: (...values: string[]) => {
          fields = values;
          db.projections.push(values);
          return query;
        },
        limit: (value: number) => {
          size = value;
          return query;
        },
        startAfter: (doc: { index: number }) => {
          offset = doc.index + 1;
          return query;
        },
        get: async () => {
          const docs = db.rows.slice(offset, offset + size).map((row, i) => ({
            id: String(offset + i),
            index: offset + i,
            data: () => {
              if (!fields) return row;
              const projected: Record<string, any> = {};
              for (const field of fields) {
                const path = field.split(".");
                if (
                  path.reduce((value, key) => value?.[key], row) === undefined
                )
                  continue;
                let source: any = row,
                  target = projected;
                for (const key of path.slice(0, -1)) {
                  source = source?.[key];
                  target = target[key] ??= {};
                }
                target[path.at(-1)!] = source?.[path.at(-1)!];
              }
              return projected;
            },
          }));
          db.sizes.push(docs.length);
          return { docs };
        },
      };
      return query;
    },
  }),
}));
import * as store from "@/lib/submissions/store";
import { buildSubmission, techAnswer } from "./fixtures";
import { serializeSubmissionsCsv } from "@/lib/submissions/csv";
beforeEach(() => {
  db.rows = [];
  db.projections = [];
  db.sizes = [];
});
function seed(count: number) {
  const row = buildSubmission({
    ...techAnswer,
    fullName: "Synthetic Student",
    email: "synthetic@example.test",
    educationPathway: "vocational",
  });
  db.rows = Array.from({ length: count }, (_, index) => ({
    ...row,
    fullName: `Synthetic Student ${index}`,
  }));
}
describe("all-record admin summaries", () => {
  it("returns 50/50/21 rows and matching analytics for 121 matches without full reports", async () => {
    seed(121);
    const pages = await Promise.all(
      [1, 2, 3].map((page) => store.listAdminSubmissionPage({}, page)),
    );
    expect(pages.map((p) => p.submissions.length)).toEqual([50, 50, 21]);
    expect(pages[2]).toMatchObject({
      pageSize: 50,
      page: 3,
      total: 121,
      totalPages: 3,
      analytics: { total: 121, schools: 1 },
    });
    expect(pages[0].submissions[0]).not.toHaveProperty("report");
    expect(pages[0].submissions[0]).not.toHaveProperty("answers");
    expect(pages[0].submissions[0].topRecommendation?.majorName).toBeTruthy();
    expect(db.projections.length).toBeGreaterThan(0);
    expect(db.projections.flat()).not.toContain("report");
    expect(db.sizes.every((size) => size <= 200)).toBe(true);
  });
  it("finds and exports a case-insensitive match beyond the old latest-500 limit", async () => {
    seed(621);
    db.rows[620] = { ...db.rows[620], fullName: "Unique Archive Student" };
    const result = await store.listAdminSubmissionPage(
      { search: "ARCHIVE" },
      1,
    );
    expect(db.sizes).toEqual([200, 200, 200, 21]);
    expect(result.total).toBe(1);
    expect(result.submissions[0].fullName).toBe("Unique Archive Student");
    const csv = serializeSubmissionsCsv(
      await store.listSubmissions({ search: "ARCHIVE" }),
    );
    expect(csv).toContain('"Unique Archive Student"');
    expect(csv).not.toContain('"Synthetic Student 0"');
  });
  it("exports every matching record rather than the current 50-row page", async () => {
    seed(621);
    const csv = serializeSubmissionsCsv(
      await store.listSubmissions({ school: "Contoh", search: "synthetic" }),
    );
    expect(csv.split("\n")).toHaveLength(622);
  });
  it("clamps pages after deletion and keeps the last nonempty page", async () => {
    seed(51);
    expect(await store.listAdminSubmissionPage({}, 3)).toMatchObject({
      page: 2,
      totalPages: 2,
      submissions: [expect.objectContaining({ id: "50" })],
    });
    seed(0);
    expect(await store.listAdminSubmissionPage({}, 3)).toMatchObject({
      page: 1,
      total: 0,
      totalPages: 1,
      submissions: [],
    });
  });
  it("preserves legacy rows without a saved report or optional demographic fields", async () => {
    seed(1);
    delete db.rows[0].report;
    delete db.rows[0].answers;
    const result = await store.listAdminSubmissionPage(
      { educationPathway: "unrecorded" },
      1,
    );
    expect(result).toMatchObject({ total: 1, analytics: { fit: 0, ai: 0 } });
    expect(result.submissions[0].topRecommendation).toBeUndefined();
    expect(
      result.analytics.charts.find((chart) => chart.title === "Gender")?.rows,
    ).toEqual([{ label: "Belum tercatat", count: 1 }]);
  });
});
