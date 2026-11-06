import { describe, expect, it } from "vitest";
import { aiPrompts, promptCategories, PROMPT_ENDING, resultPromptIds } from "../data/aiPrompts";
import { fillPrompt, promptBankHref, promptValuesFor, resultPrompts } from "@/lib/prompts/fill";
import { buildSubmissionPdfTextSnapshot } from "@/lib/pdf/report";
import { buildSubmission, techAnswer } from "./fixtures";

describe("prompt bank data", () => {
  it("has 15 unique prompts in known categories, ending with the safety line", () => {
    expect(aiPrompts).toHaveLength(15);
    expect(new Set(aiPrompts.map(p => p.id)).size).toBe(15);
    const cats = new Set(promptCategories.map(c => c.id));
    for (const p of aiPrompts) {
      expect(cats.has(p.category), p.id).toBe(true);
      expect(fillPrompt(p, {}).endsWith("Kalau tidak yakin, bilang tidak yakin dan sarankan sumber resmi untuk dicek."), p.id).toBe(true);
      expect(p.template, p.id).not.toMatch(/\{(?!jurusanSekolah\}|aktivitas\}|jurusanKuliah\}|karier\})/);
      expect(p.template, p.id).not.toMatch(/gaji|passing grade|peluang diterima|finansial/i);
    }
    for (const c of promptCategories) expect(aiPrompts.some(p => p.category === c.id), c.id).toBe(true);
    expect(PROMPT_ENDING).toMatch(/Jangan menyebut angka gaji/);
  });
  it("keeps the company placeholder and the four reviewer prompts", () => {
    expect(aiPrompts.find(p => p.id === "hari-pertama-magang")!.template).toContain("[Perusahaan/Institusi]");
    expect(resultPrompts().map(p => p.id)).toEqual([...resultPromptIds]);
  });
});

describe("fillPrompt", () => {
  it("fills placeholders and keeps visible brackets when empty", () => {
    const p = aiPrompts.find(x => x.id === "connect-the-dots")!;
    const filled = fillPrompt(p, { jurusanSekolah: "IPA", aktivitas: "Coding/teknologi", jurusanKuliah: "Informatika" });
    expect(filled).toContain("Aku siswa IPA.");
    expect(filled).toContain("ingin kuliah Informatika");
    expect(filled).not.toMatch(/\{\w+\}/);
    expect(fillPrompt(p, { jurusanSekolah: "  " })).toContain("Aku siswa [jurusan sekolahmu].");
  });
  it("trims, collapses whitespace and caps field length", () => {
    const p = aiPrompts.find(x => x.id === "mitos-industri")!;
    const filled = fillPrompt(p, { karier: `  Data\n  Analyst ${"x".repeat(200)}` });
    expect(filled).toContain("dunia Data Analyst x");
    expect(filled).not.toContain("x".repeat(80));
  });
});

describe("promptValuesFor", () => {
  it("uses niche career first, max 3 activities, and the typed 'Lainnya' school major", () => {
    const v = promptValuesFor(
      { currentSchoolMajor: "Lainnya", currentSchoolMajorOther: "Keagamaan", favoriteActivities: ["A", "B", "Lainnya", "C", "D"] },
      { majorName: "Informatika", nicheCareerPaths: ["Niche"], relatedCareers: ["Umum"] });
    expect(v).toEqual({ jurusanSekolah: "Keagamaan", aktivitas: "A, B, C", jurusanKuliah: "Informatika", karier: "Niche" });
  });
  it("works for legacy reports without niche paths or other text", () => {
    const v = promptValuesFor({ currentSchoolMajor: "Lainnya", favoriteActivities: [] } as never,
      { majorName: "Hukum", relatedCareers: ["Advokat"] } as never);
    expect(v.karier).toBe("Advokat");
    expect(v.jurusanSekolah).toBe("");
    expect(fillPrompt(resultPrompts()[1], v)).toContain("[jurusan sekolahmu]");
  });
});

describe("promptBankHref", () => {
  it("passes only non-identifying fields", () => {
    const href = promptBankHref({ jurusanSekolah: "IPA", aktivitas: "rahasia", jurusanKuliah: "Teknik Sipil", karier: "" });
    expect(href).toBe("/prompt?jurusanSekolah=IPA&jurusanKuliah=Teknik+Sipil");
    expect(promptBankHref({})).toBe("/prompt");
  });
});

describe("PDF", () => {
  it("does not include AI prompts (user decision)", () => {
    const text = buildSubmissionPdfTextSnapshot(buildSubmission(techAnswer));
    expect(text).not.toContain("Tanya AI");
    for (const p of aiPrompts) expect(text).not.toContain(p.template.slice(0, 40));
  });
});
