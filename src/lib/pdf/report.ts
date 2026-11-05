import { formatSchoolMajor } from "@/lib/assessment/schoolMajorDisplay";
import { fillPrompt, promptValuesFor, resultPrompts } from "@/lib/prompts/fill";
import { formatProblemAreas } from "@/lib/assessment/problemAreaDisplay";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { RecommendationResult, Submission } from "@/lib/types";
import { educationPathwayLabel } from "@/lib/assessment/pathways";
import { formatDateTime } from "@/lib/utils";
import { generatePtnPtsVokasiAdvice } from "@/lib/recommendation/advice";
import { studentStrengthHighlightsFor } from "@/lib/recommendation/display";
// These shared display helpers are pure and have no React/browser dependencies.
import { cleanLines, componentEvidenceFor, fitContextFor, scoreText, visibleCareerCautions } from "@/components/results/resultPresentation";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const INK = rgb(0.08, 0.16, 0.2);
const MUTED = rgb(0.32, 0.37, 0.39);
const ORANGE = rgb(0.72, 0.22, 0.06);
const LINE = rgb(0.81, 0.88, 0.9);
const LOGO_PATH = join(process.cwd(), "public", "brand", "project-nelly-logo-cropped.png");
type Block = { kind: "brand" | "title" | "section" | "heading" | "text" | "bullet"; text: string; keepWithNext?: boolean };

function directionFor(r: RecommendationResult) {
  return r.personalizedCareerDirection?.trim() || r.careerDirection;
}

/** One content plan powers the PDF and its public text snapshot, without editing saved data. */
function reportBlocks(submission: Submission): Block[] {
  const blocks: Block[] = [];
  const { report, answers } = submission;
  const top = report.topRecommendation;
  const add = (kind: Block["kind"], text: string, keepWithNext = false) => {
    if (text.trim()) blocks.push({ kind, text: text.trim(), keepWithNext });
  };
  const list = (title: string, items: string[], seen = new Set<string>()) => {
    const lines = cleanLines(items).filter(line => !seen.has(line));
    if (!lines.length) return;
    add("heading", title);
    lines.forEach(line => { seen.add(line); add("bullet", line); });
  };
  const fitLine = (r: RecommendationResult) => {
    const fit = fitContextFor(r);
    return `Kecocokan profil: ${scoreText(r.overallFitScore)} - ${fit.interpretation}. Label laporan tersimpan: ${r.fitLabel}.`;
  };
  const careers = (r: RecommendationResult) => cleanLines(r.nicheCareerPaths).length ? cleanLines(r.nicheCareerPaths) : cleanLines(r.relatedCareers);
  const topSeen = new Set<string>();
  const savedText = (text?: string) => {
    const line = text?.trim();
    if (line && !topSeen.has(line)) { topSeen.add(line); add("text", line); }
  };

  add("brand", "Project Nelly 101");
  add("title", "Laporan Rekomendasi Jurusan & Karier");
  add("heading", submission.fullName);
  add("text", formatDateTime(submission.createdAt));
  add("section", "01 / Ringkasan hasil");
  add("heading", `#${top.rank} ${top.majorName}`);
  if (top.degreeTypes?.length) add("text", `Jalur program: ${cleanLines(top.degreeTypes).join(" / ")}`);
  add("text", `Arah pendidikan: ${educationPathwayLabel(answers.educationPathway)}`);
  savedText(directionFor(top));
  add("text", fitLine(top));
  add("text", `Ketahanan AI: ${scoreText(top.aiFutureResilienceScore)} (${top.aiFutureResilienceLabel}).`);
  add("text", "Kecocokan bukan peluang diterima; ketahanan AI bukan jaminan pekerjaan.");
  const summary = report.narrative?.summary?.trim();
  if (summary && !topSeen.has(summary)) {
    add("heading", "Ringkasan laporan tersimpan");
    savedText(summary);
  }
  list("Kelebihan kamu", studentStrengthHighlightsFor(submission), topSeen);
  const guidance = report.studentGuidance;
  if (guidance) {
    savedText(guidance.evidenceSummary);
    list("Hal yang perlu kamu ketahui", guidance.tensions, topSeen);
  }

  add("section", "02 / Bukti dan langkah eksplorasi");
  for (const row of componentEvidenceFor(top, answers.workStyle)) {
    add("text", `${row.label}: ${scoreText(row.score)}${row.evidence.length ? ` - ${row.evidence.join(", ")}` : " - rincian belum tercatat"}`);
  }
  const bonus = top.scoringBreakdown?.aspirationMajorBoost;
  if (typeof bonus === "number" && Number.isFinite(bonus))
    add("text", `Tambahan aspirasi tersimpan: ${bonus} poin; sudah termasuk dalam skor laporan.`);
  const signals = cleanLines(top.scoringBreakdown?.matchedAspirationMajorSignals);
  if (signals.length) add("text", `Sinyal aspirasi tersimpan: ${signals.join(", ")}`);
  list("Dasar pertimbangan tersimpan", top.reasonBullets, topSeen);
  list("Karier untuk dieksplorasi", careers(top), topSeen);
  savedText(top.careerPersonalizationReason);
  savedText(top.aspirationReflection);
  const action = top.actionGuidance;
  if (action) {
    list("Target skill yang bisa kamu tunjukkan", action.skillTargets.map(t => `${t.gap}: ${t.target} Bukti: ${t.proof}`), topSeen);
    const first = action.weekPlan[0];
    if (first?.action?.trim()) list("Langkah pertama minggu ini", [`${first.action} (${first.durationLabel}) Bukti: ${first.proof}`], topSeen);
  } else list("Keterampilan yang perlu dikembangkan", top.skillGaps, topSeen);
  const nextSteps = [...top.recommendedNextSteps, ...(top.careerPathwayAdvice ?? [])];
  if (action) list("Langkah lanjutan", [...(top.careerPathwayAdvice ?? []), ...top.recommendedNextSteps.slice(0, 3)].slice(0, 5), topSeen);
  else list("Langkah berikutnya", nextSteps, topSeen);
  list("Hal yang perlu dicek", [...top.cautionNotes, ...visibleCareerCautions(top)], topSeen);

  const alternatives = report.recommendations.slice(1);
  if (alternatives.length) {
    add("section", "03 / Alternatif tersimpan");
    add("text", "Gunakan langkah eksplorasi utama bersama alternatif ini. Langkah tambahan yang berbeda dicantumkan di bawah.");
  }
  for (const r of alternatives) {
    const seen = new Set<string>();
    add("heading", `#${r.rank} ${r.majorName}`, true);
    if (r.degreeTypes?.length) add("text", `Jalur program: ${cleanLines(r.degreeTypes).join(" / ")}`, true);
    add("text", fitLine(r), true);
    add("text", `Ketahanan AI: ${scoreText(r.aiFutureResilienceScore)} (${r.aiFutureResilienceLabel}).`);
    if (r.actionGuidance?.comparisonNote) add("text", r.actionGuidance.comparisonNote);
    add("text", directionFor(r));
    seen.add(directionFor(r).trim());
    list("Karier untuk dieksplorasi", careers(r), seen);
    // Keep unique saved guidance; shared actions already printed above need not repeat.
    list("Langkah eksplorasi", r.careerPathwayAdvice ?? [], topSeen);
    if (r.rank <= 3 && r.actionGuidance) list("Target skill", r.actionGuidance.skillTargets.map(t => `${t.gap}: ${t.target}`), topSeen);
  }

  if (guidance?.aspirationRoutes.length) {
    add("section", "Langkah menuju cita-citamu");
    for (const route of guidance.aspirationRoutes) {
      add("heading", route.title, true);
      route.steps.forEach(step => add("bullet", step));
      add("text", route.verify);
    }
  }
  list("Kampus dan jalur belajar", report.ptnPtsVokasiAdvice ?? generatePtnPtsVokasiAdvice(answers), topSeen);
  add("section", "04 / Profil dan jawaban");
  const profile: [string, string][] = [
    ["Email", submission.email], ["Sekolah", submission.school], ["Kelas", submission.className],
    ["Gender", answers.gender], ["Umur", answers.age], ["Jurusan sekolah", formatSchoolMajor(answers)],
    ["Mata pelajaran disukai", answers.favoriteSubjects.join(", ")],
    ["Mata pelajaran lainnya", answers.favoriteSubjectsOther],
    ["Aktivitas disukai", answers.favoriteActivities.join(", ")],
    ["Kekuatan utama", answers.skillStrengths.join(", ")], ["Gaya kerja", answers.workStyle],
    ["Bidang masalah (urutan prioritas)", formatProblemAreas(answers.problemAreas)],
    ["Preferensi kuliah", answers.collegePathPreferences.join(", ")],
    ["Preferensi kuliah lainnya", answers.collegePathPreferenceOther],
    ["Pertimbangan pribadi", answers.personalConstraints.join(", ")],
    ["Kenyamanan dengan teknologi dan AI", answers.techComfort],
    ["Profesi impian atau bidang penasaran", answers.dreamProfession],
    ["Masa depan yang diinginkan", answers.futureVision],
  ];
  profile.forEach(([label, value]) => add("text", `${label}: ${value?.trim() || "-"}`));

  add("section", "05 / Memahami laporan");
  list("Catatan pola jawaban", report.answerPatternNotes ?? [], topSeen);
  if (guidance?.glossary.length) list("Arti istilah", guidance.glossary.map(t => `${t.term}: ${t.plain}`));
  add("heading", "AI Future Resilience Score");
  add("text", "Skor ini menunjukkan seberapa besar bidang karier ini tetap membutuhkan kemampuan manusia seperti kreativitas, empati, judgement, problem solving kompleks, kerja praktik, dan kemampuan menggunakan AI sebagai alat bantu.");
  if (!guidance) add("text", "Skor tinggi bukan berarti tanpa dampak AI. Bidang ini tetap relevan, tetapi cara kerjanya akan banyak berubah dengan AI. Skill manusia seperti komunikasi, empati, kreativitas, dan judgement tetap penting.");
  add("text", `Versi penilaian: ${report.scoringVersion}. Versi narasi: ${report.narrativeVersion}.`);
  add("heading", "Disclaimer");
  add("text", "Disclaimer: laporan ini hanya analisis berdasarkan jawaban yang kamu isi, bukan fakta mutlak atau keputusan final.");
  add("text", "Gunakan laporan ini sebagai bahan diskusi dengan orang tua, guru BK, mentor, atau pihak sekolah.");

  add("section", "06 / Tanya AI tentang jurusan ini");
  add("text", "Salin prompt ke ChatGPT, Gemini, atau AI lain. Jawaban AI bisa salah; cek ulang ke sumber resmi atau guru BK. Prompt lain: halaman /prompt.");
  const values = promptValuesFor(answers, top);
  for (const prompt of resultPrompts()) {
    add("heading", prompt.title, true);
    add("text", fillPrompt(prompt, values));
  }
  return blocks;
}

interface PdfContext {
  pdf: PDFDocument; page: PDFPage; y: number; font: PDFFont; bold: PDFFont; logo?: PDFImage;
}

function sanitize(value: string) {
  // Keep the existing standard-font fallback for characters outside the supported ASCII set.
  return value.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "-");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of sanitize(text).split(/\s+/).filter(Boolean)) {
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      if (line) { lines.push(line); line = ""; }
      for (const char of word) {
        if (line && font.widthOfTextAtSize(line + char, size) > maxWidth) {
          lines.push(line); line = "";
        }
        line += char;
      }
    } else {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
      else { lines.push(line); line = word; }
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWatermark(page: PDFPage, logo?: PDFImage) {
  if (!logo) return;
  const width = PAGE_WIDTH * 0.8;
  const height = width * logo.height / logo.width;
  page.drawImage(logo, { x: (PAGE_WIDTH - width) / 2, y: (PAGE_HEIGHT - height) / 2, width, height, opacity: 0.035 });
}

function addPage(ctx: PdfContext) {
  ctx.page = ctx.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - MARGIN;
  drawWatermark(ctx.page, ctx.logo);
}

function ensureSpace(ctx: PdfContext, height: number) {
  if (ctx.y - height < MARGIN) addPage(ctx);
}

function measureBlock(ctx: PdfContext, block: Block) {
  const heading = ["title", "section", "heading"].includes(block.kind);
  const size = block.kind === "title" ? 21 : block.kind === "section" ? 14 : block.kind === "heading" ? 11 : block.kind === "brand" ? 12 : 10;
  const font = heading || block.kind === "brand" ? ctx.bold : ctx.font;
  const indent = block.kind === "bullet" ? 10 : 0;
  const lines = wrapText(block.kind === "bullet" ? `- ${block.text}` : block.text, font, size, TEXT_WIDTH - indent);
  const lineHeight = size + 4;
  const gap = block.kind === "section" ? 8 : heading ? 4 : block.kind === "bullet" ? 2 : 4;
  const beforeGap = heading ? block.kind === "section" ? 8 : 3 : 0;
  return { heading, size, font, indent, lines, lineHeight, gap, beforeGap,
    height: beforeGap + lines.length * lineHeight + gap };
}

function drawBlock(ctx: PdfContext, block: Block) {
  const { heading, size, font, indent, lines, lineHeight, gap, beforeGap, height } = measureBlock(ctx, block);
  if (heading) {
    // Keep ordinary headings with at least two lines of following content; oversized headings still flow.
    ensureSpace(ctx, Math.min(height + 28, PAGE_HEIGHT - MARGIN * 2));
    ctx.y -= beforeGap;
  }
  if (block.kind === "section") ctx.page.drawRectangle({
    x: MARGIN - 12, y: ctx.y - 15, width: 4, height: 14, color: ORANGE,
  });
  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    ctx.page.drawText(line, {
      x: MARGIN + indent, y: ctx.y - size, size, font,
      color: block.kind === "section" || block.kind === "brand" ? ORANGE : block.kind === "text" ? MUTED : INK,
    });
    ctx.y -= lineHeight;
  }
  ctx.y -= gap;
}

export function buildSubmissionPdfTextSnapshot(submission: Submission) {
  return reportBlocks(submission).map(block => block.text).join("\n");
}

export async function generateSubmissionPdf(submission: Submission): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let logo: PDFImage | undefined;
  if (existsSync(LOGO_PATH)) {
    try { logo = await pdf.embedPng(readFileSync(LOGO_PATH)); } catch { /* A missing/invalid optional logo does not hide the report. */ }
  }
  const ctx: PdfContext = { pdf, page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: PAGE_HEIGHT - MARGIN, font, bold, logo };
  drawWatermark(ctx.page, logo);
  const blocks = reportBlocks(submission);
  blocks.forEach((block, index) => {
    if (block.keepWithNext && !blocks[index - 1]?.keepWithNext) {
      let end = index;
      while (blocks[end]?.keepWithNext) end++;
      const groupHeight = blocks.slice(index, end + 1).reduce((sum, item) => sum + measureBlock(ctx, item).height, 0);
      // Fit the complete short heading/degree/fit/AI group together, but let oversized groups flow.
      if (groupHeight <= PAGE_HEIGHT - MARGIN * 2) ensureSpace(ctx, groupHeight);
    }
    drawBlock(ctx, block);
  });
  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    page.drawRectangle({ x: MARGIN, y: 38, width: TEXT_WIDTH, height: 1, color: LINE });
    page.drawText(`Project Nelly 101 Series | ${index + 1} / ${pages.length}`, { x: MARGIN, y: 24, size: 8, font, color: MUTED });
  });
  return pdf.save({ useObjectStreams: false });
}
