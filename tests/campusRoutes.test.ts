import { describe, expect, it } from "vitest";
import { GET as major } from "@/app/api/campus/major/[majorId]/route";
import { GET as search } from "@/app/api/campus/search/route";
import { CAMPUS_SOURCE_LINE } from "@/lib/campus/catalog";

const callMajor = (id: string, query = "") =>
  major(new Request(`http://localhost/api/campus/major/${encodeURIComponent(id)}${query}`), {
    params: Promise.resolve({ majorId: id }),
  });
const callSearch = (query: string) => search(new Request(`http://localhost/api/campus/search${query}`));

describe("GET /api/campus/major/:majorId", () => {
  it("returns campuses for a known major with source and cache header", async () => {
    const response = await callMajor("teknika_permesinan_kapal", "?degree=D3&degree=D4&pref=PTN%20di%20Jawa");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(response.headers.get("Netlify-CDN-Cache-Control")).toBe("no-store");
    expect(response.headers.get("Netlify-Vary")).toBe("query");
    const body = await response.json();
    expect(body.source).toBe(CAMPUS_SOURCE_LINE);
    expect(body.maritimeNote).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((item: { degree: string }) => ["D3", "D4"].includes(item.degree))).toBe(true);
  });

  it("returns an empty list for an unknown but well-formed id", async () => {
    const response = await callMajor("unknown_major");
    expect(response.status).toBe(200);
    expect((await response.json()).items).toEqual([]);
  });

  it.each(["../etc", "Informatika", "a b", "x".repeat(65)])("rejects malformed id %s", async (id) => {
    const response = await callMajor(id);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Permintaan tidak valid." });
  });

  it("rejects unknown degree values", async () => {
    expect((await callMajor("informatika", "?degree=S3")).status).toBe(400);
  });
});

describe("GET /api/campus/search", () => {
  it("returns a page with provinces, source and cache header", async () => {
    const response = await callSearch("?q=pertambangan&degree=D3&page=1");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(response.headers.get("Netlify-CDN-Cache-Control")).toBe("no-store");
    expect(response.headers.get("Netlify-Vary")).toBe("query");
    const body = await response.json();
    expect(body.source).toBe(CAMPUS_SOURCE_LINE);
    expect(body.pageSize).toBe(20);
    expect(body.provinces).toContain("Jawa Barat");
    expect(body.items.every((item: { degree: string }) => item.degree === "D3")).toBe(true);
  });

  it("treats whitespace-only q as empty", async () => {
    const response = await callSearch("?q=%20%20%20");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(1);
    expect(body.total).toBeGreaterThan(1000);
  });

  it.each([
    `?q=${"a".repeat(61)}`,
    "?page=0",
    "?page=501",
    "?page=abc",
    "?degree=S2",
    "?type=Asing",
  ])("rejects %s", async (query) => {
    const response = await callSearch(query);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Permintaan tidak valid." });
  });
});
