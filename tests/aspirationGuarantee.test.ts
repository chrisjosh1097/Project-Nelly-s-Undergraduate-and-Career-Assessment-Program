import { describe, expect, it } from "vitest";
import { majors } from "../data";
import { generateRecommendations, scoreMajor } from "@/lib/recommendation";
import {
  allAspirationTargetIds,
  matchExplicitAspirations,
  mentionsOfficialService,
  OFFICIAL_SERVICE_NOTE,
  softOnlyAspirationTerms,
} from "@/lib/recommendation/aspirationAliases";
import type { StudentAnswer } from "@/lib/types";
import { buildSubmission, techAnswer } from "./fixtures";
import { buildSubmissionPdfTextSnapshot } from "@/lib/pdf/report";

const answer = (patch: Partial<StudentAnswer>): StudentAnswer => ({ ...techAnswer, futureVision: "", ...patch });
const firstTier = (text: string) => matchExplicitAspirations(text).map((m) => m.tiers[0]);
const ids = (a: StudentAnswer) => generateRecommendations(a).recommendations.map((r) => r.majorId);

describe("explicit aspiration matcher", () => {
  it.each([
    ["Arsitek", [["arsitektur"]]],
    ["dokter gigi", [["kedokteran_gigi"]]],
    ["dokter, gigi", [["kedokteran"]]],
    ["bukan dokter, tapi arsitek", [["arsitektur"]]],
    ["tidak mau jadi dokter tapi arsitek", [["arsitektur"]]],
    ["penasaran dengan teknik komputer", [["teknik_komputer"]]],
    ["bps dengan jurusan statistika dan sains data", [["statistika"], ["data_science"]]],
    ["Perencanaan Wilayah dan Kota", [["perencanaan_wilayah_kota"]]],
    ["paham hukum newton", []],
    ["hakim", [["hukum"]]],
    ["mau sampai sukses", []],
    ["Ahli Gizi", [["gizi"]]],
    ["gizi", [["gizi"]]],
    ["", []],
  ])("%s", (text, expected) => {
    expect(firstTier(text)).toEqual(expected);
  });

  it("never treats broad careers as explicit", () => {
    for (const term of softOnlyAspirationTerms) expect(matchExplicitAspirations(term), term).toEqual([]);
    expect(matchExplicitAspirations("Data analyst atau software engineer").map((m) => m.phrase)).toEqual(["software engineer"]);
  });

  it("lets a literal catalog name win over a grouped alias, with the group as fallback", () => {
    expect(matchExplicitAspirations("teknik mesin")[0].tiers).toEqual([["teknik_mesin"], ["teknik_mesin", "teknik_mesin_terapan"]]);
  });

  it("only targets real majors", () => {
    const known = new Set(majors.map((m) => m.id));
    expect(allAspirationTargetIds().filter((id) => !known.has(id))).toEqual([]);
  });

  it("detects official-service dreams on token boundaries", () => {
    expect(mentionsOfficialService("TNI AU")).toBe(true);
    expect(mentionsOfficialService("masuk Akpol")).toBe(true);
    expect(mentionsOfficialService("kuliah di STAN")).toBe(true);
    expect(mentionsOfficialService("standar hidup tinggi")).toBe(false);
    expect(mentionsOfficialService("dokter")).toBe(false);
  });
});

describe("aspiration guarantee in generateRecommendations", () => {
  const lowAnswer = answer({
    educationPathway: "university",
    favoriteSubjects: ["Ekonomi", "Sosiologi"],
    dreamProfession: "",
  });

  it("keeps the report unchanged when nothing explicit is named", () => {
    const base = generateRecommendations(lowAnswer).recommendations;
    const soft = generateRecommendations({ ...lowAnswer, dreamProfession: "pengusaha sukses" }).recommendations;
    expect(soft.every((r) => !r.aspirationMatch)).toBe(true);
    expect(base.every((r) => r.aspirationMatch === undefined)).toBe(true);
  });

  it("guarantees a named major without changing its score or others' scores", () => {
    const base = generateRecommendations(lowAnswer).recommendations;
    expect(base.map((r) => r.majorId)).not.toContain("arsitektur");
    const withDream = generateRecommendations({ ...lowAnswer, dreamProfession: "arsitek" }).recommendations;
    expect(withDream).toHaveLength(10);
    const arch = withDream.find((r) => r.majorId === "arsitektur")!;
    expect(arch.aspirationMatch).toBe(true);
    // Sorted by score, ranks contiguous.
    expect(withDream.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (let i = 1; i < withDream.length; i++)
      expect(withDream[i - 1].overallFitScore).toBeGreaterThanOrEqual(withDream[i].overallFitScore);
    // The guarantee never changes any score: every result equals scoreMajor.
    const dreamAnswer = { ...lowAnswer, dreamProfession: "arsitek" };
    for (const r of withDream)
      expect(r.overallFitScore, r.majorId).toBe(scoreMajor(dreamAnswer, majors.find((m) => m.id === r.majorId)!).overallFitScore);
    // Exactly one baseline pick was displaced.
    expect(base.filter((r) => !withDream.some((w) => w.majorId === r.majorId))).toHaveLength(1);
  });

  it("protects at most 3 unique majors in mention order", () => {
    const recs = generateRecommendations({
      ...lowAnswer,
      dreamProfession: "arsitek, arsitek, dokter gigi, teknik komputer, statistika",
    }).recommendations;
    const protectedIds = recs.filter((r) => r.aspirationMatch).map((r) => r.majorId).sort();
    expect(protectedIds).toEqual(["arsitektur", "kedokteran_gigi", "teknik_komputer"]);
  });

  it("marks an already-included named major without displacing anything", () => {
    const base = generateRecommendations(techAnswer).recommendations;
    const named = base[4];
    const withDream = generateRecommendations({ ...techAnswer, dreamProfession: named.majorName }).recommendations;
    expect(withDream.find((r) => r.majorId === named.majorId)?.aspirationMatch).toBe(true);
    expect(withDream.filter((r) => r.aspirationMatch)).toHaveLength(1);
    expect(withDream).toHaveLength(10);
  });

  it("never overrides pathway eligibility; falls back to an eligible group target", () => {
    const vocational = { ...lowAnswer, educationPathway: "vocational" as const };
    expect(ids({ ...vocational, dreamProfession: "dokter" })).not.toContain("kedokteran");
    const mesin = generateRecommendations({ ...vocational, dreamProfession: "teknik mesin" }).recommendations;
    expect(mesin.find((r) => r.majorId === "teknik_mesin_terapan")?.aspirationMatch).toBe(true);
    expect(mesin.map((r) => r.majorId)).not.toContain("teknik_mesin");
    const exploring = generateRecommendations({ ...lowAnswer, educationPathway: "exploring", dreamProfession: "teknik mesin" }).recommendations;
    expect(exploring.find((r) => r.majorId === "teknik_mesin")?.aspirationMatch).toBe(true);
  });

  it("adds the official-service note at report level only", () => {
    const report = generateRecommendations({ ...lowAnswer, dreamProfession: "TNI AU" });
    expect(report.answerPatternNotes).toContain(OFFICIAL_SERVICE_NOTE);
    expect(report.recommendations.every((r) => !r.cautionNotes.includes(OFFICIAL_SERVICE_NOTE))).toBe(true);
    expect(generateRecommendations(lowAnswer).answerPatternNotes).not.toContain(OFFICIAL_SERVICE_NOTE);
  });
});

describe("aspiration badge in saved report outputs", () => {
  it("prints the badge in the PDF only for protected results; old reports stay unchanged", () => {
    const submission = buildSubmission({ ...techAnswer, dreamProfession: "" });
    const before = buildSubmissionPdfTextSnapshot(submission);
    expect(before).not.toContain("Disebut dalam cita-citamu");
    submission.report.recommendations[3].aspirationMatch = true;
    const after = buildSubmissionPdfTextSnapshot(submission);
    expect(after.match(/Disebut dalam cita-citamu/g)).toHaveLength(1);
  });
});
