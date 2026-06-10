import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { RecommendationResult, Submission } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { generatePtnPtsVokasiAdvice } from "@/lib/recommendation/advice";
import { CAREER_MATCH_LABEL, shouldShowAlternativePathway, studentStrengthHighlightsFor } from "@/lib/recommendation/display";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const INK = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.35, 0.35, 0.35);
const ORANGE = rgb(0.98, 0.45, 0.09);
const ORANGE_DARK = rgb(0.72, 0.25, 0.03);
const NAVY = rgb(0.06, 0.16, 0.26);
const LINE = rgb(0.9, 0.86, 0.8);
const TABLE_HEADER_BG = rgb(1, 0.94, 0.88);
const TABLE_ALT_BG = rgb(1, 0.98, 0.95);
const LOGO_PATH = join(process.cwd(), "public", "brand", "project-nelly-logo-cropped.png");

interface PdfContext {
  pdf: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
  logo?: PDFImage;
}

function sanitize(value: string) {
  return value.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "-");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = sanitize(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawWatermark(page: PDFPage, logo?: PDFImage) {
  if (!logo) return;

  const watermarkWidth = PAGE_WIDTH * 0.9;
  const aspectRatio = logo.height / logo.width;
  const watermarkHeight = watermarkWidth * aspectRatio;

  page.drawImage(logo, {
    x: (PAGE_WIDTH - watermarkWidth) / 2,
    y: (PAGE_HEIGHT - watermarkHeight) / 2,
    width: watermarkWidth,
    height: watermarkHeight,
    opacity: 0.08
  });
}

function addPage(ctx: PdfContext) {
  ctx.page = ctx.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - MARGIN;
  drawWatermark(ctx.page, ctx.logo);
}

async function loadLogo(pdf: PDFDocument) {
  if (!existsSync(LOGO_PATH)) return undefined;
  return pdf.embedPng(readFileSync(LOGO_PATH));
}

function ensureSpace(ctx: PdfContext, height: number) {
  if (ctx.y - height < MARGIN) {
    addPage(ctx);
  }
}

function drawText(
  ctx: PdfContext,
  text: string,
  options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}
) {
  const size = options.size ?? 10;
  const font = options.bold ? ctx.bold : ctx.font;
  const indent = options.indent ?? 0;
  const lines = wrapText(text, font, size, TEXT_WIDTH - indent);
  const lineHeight = size + 4;
  ensureSpace(ctx, lines.length * lineHeight + (options.gap ?? 4));

  for (const line of lines) {
    ctx.page.drawText(line, {
      x: MARGIN + indent,
      y: ctx.y,
      size,
      font,
      color: options.color ?? INK
    });
    ctx.y -= lineHeight;
  }
  ctx.y -= options.gap ?? 4;
}

function drawSectionTitle(ctx: PdfContext, title: string) {
  ensureSpace(ctx, 34);
  ctx.y -= 10;
  ctx.page.drawRectangle({
    x: MARGIN - 10,
    y: ctx.y - 5,
    width: 5,
    height: 18,
    color: ORANGE
  });
  drawText(ctx, title, { size: 14, bold: true, color: NAVY, gap: 8 });
}

function drawKeyValue(ctx: PdfContext, label: string, value: string) {
  drawText(ctx, `${label}: ${value || "-"}`, { size: 10, gap: 1 });
}

function drawBulletList(ctx: PdfContext, items: string[], size = 10) {
  for (const item of items.filter(Boolean)) {
    drawText(ctx, `- ${item}`, { size, indent: 10, gap: 1 });
  }
}

function careerDirectionFor(recommendation: RecommendationResult) {
  return recommendation.personalizedCareerDirection || recommendation.careerDirection;
}

function nicheCareersFor(recommendation: RecommendationResult) {
  return (recommendation.nicheCareerPaths && recommendation.nicheCareerPaths.length > 0
    ? recommendation.nicheCareerPaths
    : recommendation.relatedCareers
  ).slice(0, 3);
}

function drawRecommendation(ctx: PdfContext, recommendation: RecommendationResult, highlighted = false) {
  const boxHeight = highlighted ? 168 : 76;
  ensureSpace(ctx, boxHeight);
  if (!highlighted) {
    const yTop = ctx.y + 8;
    ctx.page.drawRectangle({
      x: MARGIN - 10,
      y: yTop - boxHeight,
      width: TEXT_WIDTH + 20,
      height: boxHeight,
      color: rgb(1, 1, 1),
      borderColor: LINE,
      borderWidth: 1
    });
  }

  drawText(ctx, `#${recommendation.rank} ${recommendation.majorName}`, {
    size: highlighted ? 17 : 12,
    bold: true,
    color: highlighted ? ORANGE_DARK : NAVY,
    gap: 2
  });
  drawText(ctx, careerDirectionFor(recommendation), { size: 10, gap: 2 });
  drawText(
    ctx,
    `Fit: ${recommendation.overallFitScore}/100 (${recommendation.fitLabel}) | AI Future Resilience: ${recommendation.aiFutureResilienceScore}/100 (${recommendation.aiFutureResilienceLabel})`,
    { size: 10, bold: highlighted, color: highlighted ? NAVY : INK, gap: 4 }
  );
  drawText(ctx, recommendation.reasonBullets[0] ?? "", { size: 9, gap: 2 });
  drawText(ctx, `${CAREER_MATCH_LABEL}: ${nicheCareersFor(recommendation).join(", ")}`, { size: 9, gap: 2 });
  if (highlighted) {
    if (recommendation.careerPersonalizationReason) {
      drawText(ctx, recommendation.careerPersonalizationReason, { size: 9, gap: 2 });
    }
    if (recommendation.aspirationReflection) {
      drawText(ctx, `Arah dari aspirasi kamu: ${recommendation.aspirationReflection}`, { size: 9, gap: 2 });
    }
    if (recommendation.careerPathwayAdvice?.length) {
      drawText(ctx, "Langkah menuju arah karier itu:", { size: 9, bold: true, gap: 1 });
      drawBulletList(ctx, recommendation.careerPathwayAdvice.slice(0, 3), 9);
    }
    drawText(ctx, `Skill yang perlu ditingkatkan: ${recommendation.skillGaps.slice(0, 4).join(", ")}`, {
      size: 9,
      gap: 2
    });
    drawText(ctx, `Langkah awal: ${recommendation.recommendedNextSteps.slice(0, 2).join(" | ")}`, { size: 9, gap: 2 });
  }
  ctx.y -= highlighted ? 8 : 4;
}

function drawAlternativeTable(ctx: PdfContext, recommendations: RecommendationResult[], showPathwayAdvice: boolean) {
  const columns = showPathwayAdvice
    ? [
        { label: "#", width: 28 },
        { label: "Jurusan", width: 90 },
        { label: "Fit", width: 34 },
        { label: "AI", width: 34 },
        { label: CAREER_MATCH_LABEL, width: 128 },
        { label: "Arah singkat", width: TEXT_WIDTH - 28 - 90 - 34 - 34 - 128 }
      ]
    : [
        { label: "#", width: 28 },
        { label: "Jurusan", width: 108 },
        { label: "Fit", width: 34 },
        { label: "AI", width: 34 },
        { label: CAREER_MATCH_LABEL, width: TEXT_WIDTH - 28 - 108 - 34 - 34 }
      ];
  const fontSize = 7.4;
  const lineHeight = 10;
  const paddingX = 5;
  const headerHeight = 24;

  function drawHeader() {
    ensureSpace(ctx, headerHeight + 8);
    let x = MARGIN;
    const yTop = ctx.y;

    for (const column of columns) {
      ctx.page.drawRectangle({
        x,
        y: yTop - headerHeight,
        width: column.width,
        height: headerHeight,
        color: TABLE_HEADER_BG,
        borderColor: LINE,
        borderWidth: 0.8
      });
      ctx.page.drawText(column.label, {
        x: x + paddingX,
        y: yTop - 15,
        size: fontSize,
        font: ctx.bold,
        color: NAVY
      });
      x += column.width;
    }

    ctx.y -= headerHeight;
  }

  function cellLines(text: string, width: number, bold = false) {
    return wrapText(text, bold ? ctx.bold : ctx.font, fontSize, width - paddingX * 2);
  }

  function drawRow(recommendation: RecommendationResult, rowIndex: number) {
    const pathwayText = recommendation.careerPathwayAdvice?.slice(0, 2).filter(Boolean).join(" ") ?? "";
    const baseCells = [
      { text: `#${recommendation.rank}`, bold: true },
      { text: recommendation.majorName, bold: true },
      { text: String(recommendation.overallFitScore), bold: false },
      { text: String(recommendation.aiFutureResilienceScore), bold: false },
      { text: nicheCareersFor(recommendation).join(", "), bold: false }
    ];
    const cells = showPathwayAdvice ? [...baseCells, { text: pathwayText, bold: false }] : baseCells;
    const lineSets = cells.map((cell, index) => cellLines(cell.text, columns[index].width, cell.bold));
    const rowHeight = Math.max(34, Math.max(...lineSets.map((lines) => lines.length)) * lineHeight + 12);

    if (ctx.y - rowHeight < MARGIN) {
      addPage(ctx);
      drawHeader();
    }

    let x = MARGIN;
    const yTop = ctx.y;
    const rowColor = rowIndex % 2 === 0 ? rgb(1, 1, 1) : TABLE_ALT_BG;

    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const column = columns[columnIndex];
      ctx.page.drawRectangle({
        x,
        y: yTop - rowHeight,
        width: column.width,
        height: rowHeight,
        color: rowColor,
        borderColor: LINE,
        borderWidth: 0.6
      });

      let textY = yTop - 13;
      const font = cells[columnIndex].bold ? ctx.bold : ctx.font;
      for (const line of lineSets[columnIndex]) {
        ctx.page.drawText(line, {
          x: x + paddingX,
          y: textY,
          size: fontSize,
          font,
          color: columnIndex === 0 ? ORANGE_DARK : INK
        });
        textY -= lineHeight;
      }
      x += column.width;
    }

    ctx.y -= rowHeight;
  }

  drawHeader();
  for (let index = 0; index < recommendations.length; index += 1) {
    drawRow(recommendations[index], index);
  }
  ctx.y -= 10;
}

export function buildSubmissionPdfTextSnapshot(submission: Submission) {
  return [
    "Project Nelly 101",
    "Laporan Rekomendasi Jurusan & Karier",
    submission.fullName,
    submission.school,
    submission.report.topRecommendation.majorName,
    careerDirectionFor(submission.report.topRecommendation),
    CAREER_MATCH_LABEL,
    nicheCareersFor(submission.report.topRecommendation).join(", "),
    "Kelebihan kamu",
    studentStrengthHighlightsFor(submission).join(", "),
    submission.report.topRecommendation.aspirationReflection ?? "",
    (submission.report.topRecommendation.careerPathwayAdvice ?? []).join(", "),
    "Disclaimer: laporan ini hanya analisis berdasarkan jawaban yang kamu isi, bukan fakta mutlak atau keputusan final."
  ].join("\n");
}

export async function generateSubmissionPdf(submission: Submission) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await loadLogo(pdf);
  const ctx: PdfContext = {
    pdf,
    page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN,
    font,
    bold,
    logo
  };
  drawWatermark(ctx.page, logo);

  drawText(ctx, "Project Nelly 101", {
    size: 16,
    bold: true,
    color: ORANGE,
    gap: 8
  });
  drawText(ctx, "Laporan Rekomendasi Jurusan & Karier", {
    size: 24,
    bold: true,
    color: NAVY,
    gap: 8
  });
  drawText(ctx, `${submission.fullName} | ${submission.school}`, { size: 12, bold: true, color: INK, gap: 3 });
  drawText(ctx, formatDateTime(submission.createdAt), { size: 10, color: MUTED, gap: 34 });

  drawSectionTitle(ctx, "Profil Siswa");
  drawKeyValue(ctx, "Nama", submission.fullName);
  drawKeyValue(ctx, "Email", submission.email);
  drawKeyValue(ctx, "Gender", submission.answers.gender ?? "-");
  drawKeyValue(ctx, "Umur", submission.answers.age ?? "-");
  drawKeyValue(ctx, "Sekolah", submission.school);
  drawKeyValue(ctx, "Kelas", submission.className);
  drawKeyValue(ctx, "Jurusan sekolah", submission.answers.currentSchoolMajor);
  drawKeyValue(ctx, "Tanggal submit", formatDateTime(submission.createdAt));

  drawSectionTitle(ctx, "Ringkasan Jawaban");
  drawKeyValue(ctx, "Mata pelajaran disukai", submission.answers.favoriteSubjects.join(", "));
  if (submission.answers.favoriteSubjectsOther) {
    drawKeyValue(ctx, "Mata pelajaran lainnya", submission.answers.favoriteSubjectsOther);
  }
  drawKeyValue(ctx, "Aktivitas disukai", submission.answers.favoriteActivities.join(", "));
  drawKeyValue(ctx, "Kekuatan utama", submission.answers.skillStrengths.join(", "));
  drawKeyValue(ctx, "Gaya kerja", submission.answers.workStyle);
  drawKeyValue(ctx, "Bidang masalah", submission.answers.problemAreas.join(", "));
  drawKeyValue(ctx, "Preferensi kuliah", submission.answers.collegePathPreferences.join(", "));
  if (submission.answers.collegePathPreferenceOther) {
    drawKeyValue(ctx, "Preferensi kuliah lainnya", submission.answers.collegePathPreferenceOther);
  }
  drawKeyValue(ctx, "Pertimbangan pribadi", submission.answers.personalConstraints.join(", "));
  drawKeyValue(ctx, "Kenyamanan dengan teknologi dan AI", submission.answers.techComfort);
  drawKeyValue(ctx, "Profesi impian atau bidang penasaran", submission.answers.dreamProfession);
  drawKeyValue(ctx, "Masa depan yang diinginkan", submission.answers.futureVision);

  drawSectionTitle(ctx, "Rekomendasi Utama");
  drawRecommendation(ctx, submission.report.topRecommendation, true);
  drawText(ctx, "Kenapa cocok:", { size: 10, bold: true, gap: 2 });
  drawBulletList(ctx, submission.report.topRecommendation.reasonBullets.slice(0, 5), 9);
  drawText(ctx, "Kelebihan kamu:", { size: 10, bold: true, gap: 2 });
  drawBulletList(ctx, studentStrengthHighlightsFor(submission), 9);
  drawText(ctx, "Next steps:", { size: 10, bold: true, gap: 2 });
  drawBulletList(ctx, submission.report.topRecommendation.recommendedNextSteps.slice(0, 5), 9);
  if (submission.report.topRecommendation.careerPathwayAdvice?.length) {
    drawText(ctx, "Arah menuju karier yang kamu ceritakan:", { size: 10, bold: true, gap: 2 });
    drawBulletList(ctx, submission.report.topRecommendation.careerPathwayAdvice.slice(0, 3), 9);
  }

  drawSectionTitle(ctx, "Tabel Rekomendasi #2-#10");
  const alternativeRecommendations = submission.report.recommendations.slice(1);
  const showAlternativePathwayAdvice = alternativeRecommendations.some((recommendation) =>
    shouldShowAlternativePathway(submission.report.narrative?.source, recommendation.careerPathwayAdvice)
  );
  drawAlternativeTable(ctx, alternativeRecommendations, showAlternativePathwayAdvice);

  drawSectionTitle(ctx, "AI Future Resilience Score");
  drawText(
    ctx,
    "Skor ini menunjukkan seberapa besar bidang karier ini tetap membutuhkan kemampuan manusia seperti kreativitas, empati, judgement, problem solving kompleks, kerja praktik, dan kemampuan menggunakan AI sebagai alat bantu.",
    { size: 10 }
  );
  drawText(
    ctx,
    "Skor tinggi bukan berarti tanpa dampak AI. Bidang ini tetap relevan, tetapi cara kerjanya akan banyak berubah dengan AI. Skill manusia seperti komunikasi, empati, kreativitas, dan judgement tetap penting.",
    { size: 10 }
  );

  drawSectionTitle(ctx, "Saran Pengembangan Skill");
  for (const step of submission.report.topRecommendation.recommendedNextSteps) {
    drawText(ctx, `- ${step}`, { size: 10, indent: 10, gap: 1 });
  }

  drawSectionTitle(ctx, "Catatan Memilih Kampus dan Jalur Kuliah");
  drawBulletList(ctx, submission.report.ptnPtsVokasiAdvice ?? generatePtnPtsVokasiAdvice(submission.answers), 10);

  drawSectionTitle(ctx, "Lampiran Jawaban");
  drawKeyValue(ctx, "Jurusan sekolah", submission.answers.currentSchoolMajor);
  drawKeyValue(ctx, "Kenyamanan dengan teknologi dan AI", submission.answers.techComfort);
  drawKeyValue(ctx, "Profesi impian atau bidang penasaran", submission.answers.dreamProfession);
  drawKeyValue(ctx, "Masa depan yang diinginkan", submission.answers.futureVision);

  drawSectionTitle(ctx, "Disclaimer");
  drawText(
    ctx,
    "Disclaimer: laporan ini hanya analisis berdasarkan jawaban yang kamu isi, bukan fakta mutlak atau keputusan final.",
    { size: 10, bold: true }
  );
  drawText(
    ctx,
    "Gunakan laporan ini sebagai bahan diskusi dengan orang tua, guru BK, mentor, atau pihak sekolah.",
    { size: 10 }
  );

  for (const page of pdf.getPages()) {
    page.drawText("Project Nelly 101 Series", {
      x: MARGIN,
      y: 24,
      size: 8,
      font,
      color: MUTED
    });
    page.drawRectangle({
      x: MARGIN,
      y: 38,
      width: TEXT_WIDTH,
      height: 1,
      color: LINE
    });
  }

  return pdf.save({ useObjectStreams: false });
}
