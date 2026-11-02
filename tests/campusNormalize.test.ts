import { describe, expect, it } from "vitest";
import { mergeRows, nameKey, normalizeDegree, normalizeName } from "@/lib/campus/normalize";

describe("campus normalization", () => {
  it("maps degree spellings to D3/D4/S1 and drops the rest", () => {
    expect(normalizeDegree("D-III")).toBe("D3");
    expect(normalizeDegree("Diploma Tiga")).toBe("D3");
    expect(normalizeDegree("D-IV")).toBe("D4");
    expect(normalizeDegree("Sarjana Terapan")).toBe("D4");
    expect(normalizeDegree("Sarjana")).toBe("S1");
    expect(normalizeDegree("S1")).toBe("S1");
    for (const raw of ["S2", "", "Profesi", "D-II", "-"]) expect(normalizeDegree(raw)).toBeNull();
  });

  it("cleans names: trailing codes, all-caps to title case, acronyms kept", () => {
    expect(normalizeName("TEKNIK PERTAMBANGAN (NK)")).toBe("Teknik Pertambangan");
    expect(normalizeName("INSTITUT TEKNOLOGI BANDUNG (ITB)")).toBe("Institut Teknologi Bandung");
    expect(normalizeName("  Akademi Akuntansi (AKTAN)   Boekittinggi ")).toBe("Akademi Akuntansi (AKTAN) Boekittinggi");
    expect(normalizeName("UPN VETERAN JAKARTA")).toBe("UPN Veteran Jakarta");
    expect(normalizeName("TEKNIK MESIN DAN MANUFAKTUR")).toBe("Teknik Mesin dan Manufaktur");
    expect(normalizeName("Teknik Informatika")).toBe("Teknik Informatika");
  });

  it("builds case- and punctuation-insensitive keys", () => {
    expect(nameKey("Teknika ")).toBe(nameKey("TEKNIKA"));
    expect(nameKey("Teknik Mesin (PSDKU)")).toBe("teknik mesin");
    expect(nameKey("Bisnis-Digital")).toBe("bisnis digital");
  });

  it("merges duplicate campus/program/degree rows once, keeping SNPMB fields", () => {
    const catalog = mergeRows([
      { source: "joearton", campus: "UNIVERSITAS SRIWIJAYA", program: "TEKNIK PERTAMBANGAN", degree: "S1", lldikti: 2 },
      { source: "snpmb", campus: "Universitas Sriwijaya", program: "Teknik Pertambangan", degree: "S1", province: "Sumatera Selatan", quota2024: 70, applicants2024: 1924 },
      { source: "joearton", campus: "Universitas Sriwijaya", program: "Teknik Pertambangan", degree: "D3" },
      { source: "joearton", campus: "Akademi Maritim Cirebon", program: "Teknika", degree: "D3", lldikti: 4 },
    ], "2026-11-02");
    expect(catalog.campuses).toHaveLength(2);
    const unsri = catalog.campuses.find((c) => c.name === "Universitas Sriwijaya");
    expect(unsri).toMatchObject({ type: "Negeri", province: "Sumatera Selatan", lldikti: 2 });
    const s1 = catalog.programs.filter((p) => p.campus === unsri!.id && p.degree === "S1");
    expect(s1).toEqual([{ campus: unsri!.id, name: "Teknik Pertambangan", degree: "S1", quota2024: 70, applicants2024: 1924 }]);
    expect(catalog.programs).toHaveLength(3);
    expect(catalog.campuses.find((c) => c.name === "Akademi Maritim Cirebon")?.type).toBe("Swasta/Lainnya");
  });

  it("treats campus names differing only by spaces as one campus", () => {
    const catalog = mergeRows([
      { source: "joearton", campus: "Universitas Palangka Raya", program: "Kehutanan", degree: "S1" },
      { source: "snpmb", campus: "Universitas Palangkaraya", program: "Kehutanan", degree: "S1", province: "Kalimantan Tengah" },
    ], "2026-11-02");
    expect(catalog.campuses).toEqual([{ id: 0, name: "Universitas Palangkaraya", type: "Negeri", province: "Kalimantan Tengah" }]);
    expect(catalog.programs).toHaveLength(1);
  });
});
