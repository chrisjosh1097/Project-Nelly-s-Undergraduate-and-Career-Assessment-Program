import { describe, expect, it } from "vitest";
import { majors } from "../data";
import { generateRecommendations, scoreMajor } from "@/lib/recommendation/scoring";
import { buildHeuristicNarrativeReport } from "@/lib/recommendation/narrative";
import { technicalAspirationAnswer as answer } from "./narrativeFixtures";

describe("honest recommendation ordering and explanations", () => {
  it("sorts the selected sparse-match pool without changing membership, scores or degrees", () => {
    const report = generateRecommendations(answer);
    expect(report.recommendations.map(r => [r.majorId, r.overallFitScore])).toEqual([
      ["teknik_mesin_terapan", 71], ["teknika_permesinan_kapal", 69],
      ["industrial_automation_applied", 65], ["teknik_elektronika", 58],
      ["teknik_otomotif", 56], ["teknik_pendingin_tata_udara", 56], ["vokasi_teknik", 56],
      ["teknik_geomatika_gis", 53], ["network_cloud_operations", 52],
      ["desain_komunikasi_visual", 39],
    ]);
    expect(report.recommendations.map(r => r.rank)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(report.topRecommendation).toEqual(report.recommendations[0]);
    for (const r of report.recommendations) {
      expect(r.degreeTypes?.length).toBeGreaterThan(0);
      expect(r.degreeTypes?.every(d => ["D3", "D4"].includes(d))).toBe(true);
    }
  });

  it.each([[], ["Menulis/berbicara"], answer.favoriteActivities, ["Coding/teknologi", "Menghitung/analisis data"]].map(activities => [activities]))(
    "keeps deterministic ordering with varying match density: %j", favoriteActivities => {
      const report = generateRecommendations({ ...answer, favoriteActivities });
      const flex: Record<string, number> = { Tinggi: 3, Sedang: 2, Rendah: 1 };
      const sorted = [...report.recommendations].sort((a,b) =>
        b.overallFitScore-a.overallFitScore || b.aiFutureResilienceScore-a.aiFutureResilienceScore ||
        (flex[majors.find(m=>m.id===b.majorId)!.jobMarketFlexibility] ?? 1) - (flex[majors.find(m=>m.id===a.majorId)!.jobMarketFlexibility] ?? 1) ||
        a.majorName.localeCompare(b.majorName, "id-ID"));
      expect(report.recommendations).toEqual(sorted);
    },
  );

  it("describes weak fit as exploration and does not invent matched skills or subjects", async () => {
    const report = await buildHeuristicNarrativeReport(answer, generateRecommendations(answer));
    const weak = report.recommendations.find(r => r.majorId === "desain_komunikasi_visual")!;
    expect(weak.fitLabel).toBe("Perlu Dipertimbangkan Lagi");
    expect(weak.reasonBullets[0]).toMatch(/alternatif eksplorasi/i);
    expect(weak.reasonBullets.join(" ")).not.toMatch(/cocok karena|pelajaran pilihanmu.*relevan|kekuatan kamu di Leadership, Logika/);
    expect(weak.careerPersonalizationReason).toMatch(/terbatas|perlu diuji/i);
    expect(weak.careerCautions?.join(" ")).toMatch(/tidak otomatis|bukan jalur langsung/i);
  });

  it("qualifies a moderate fit instead of calling it strongly suitable", () => {
    const moderate = generateRecommendations(answer).recommendations.find(r => r.majorId === "teknik_elektronika")!;
    expect(moderate.reasonBullets[0]).toMatch(/cukup|sebagian/i);
  });

  it("reflects technical and geographic ambitions with practical steps and cautious career claims", async () => {
    const report = await buildHeuristicNarrativeReport(answer, generateRecommendations(answer));
    const top = report.topRecommendation;
    expect(top.aspirationReflection).toMatch(/Jepang/);
    expect(top.aspirationReflection).toMatch(/maritim/);
    expect(top.aspirationReflection).toMatch(/pertambangan/);
    expect(top.aspirationReflection).not.toMatch(/isu sosial/);
    expect(top.careerPathwayAdvice?.join(" ")).toMatch(/proyek|lab|magang/);
    expect(top.careerPathwayAdvice?.join(" ")).toMatch(/bahasa|persyaratan/);
    expect(top.careerCautions?.join(" ")).toMatch(/resmi/);
  });

  it("recognizes whitespace-separated overseas ambitions without inventing mining interests", async () => {
    const input = { ...answer, dreamProfession: "Engineering di luar\n negeri", futureVision: "" };
    const report = await buildHeuristicNarrativeReport(input, generateRecommendations(input));
    expect(report.topRecommendation.aspirationReflection).toMatch(/luar negeri/);
    expect(report.topRecommendation.careerPathwayAdvice?.join(" ")).not.toMatch(/maritim|pertambangan/);
  });

  it("does not reorder or rescore a saved historical report during narrative application", async () => {
    const saved = generateRecommendations(answer);
    saved.recommendations = [...saved.recommendations].reverse().map((r,i)=>({...r,rank:i+1}));
    saved.topRecommendation = saved.recommendations[0];
    const original = structuredClone(saved);
    const result = await buildHeuristicNarrativeReport(answer, saved);
    expect(result.recommendations.map(r=>[r.majorId,r.rank,r.overallFitScore,r.degreeTypes]))
      .toEqual(original.recommendations.map(r=>[r.majorId,r.rank,r.overallFitScore,r.degreeTypes]));
    expect(saved).toEqual(original);
  });

  it.each(["pengalaman", "memahami", "merencanakan"])("does not infer social/environment themes from %s", async word => {
    const input = { ...answer, dreamProfession: "", futureVision: `Saya ingin ${word} engineering di Jepang.` };
    const report = await buildHeuristicNarrativeReport(input, generateRecommendations(input));
    expect(report.topRecommendation.aspirationReflection).not.toMatch(/lingkungan|keberlanjutan|HAM|pendidikan|isu sosial/);
    expect(report.answerPatternNotes?.join(" ")).not.toMatch(/menyebut lingkungan/);
  });

  it("recognizes a technology cluster stored with its localized display label", async () => {
    const input = { ...answer, educationPathway: "exploring" as const, dreamProfession: "Membantu komunitas melalui teknologi", futureVision: "" };
    const result = scoreMajor(input, majors.find(m => m.id === "informatika")!, 1);
    const report = await buildHeuristicNarrativeReport(input, { ...generateRecommendations(input), recommendations: [result] });
    expect(result.cluster).toBe("Teknologi & Data");
    expect(report.topRecommendation.nicheCareerPaths).toContain("Civic Tech Product Analyst");
  });
});
