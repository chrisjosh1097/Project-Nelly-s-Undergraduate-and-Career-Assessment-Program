import { describe, expect, it } from "vitest";
import { campusMajorMap } from "../data/campusMajorMap";
import { majorsById } from "../data/majors";
import { campusesForMajor, listProvinces, programsForRule, searchPrograms } from "@/lib/campus/catalog";

const JAVA = ["DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten"];

describe("campus major map", () => {
  it("covers every knowledge-base major", () => {
    const missing = Object.keys(majorsById).filter((id) => !campusMajorMap[id]);
    expect(missing).toEqual([]);
  });

  it("has no dead include phrase", () => {
    const dead: string[] = [];
    for (const [id, rule] of Object.entries(campusMajorMap)) {
      if ("none" in rule) continue;
      for (const phrase of rule.include) {
        if (programsForRule({ include: [phrase], exclude: rule.exclude }).length === 0) dead.push(`${id}: ${phrase}`);
      }
    }
    expect(dead).toEqual([]);
  });
});

describe("campusesForMajor", () => {
  it("returns vocational maritime programs with the maritime note", () => {
    const result = campusesForMajor("teknika_permesinan_kapal", { degreeTypes: ["D3", "D4"] });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.degree === "D3" || item.degree === "D4")).toBe(true);
    expect(result.maritimeNote).toBe(true);
  });

  it("puts vocational degrees first when the major allows them", () => {
    const result = campusesForMajor("keperawatan", { degreeTypes: ["D3", "D4", "S1"] });
    expect(["D3", "D4"]).toContain(result.items[0].degree);
  });

  it("puts preference matches first", () => {
    const [first] = campusesForMajor("teknik_sipil", { degreeTypes: ["S1"], preferences: ["PTN di Jawa"] }).items;
    expect(first.type).toBe("Negeri");
    expect(JAVA).toContain(first.province);
  });

  it("treats Yogyakarta as Java for the outside-Java preference", () => {
    const [first] = campusesForMajor("teknik_pertambangan", { degreeTypes: ["S1"], preferences: ["PTN luar Jawa"] }).items;
    expect(first.type).toBe("Negeri");
    expect(JAVA).not.toContain(first.province);
  });

  it("lists each campus once and caps the limit", () => {
    const result = campusesForMajor("informatika", { limit: 50 });
    expect(result.items).toHaveLength(12);
    expect(new Set(result.items.map((item) => item.campus)).size).toBe(12);
  });

  it("returns an empty result for an unknown major", () => {
    expect(campusesForMajor("unknown_major", {})).toEqual({ items: [], total: 0, maritimeNote: false });
  });

  it("builds PDDikti search links and never exposes score fields", () => {
    const { items } = campusesForMajor("teknik_pertambangan", { degreeTypes: ["S1"] });
    for (const item of items) {
      expect(item.pddiktiUrl).toBe(`https://pddikti.kemdiktisaintek.go.id/search/${encodeURIComponent(item.campus)}`);
      expect(Object.keys(item).filter((key) => /passing|min_score|max_score|classification/.test(key))).toEqual([]);
    }
  });
});

describe("searchPrograms", () => {
  it("handles regex-like input safely", () => {
    expect(() => searchPrograms({ text: "teknik (pertambangan" })).not.toThrow();
  });

  it("filters by degree and pages by 20", () => {
    const result = searchPrograms({ text: "pertambangan", degree: "D3" });
    expect(result.pageSize).toBe(20);
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((item) => item.degree === "D3")).toBe(true);
  });

  it("matches campus names too", () => {
    const result = searchPrograms({ text: "sriwijaya pertambangan" });
    expect(result.items.some((item) => item.campus === "Universitas Sriwijaya")).toBe(true);
  });

  it("lists provinces", () => {
    expect(listProvinces()).toContain("Jawa Barat");
  });
});
