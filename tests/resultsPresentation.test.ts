import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RecommendationResult, Submission } from "@/lib/types";
import { ResultsView } from "@/components/results/ResultsView";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { aspirationSpotlightFor, gapText, resultGroupsFor } from "@/components/results/resultPresentation";

// Rendering has no auth/network side effects; downloads remain user-triggered.
vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ getToken: async () => "synthetic-token" }),
}));
afterEach(() => vi.unstubAllGlobals());

function syntheticSubmission(): Submission {
  const top: RecommendationResult = {
    rank: 7, majorId: "synthetic-engineering", majorName: "Teknik Sintetis",
    cluster: "Teknik", degreeTypes: ["S1"],
    careerDirection: "Eksplorasi proyek mekanik sintetis.",
    relatedCareers: ["Pendukung proyek teknik"],
    overallFitScore: 65, fitLabel: "Cukup Cocok",
    aiFutureResilienceScore: 78, aiFutureResilienceLabel: "Sedang",
    reasonBullets: ["Periksa tuntutan kurikulum sebelum memilih."],
    skillStrengthMatches: ["Pemecahan masalah"], skillGaps: ["Latih membaca gambar teknik."],
    recommendedNextSteps: ["Buat model mekanik dari bahan sederhana."],
    cautionNotes: ["Bandingkan biaya praktik."],
    careerPathwayAdvice: ["Diskusikan proyek dengan mentor."],
    careerCautions: ["Periksa persyaratan resmi profesi dan kerja di negara tujuan."],
    scoringBreakdown: {
      interestScore: 70, skillScore: 60, subjectScore: 65,
      workStyleScore: 50, problemAreaScore: 40, constraintFitScore: 80,
      matchedInterests: ["Merakit"], matchedSkills: ["Pemecahan masalah"],
      matchedSubjects: ["Fisika"], matchedProblemAreas: ["Teknologi"],
      preferenceNotes: ["Biaya perlu dibandingkan."],
    },
  };
  return {
    id: "synthetic-results", fullName: "Synthetic Student", email: "synthetic@example.test",
    school: "Synthetic School", className: "XII", status: "completed",
    createdAt: "2026-10-30T00:00:00Z", updatedAt: "2026-10-30T00:00:00Z",
    answers: {
      fullName: "Synthetic Student", email: "synthetic@example.test", gender: "", age: "17",
      school: "Synthetic School", className: "XII", currentSchoolMajor: "IPA",
      educationPathway: "university", favoriteSubjects: ["Fisika"], favoriteSubjectsOther: "",
      favoriteActivities: ["Merakit"], skillStrengths: ["Pemecahan masalah"],
      workStyle: "Praktik langsung", problemAreas: ["Teknologi"],
      collegePathPreferences: [], collegePathPreferenceOther: "", personalConstraints: [],
      techComfort: "Biasa saja", dreamProfession: "Mengeksplorasi engineering di Jepang.",
      futureVision: "Membandingkan bidang maritim dan pertambangan.",
    },
    report: {
      generatedAt: "2026-10-30T00:00:00Z", scoringVersion: "synthetic-v1", narrativeVersion: "synthetic-v1",
      topRecommendation: top,
      recommendations: [top, { ...structuredClone(top), rank: 2, majorId: "synthetic-alternative", majorName: "Alternatif Sintetis", overallFitScore: 48, fitLabel: "Perlu Dipertimbangkan Lagi" }],
      narrative: {
        source: "heuristic", summary: "  Eksplorasi engineering di Jepang perlu diuji melalui proyek dan kurikulum.  ",
        studentStrengths: ["Pilihan fisika mendukung eksplorasi awal."], recommendationReasons: {},
      },
    },
  };
}
function render(submission = syntheticSubmission(), compact = false) {
  return renderToStaticMarkup(createElement(ResultsView, { submission, compact }));
}
function freezeDeep(value: unknown) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
}

describe("anti-rank framing (display only)", () => {
  const base = syntheticSubmission().report.recommendations[0];
  const rec = (id: string, score: number, extra: Partial<RecommendationResult> = {}): RecommendationResult =>
    ({ ...structuredClone(base), majorId: id, majorName: "Jurusan " + id, overallFitScore: score, ...extra });
  it("groups alternatives by distance from the best score, keeping stored order inside groups", () => {
    const groups = resultGroupsFor([rec("a", 78), rec("b", 80), rec("c", 70), rec("d", 60)], 80);
    expect(groups.map(g => [g.id, g.items.map(r => r.majorId)])).toEqual([
      ["dekat", ["a", "b"]], ["jelajah", ["c"]], ["tambahan", ["d"]],
    ]);
  });
  it("describes gaps and aspiration distance without probability claims", () => {
    expect(gapText(rec("a", 80), 80)).toBe("Skor paling dekat");
    expect(gapText(rec("a", 76), 80)).toBe("Selisih 4 poin");
    expect(aspirationSpotlightFor(rec("a", 77), 80)).toMatch(/selisih 3 poin.*sama-sama cocok/i);
    expect(aspirationSpotlightFor(rec("a", 60, { skillGaps: ["Latih gambar teknik"] }), 80)).toContain("Mulai dari: Latih gambar teknik");
    expect(aspirationSpotlightFor(rec("a", 60), 80)).not.toMatch(/%|peluang/);
  });
  it("spotlights a named aspiration at a low position above the summary and leaves stored data untouched", () => {
    const input = syntheticSubmission();
    const top = input.report.recommendations[0];
    input.report.recommendations = [top, ...Array.from({ length: 7 }, (_, i) => rec("alt" + i, 64 - i)),
      rec("arsitektur", 55, { majorName: "Arsitektur", aspirationMatch: true, rank: 9 })];
    const original = structuredClone(input);
    freezeDeep(input);
    const html = render(input);
    expect(html).toContain("Cita-citamu ada di hasil ini");
    expect(html.indexOf("Cita-citamu ada di hasil ini")).toBeLessThan(html.indexOf("Ringkasan arahmu"));
    expect(html).toContain('href="#arah-arsitektur"');
    expect(html).toContain("Selisih 10 poin");
    expect(html).toContain("Juga dekat dengan jawabanmu");
    expect(input).toEqual(original);
  });
  it("falls back to stored order without gap labels when a legacy report is not score-ordered", () => {
    const input = syntheticSubmission();
    const top = input.report.recommendations[0];
    input.report.recommendations = [top, rec("low", 40), rec("high", 90, { aspirationMatch: true })];
    const html = render(input);
    expect(html).not.toContain("Selisih");
    expect(html).not.toContain("Skor paling dekat");
    expect(html).not.toContain("Juga dekat dengan jawabanmu");
    expect(html.indexOf("Jurusan low")).toBeLessThan(html.indexOf('id="arah-high"'));
    expect(html).toContain("Cita-citamu ada di hasil ini");
  });
  it("shows no spotlight without an aspiration match", () => {
    expect(render()).not.toContain("Cita-citamu ada di hasil ini");
  });
});

describe("saved results presentation", () => {
  it("renders the meaningful saved summary and aspirations before the evidence section", () => {
    const html = render();
    expect(html).toContain("Eksplorasi engineering di Jepang perlu diuji melalui proyek dan kurikulum.");
    expect(html.indexOf("Mengeksplorasi engineering di Jepang.")).toBeLessThan(html.indexOf("Bukti dari jawabanmu"));
    expect(html).toContain("Membandingkan bidang maritim dan pertambangan.");
  });
  it("makes moderate and weak fit explicit while preserving saved labels", () => {
    const html = render();
    expect(html).toContain("Kecocokan sedang");
    expect(html).toContain("Alternatif eksplorasi");
    expect(html).not.toContain("Kenapa cocok");
    const input = syntheticSubmission();
    input.report.topRecommendation.fitLabel = "Sangat Cocok";
    const conflict = render(input);
    expect(conflict).toContain("Label laporan tersimpan: Sangat Cocok");
    expect(conflict).toContain("Kecocokan sedang");
  });
  it("shows actual component evidence and practical steps without inventing a missing aspiration bonus", () => {
    const html = render();
    expect(html).toContain("Merakit");
    expect(html).toContain("Fisika");
    expect(html).toContain("Biaya perlu dibandingkan.");
    expect(html).toContain("Pilihanmu: Praktik langsung");
    expect(html).toContain("Buat model mekanik dari bahan sederhana.");
    expect(html).toContain("Periksa persyaratan resmi profesi dan kerja di negara tujuan.");
    expect(html).not.toContain("0 poin");
  });
  it("labels the stored top as closest without a rank number and does not repeat its career direction", () => {
    const html = render();
    expect(html).toContain("Paling dekat dengan jawabanmu");
    expect(html).not.toContain("Rekomendasi utama");
    expect(html).not.toMatch(/>0[1-9]</);
    // The alternative has its own direction; give it a different saved value.
    const input = syntheticSubmission();
    input.report.recommendations[1].careerDirection = "Arah alternatif tersimpan.";
    expect(render(input).split("Eksplorasi proyek mekanik sintetis.")).toHaveLength(2);
  });
  it("keeps saved scores/ranks/order immutable and introduces no fetch on render", () => {
    const input = syntheticSubmission();
    const original = structuredClone(input);
    freezeDeep(input);
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const html = render(input);
    expect(input).toEqual(original);
    expect(html.indexOf("Teknik Sintetis")).toBeLessThan(html.indexOf("Alternatif Sintetis"));
    expect(fetch).not.toHaveBeenCalled();
    expect(html).toContain("65");
  });
  it("keeps downloads in normal mode and suppresses both in compact admin mode", () => {
    expect(render()).toContain("Laporan PDF");
    expect(render()).toContain("Kartu Instagram");
    const html = render(syntheticSubmission(), true);
    expect(html).not.toContain("Laporan PDF");
    expect(html).not.toContain("Kartu Instagram");
    expect(html).toContain("Bukti dari jawabanmu");
  });
  it("handles legacy optional fields, whitespace-only lists, and missing summary without empty headings", () => {
    const input = syntheticSubmission();
    delete input.report.narrative;
    delete input.answers.educationPathway;
    input.answers.dreamProfession = " "; input.answers.futureVision = "";
    for (const r of input.report.recommendations) {
      delete r.degreeTypes;
      r.skillGaps = [" "]; r.careerPathwayAdvice = []; r.recommendedNextSteps = [];
    }
    const html = render(input);
    expect(html).toContain("Belum tercatat");
    expect(html).not.toContain("Aspirasi yang kamu tulis");
    expect(html).not.toContain("Skill yang perlu ditingkatkan");
    expect(html).not.toContain("Langkah berikutnya");
    expect(html).not.toContain("undefined");
    expect(html).not.toContain("NaN");
    expect(html).toContain("Ringkasan laporan");
  });
  it("renders a saved summary as text rather than executable markup", () => {
    const input = syntheticSubmission();
    input.report.narrative!.summary = '<script>alert("synthetic")</script>';
    const html = render(input);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
  it("falls back from a whitespace-only summary and omits empty aspiration content", () => {
    const input = syntheticSubmission();
    input.report.narrative!.summary = " \n ";
    input.answers.dreamProfession = " "; input.answers.futureVision = "";
    const html = render(input);
    expect(html).toContain("Laporan tersimpan menempatkan Teknik Sintetis");
    expect(html).not.toContain("Aspirasi yang kamu tulis");
  });
  it("shows a present stored aspiration bonus once and preserves all longer action plans", () => {
    const input = syntheticSubmission();
    input.report.topRecommendation.scoringBreakdown.aspirationMajorBoost = 4;
    input.report.topRecommendation.scoringBreakdown.matchedAspirationMajorSignals = ["engineering"];
    input.report.topRecommendation.recommendedNextSteps = ["Satu", "Dua", "Tiga", "Empat", "Lima"];
    const html = render(input);
    expect(html.split("4 poin")).toHaveLength(2);
    expect(html).toContain("Sinyal aspirasi tersimpan: engineering");
    expect(html).toContain("Langkah lainnya");
    expect(html).toContain("Empat"); expect(html).toContain("Lima");
    expect(input.report.topRecommendation.overallFitScore).toBe(65);
  });
  it("omits a vacant saved-explanation disclosure when its optional and list content is empty", () => {
    const r = syntheticSubmission().report.topRecommendation;
    r.reasonBullets = []; r.relatedCareers = []; r.skillStrengthMatches = [];
    delete r.nicheCareerPaths; delete r.aspirationReflection; delete r.careerPersonalizationReason;
    const html = renderToStaticMarkup(createElement(RecommendationCard, { recommendation: r, expanded: true }));
    expect(html).not.toContain("Penjelasan laporan tersimpan");
    expect(html).not.toContain("Dasar pertimbangan");
  });
});

describe("result evidence and fit interpretation", () => {
  it.each([
    [57, "Alternatif eksplorasi"], [58, "Kecocokan sedang"],
    [65, "Kecocokan sedang"], [69, "Kecocokan sedang"],
    [70, "Cocok"], [81, "Cocok"], [82, "Sangat cocok"],
  ])("interprets saved score %s without changing it", async (score, label) => {
    const { fitContextFor } = await import("@/components/results/resultPresentation");
    const r = syntheticSubmission().report.topRecommendation;
    r.overallFitScore = score as number;
    expect(fitContextFor(r).interpretation).toBe(label);
    expect(r.overallFitScore).toBe(score);
  });
  it("keeps raw out-of-range scores and marks invalid scores as unavailable", async () => {
    const { scoreText, fitContextFor } = await import("@/components/results/resultPresentation");
    expect(scoreText(105)).toBe("105/100");
    expect(scoreText(0)).toBe("0/100");
    expect(scoreText(NaN)).toBe("Belum tercatat");
    expect(scoreText(undefined)).toBe("Belum tercatat");
    expect(fitContextFor({ overallFitScore: 105, fitLabel: "Cocok" }).interpretation).toBe("Skor perlu diperiksa");
  });
  it("exposes the six stored components with real matches and selected work-style context", async () => {
    const { componentEvidenceFor } = await import("@/components/results/resultPresentation");
    const r = syntheticSubmission().report.topRecommendation;
    const before = structuredClone(r); freezeDeep(r);
    expect(componentEvidenceFor(r, "Praktik langsung")).toEqual([
      { label: "Minat", score: 70, evidence: ["Merakit"] },
      { label: "Skill", score: 60, evidence: ["Pemecahan masalah"] },
      { label: "Mata pelajaran", score: 65, evidence: ["Fisika"] },
      { label: "Gaya kerja", score: 50, evidence: ["Pilihanmu: Praktik langsung"] },
      { label: "Area masalah", score: 40, evidence: ["Teknologi"] },
      { label: "Pertimbangan pribadi", score: 80, evidence: ["Biaya perlu dibandingkan."] },
    ]);
    expect(r).toEqual(before);
  });
  it("does not invent matched evidence, and uses a real gap to preview a weak alternative", async () => {
    const { componentEvidenceFor, comparisonSignalFor } = await import("@/components/results/resultPresentation");
    const r = syntheticSubmission().report.recommendations[1];
    r.scoringBreakdown.matchedSkills = [];
    r.scoringBreakdown.matchedSubjects = [];
    expect(componentEvidenceFor(r).find(row => row.label === "Skill")?.evidence).toEqual([]);
    expect(comparisonSignalFor(r)).toBe("Perlu dilatih: Latih membaca gambar teknik.");
  });
  it("deduplicates and trims display lines without changing stored arrays", async () => {
    const { cleanLines } = await import("@/components/results/resultPresentation");
    const lines = Object.freeze([" ", " Langkah nyata. ", "Langkah nyata.", "Langkah lain."]);
    expect(cleanLines(lines)).toEqual(["Langkah nyata.", "Langkah lain."]);
    expect(lines[1]).toBe(" Langkah nyata. ");
  });
});
