import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument, PDFPage } from "pdf-lib";
import {
  buildSubmissionPdfTextSnapshot,
  generateSubmissionPdf,
} from "@/lib/pdf/report";
import { buildSubmission, techAnswer } from "./fixtures";

afterEach(() => vi.restoreAllMocks());
function syntheticPdfSubmission() {
  const value = buildSubmission({ ...techAnswer, fullName: "Synthetic Export Student",
    email: "synthetic-export@example.test", school: "Synthetic School",
    dreamProfession: "UNIQUE_DREAM_ANSWER", futureVision: "UNIQUE_FUTURE_ANSWER" });
  // Legacy-shaped report: older saved records have no curated guidance fields.
  delete value.report.studentGuidance;
  value.report.recommendations.forEach(r => { delete r.actionGuidance; });
  delete value.report.topRecommendation.actionGuidance;
  const top = value.report.topRecommendation;
  Object.assign(top, { rank: 7, majorName: "Synthetic Main Program", overallFitScore: 65, fitLabel: "Cukup Cocok",
    careerDirection: "UNIQUE_DIRECTION", personalizedCareerDirection: undefined,
    reasonBullets: ["UNIQUE_REASON_ALPHA", "UNIQUE_REASON_BETA"],
    recommendedNextSteps: ["UNIQUE_ACTION_ALPHA", "UNIQUE_ACTION_BETA"],
    careerPathwayAdvice: ["UNIQUE_ACTION_ALPHA", "UNIQUE_ROUTE_ADVICE"],
    cautionNotes: ["UNIQUE_CAUTION"], careerCautions: ["UNIQUE_CAREER_CAUTION"],
    aspirationReflection: "UNIQUE_ASPIRATION_REFLECTION", skillGaps: ["UNIQUE_SKILL_GAP"] });
  value.report.narrative = { source: "heuristic", summary: "UNIQUE_SAVED_SUMMARY", recommendationReasons: {} };
  value.report.recommendations.slice(1).forEach((r, i) => {
    r.majorName = `Synthetic Alternative ${i}`; r.rank = i === 0 ? 9 : i + 1;
    r.careerPathwayAdvice = [`UNIQUE_ALTERNATIVE_ADVICE_${i}`];
  });
  return value;
}

function realisticPdfSubmission(variation: number) {
  const value = syntheticPdfSubmission();
  value.answers.educationPathway = "university";
  value.answers.dreamProfession = "Mengeksplorasi rekayasa dan pekerjaan teknik di luar negeri dengan memeriksa kebutuhan pendidikan serta kemampuan bahasa.";
  value.answers.futureVision = "Membandingkan pekerjaan proyek maritim dan pertambangan melalui pengalaman praktik, diskusi dengan mentor, dan informasi resmi dari program yang dituju.";
  value.report.narrative = {
    source: "heuristic", recommendationReasons: {},
    summary: "Minat fisika dan pengalaman praktik menjadi bahan eksplorasi awal. Bandingkan tuntutan kurikulum, proyek, biaya belajar, serta kebutuhan kompetensi sebelum memilih jalur pendidikan dan pekerjaan yang dituju.",
    studentStrengths: [
      "Ketertarikan pada fisika memberi bahan untuk mencoba persoalan mekanik dan menjelaskan hasil pengamatan.",
      "Pengalaman kerja praktik dapat dikembangkan melalui proyek kecil, dokumentasi, dan umpan balik mentor.",
      "Komunikasi membantu diskusi dalam kelompok dan penyampaian hasil kerja secara runtut dan terukur.",
    ],
  };
  value.report.recommendations.forEach((r, i) => {
    r.rank = i + 1; r.majorName = `Program Rekayasa Sintetis ${i + 1}`; r.degreeTypes = ["S1"];
    r.overallFitScore = 65 - i * 2;
    r.fitLabel = r.overallFitScore >= 58 ? "Cukup Cocok" : "Perlu Dipertimbangkan Lagi";
    r.personalizedCareerDirection = `Eksplorasi perencanaan, dokumentasi, dan pemeliharaan proyek bidang ${i + 1} melalui kurikulum serta pengalaman praktik yang relevan.`;
    r.nicheCareerPaths = [`Pendukung proyek rekayasa bidang ${i + 1}`, `Analis operasional bidang ${i + 1}`, `Koordinator dokumentasi bidang ${i + 1}`];
    r.careerPathwayAdvice = [
      `Bandingkan materi pengantar dan fasilitas laboratorium program ${i + 1} dengan jenis pekerjaan yang ingin kamu jelajahi.`,
      `Susun proyek kecil untuk bidang ${i + 1}, dokumentasikan prosesnya, lalu diskusikan hasil dan kesulitannya bersama mentor.`,
      `Cari informasi magang bidang ${i + 1} serta periksa persyaratan resmi pendidikan, keselamatan kerja, bahasa, dan kompetensi yang berlaku.`,
    ].slice(0, variation % 3 + 1);
  });
  const top = value.report.topRecommendation;
  top.reasonBullets = [
    "Sebagian jawaban mendukung eksplorasi program ini; gunakan tugas pengantar untuk menilai tuntutan belajar dan kebiasaan kerja yang diperlukan.",
    "Minat pada praktik dan pengamatan dapat membantu menyusun pertanyaan awal, tetapi tidak membuktikan bahwa kompetensi teknis sudah dikuasai.",
    "Bandingkan kebutuhan matematika, dokumentasi, dan komunikasi dalam proyek sebelum menjadikan program ini sebagai pilihan pendidikan yang utama.",
    ...[
      "Lihat contoh tugas semester awal untuk memahami porsi perhitungan, praktik laboratorium, dan penyusunan laporan yang perlu dilatih.",
      "Minta masukan tentang rancangan proyek dari guru atau mentor agar kesulitan materi dapat dikenali sebelum memilih program pendidikan.",
      "Bandingkan biaya alat, akses laboratorium, dan kesempatan praktik untuk menyusun rencana belajar yang sesuai dengan keadaan keluarga.",
    ].slice(0, variation % 4),
  ];
  top.careerPersonalizationReason = [
    "Pengalaman proyek membantu menguji minat tanpa menjanjikan kecocokan atau kelayakan profesi.",
    "Kurikulum dan fasilitas praktik dapat dibandingkan bersama guru sebelum menentukan pilihan.",
    "Pertimbangkan pula biaya belajar, kemampuan bahasa, dan dukungan yang tersedia di rumah.",
  ].slice(0, Math.floor(variation / 4)).join(" ");
  top.skillGaps = ["Latih dasar perhitungan dan pembacaan gambar teknik secara bertahap.", "Bangun kebiasaan mencatat pengamatan serta menjelaskan alasan di balik keputusan proyek."];
  top.recommendedNextSteps = ["Pelajari contoh kurikulum lalu pilih satu materi pengantar untuk dicoba.", "Selesaikan model sederhana dan dokumentasikan perubahan yang kamu lakukan.", "Diskusikan hasil percobaan serta kebutuhan biaya dan fasilitas bersama mentor."];
  top.cautionNotes = ["Periksa kebutuhan biaya alat dan fasilitas praktik pada program yang kamu pertimbangkan."];
  top.careerCautions = ["Hasil ini tidak menjamin kelayakan profesi, pekerjaan, visa, atau lisensi; periksa ketentuan resmi untuk peran dan negara tujuan."];
  top.aspirationReflection = "Tujuan teknik di luar negeri dapat menjadi arah eksplorasi, sambil membandingkan kebutuhan kompetensi dengan kemampuan yang sedang dikembangkan.";
  return value;
}

describe("PDF report generation", () => {
  it.each(["vocational", "university"] as const)(
    "records %s direction and all ten programs",
    async (educationPathway) => {
      const submission = buildSubmission({ ...techAnswer, educationPathway });
      const text = buildSubmissionPdfTextSnapshot(submission);
      expect(text).toContain(
        educationPathway === "vocational"
          ? "Vokasi / Terapan"
          : "Universitas / Akademik",
      );
      expect(text).toContain(educationPathway === "vocational" ? "D3" : "S1");
      for (const result of submission.report.recommendations)
        expect(text).toContain(result.majorName);
      expect((await generateSubmissionPdf(submission)).length).toBeGreaterThan(
        1500,
      );
    },
  );
  it("does not infer a legacy direction and safely paginates long content", async () => {
    const submission = buildSubmission();
    delete submission.answers.educationPathway;
    submission.answers.futureVision = "eksplorasi ".repeat(1800);
    submission.report.topRecommendation.majorName = "A".repeat(800);
    expect(buildSubmissionPdfTextSnapshot(submission)).toContain(
      "Belum tercatat",
    );
    const bytes = await generateSubmissionPdf(submission);
    expect(bytes.byteLength).toBeGreaterThan(10000);
  });
  it("generates a non-empty PDF report", async () => {
    const submission = buildSubmission();
    const bytes = await generateSubmissionPdf(submission);
    const header = Buffer.from(bytes.slice(0, 5)).toString("utf8");
    const snapshot = buildSubmissionPdfTextSnapshot(submission);

    expect(header).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(1500);
    expect(snapshot).toContain(submission.report.topRecommendation.majorName);
    expect(snapshot).toContain("Karier untuk dieksplorasi");
    expect(snapshot).toContain("Kelebihan kamu");
    expect(snapshot).not.toContain("3 karier niche");
    expect(snapshot).toContain("hanya analisis berdasarkan jawaban");
  });
  it("opens with the saved result/summary and puts profile and answers once after alternatives", () => {
    const value = syntheticPdfSubmission();
    const text = buildSubmissionPdfTextSnapshot(value);
    expect(text).toContain("#7 Synthetic Main Program");
    expect(text).toContain("UNIQUE_SAVED_SUMMARY");
    expect(text.indexOf("UNIQUE_SAVED_SUMMARY")).toBeLessThan(text.indexOf("Synthetic Alternative 0"));
    expect(text.indexOf("Synthetic Alternative 8")).toBeLessThan(text.indexOf("UNIQUE_DREAM_ANSWER"));
    for (const marker of ["UNIQUE_DREAM_ANSWER", "UNIQUE_FUTURE_ANSWER", "UNIQUE_DIRECTION", "UNIQUE_ACTION_ALPHA", "UNIQUE_ACTION_BETA", "UNIQUE_ROUTE_ADVICE", "UNIQUE_REASON_ALPHA", "UNIQUE_REASON_BETA", "UNIQUE_CAUTION", "UNIQUE_CAREER_CAUTION", "UNIQUE_ASPIRATION_REFLECTION", "UNIQUE_SKILL_GAP"])
      expect(text.split(marker), marker).toHaveLength(2);
    expect(text).toContain("UNIQUE_ALTERNATIVE_ADVICE_8");
    expect(text).toContain("Kecocokan sedang");
    expect(text).not.toContain("Kenapa cocok");
  });
  it("renders unique content once in the actual PDF rather than only in its text snapshot", async () => {
    const draw = vi.spyOn(PDFPage.prototype, "drawText");
    await generateSubmissionPdf(syntheticPdfSubmission());
    const drawn = draw.mock.calls.map(([text]) => text).join("\n");
    for (const marker of ["UNIQUE_SAVED_SUMMARY", "UNIQUE_DREAM_ANSWER", "UNIQUE_FUTURE_ANSWER", "UNIQUE_ACTION_ALPHA", "UNIQUE_ROUTE_ADVICE", "UNIQUE_CAREER_CAUTION"])
      expect(drawn.split(marker), marker).toHaveLength(2);
    expect(drawn.indexOf("UNIQUE_SAVED_SUMMARY")).toBeLessThan(drawn.indexOf("UNIQUE_DREAM_ANSWER"));
  });
  it("prints a shared action once across main, alternative and campus advice while keeping unique guidance", () => {
    const value = syntheticPdfSubmission();
    value.report.recommendations[1].careerPathwayAdvice = ["UNIQUE_ACTION_ALPHA", "ALTERNATIVE_ONLY_STEP"];
    value.report.ptnPtsVokasiAdvice = ["UNIQUE_ACTION_ALPHA", "CAMPUS_ONLY_STEP"];
    const text = buildSubmissionPdfTextSnapshot(value);
    expect(text.split("UNIQUE_ACTION_ALPHA")).toHaveLength(2);
    expect(text).toContain("ALTERNATIVE_ONLY_STEP");
    expect(text).toContain("CAMPUS_ONLY_STEP");
  });
  it("omits the summary heading when its trimmed saved body is already the career direction", async () => {
    const value = syntheticPdfSubmission();
    value.report.narrative!.summary = `  ${value.report.topRecommendation.careerDirection}  `;
    const snapshot = buildSubmissionPdfTextSnapshot(value);
    expect(snapshot).not.toContain("Ringkasan laporan tersimpan");
    expect(snapshot.split("UNIQUE_DIRECTION")).toHaveLength(2);
    const draw = vi.spyOn(PDFPage.prototype, "drawText");
    await generateSubmissionPdf(value);
    const drawn = draw.mock.calls.map(([text]) => text).join("\n");
    expect(drawn).not.toContain("Ringkasan laporan tersimpan");
    expect(drawn.split("UNIQUE_DIRECTION")).toHaveLength(2);
  });
  it.each([0, 8])("keeps short alternative heading/degree/fit/AI metadata together in realistic report %s", async variation => {
    const value = realisticPdfSubmission(variation);
    const draw = vi.spyOn(PDFPage.prototype, "drawText");
    await generateSubmissionPdf(value);
    const rows = draw.mock.calls.map(([text, options], index) => ({ text, page: draw.mock.contexts[index], y: options?.y }));
    for (const r of value.report.recommendations.slice(1)) {
      const heading = rows.findIndex(row => row.text === `#${r.rank} ${r.majorName}`);
      expect(heading).toBeGreaterThan(-1);
      const aiOffset = rows.slice(heading).findIndex(row => row.text.startsWith("Ketahanan AI:"));
      expect(aiOffset).toBeGreaterThan(0);
      const metadataPages = new Set(rows.slice(heading, heading + aiOffset + 1).map(row => row.page));
      expect(metadataPages.size, `metadata split for rank ${r.rank} / variation ${variation}`).toBe(1);
    }
  });
  it("prints curated guidance once for new reports and keeps old wording for legacy reports", async () => {
    const value = buildSubmission({ ...techAnswer, educationPathway: "vocational",
      dreamProfession: "Ingin kerja di Jepang di kapal atau tambang", futureVision: "Bekerja di bidang teknik." });
    const guidance = value.report.studentGuidance!;
    const action = value.report.topRecommendation.actionGuidance!;
    const text = buildSubmissionPdfTextSnapshot(value);
    expect(text).toContain("Rencana 4 minggu");
    expect(text).toContain("Target skill yang bisa kamu tunjukkan");
    expect(text.split(action.weekPlan[0].action)).toHaveLength(2);
    for (const route of guidance.aspirationRoutes) expect(text).toContain(route.verify);
    expect(text).not.toContain("Keterampilan yang perlu dikembangkan");
    expect((await PDFDocument.load(await generateSubmissionPdf(value))).getPageCount()).toBeLessThanOrEqual(7);
  });
  it("packs an ordinary ten-result report within six pages without a sparse ending or shrinking body type", async () => {
    const draw = vi.spyOn(PDFPage.prototype, "drawText");
    const value = realisticPdfSubmission(1);
    const bytes = await generateSubmissionPdf(value);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeLessThanOrEqual(6);
    const rows = draw.mock.calls.map(([text, options], index) => ({ text, options, page: draw.mock.contexts[index] }));
    const finalPage = rows.at(-1)!.page;
    const finalText = rows.filter(row => row.page === finalPage && row.options?.y !== 24).map(row => row.text).join(" ");
    expect(finalText.trim().split(/\s+/).length, `final page too sparse: ${finalText}`).toBeGreaterThanOrEqual(80);
    expect(rows.find(row => row.text.startsWith("Skor ini menunjukkan"))?.options?.size).toBe(10);
    expect(rows.find(row => row.text.startsWith("Disclaimer: laporan"))?.options?.size).toBe(10);
    expect(rows.map(row => row.text).join(" ")).toContain("bukan fakta mutlak atau keputusan final.");
  });
  it("paginates long content inside page/footer bounds without dropping its final content", async () => {
    const value = syntheticPdfSubmission();
    value.report.topRecommendation.majorName = "LongUnbrokenProgram".repeat(65);
    value.report.topRecommendation.recommendedNextSteps = ["Long action content ".repeat(900) + " FINAL_ACTION_MARKER"];
    value.report.recommendations[1].majorName = "LongAlternative".repeat(75);
    value.answers.futureVision = "Long future text ".repeat(800) + " FINAL_ANSWER_MARKER";
    const original = structuredClone(value);
    const draw = vi.spyOn(PDFPage.prototype, "drawText");
    const bytes = await generateSubmissionPdf(value);
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThan(4);
    const content: string[] = [];
    for (const [text, options] of draw.mock.calls) {
      if (options?.y === 24) continue; // intentional footer band
      content.push(text);
      expect(options?.x).toBeGreaterThanOrEqual(48);
      expect(options?.y).toBeGreaterThanOrEqual(48);
      expect(options!.x! + options!.font!.widthOfTextAtSize(text, options!.size!)).toBeLessThanOrEqual(547.29);
      expect(options!.y! + options!.size!).toBeLessThanOrEqual(793.90);
    }
    expect(content.join("\n")).toContain("FINAL_ACTION_MARKER");
    expect(content.join("\n")).toContain("FINAL_ANSWER_MARKER");
    expect(value).toEqual(original);
  });
});
