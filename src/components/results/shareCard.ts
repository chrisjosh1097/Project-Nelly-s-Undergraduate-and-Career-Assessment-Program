import type { Submission } from "@/lib/types";
import { fitContextFor, scoreText } from "./resultPresentation";

const INK = "#142A33";
const ORANGE = "#A13613";

function roundedPanel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  const radius = 28;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

/** Every text slot has fixed bounds; oversized tokens wrap before ellipsis is applied. */
function drawText(ctx: CanvasRenderingContext2D, value: string, options: {
  x?: number; y: number; width?: number; size: number; lines?: number; leading?: number; bold?: boolean; color?: string;
}) {
  const { x = 96, y, width = 888, size, lines: maxLines = 1, leading = size + 8 } = options;
  ctx.font = `${options.bold ? 700 : 500} ${size}px Arial`;
  ctx.fillStyle = options.color ?? INK;
  const lines: string[] = [];
  let line = "";
  for (const word of value.trim().split(/\s+/).filter(Boolean)) {
    if (ctx.measureText(word).width > width) {
      if (line) { lines.push(line); line = ""; }
      for (const char of Array.from(word)) {
        if (line && ctx.measureText(line + char).width > width) {
          lines.push(line); line = "";
        }
        line += char;
      }
    } else {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= width) line = next;
      else { lines.push(line); line = word; }
    }
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let last = Array.from(visible[maxLines - 1]);
    while (last.length && ctx.measureText(last.join("") + "...").width > width) last.pop();
    visible[maxLines - 1] = last.join("").trimEnd() + "...";
  }
  visible.forEach((text, index) => ctx.fillText(text, x, y + index * leading));
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Gagal membuat gambar Instagram.")), "image/png");
  });
}

export async function createInstagramCardBlob(submission: Submission): Promise<Blob> {
  const top = submission.report.topRecommendation;
  const fit = fitContextFor(top);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung canvas untuk membuat gambar.");

  // Decorative color may bleed; all meaningful text stays between y=250 and y=1670.
  ctx.fillStyle = "#ECF9FF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  roundedPanel(ctx, 660, 70, 350, 130, "#BAEAC2");
  roundedPanel(ctx, 70, 1740, 410, 100, "#FFB088");
  roundedPanel(ctx, 64, 250, 952, 1420, "#FFFFFF");
  ctx.fillStyle = "#F16A32";
  ctx.fillRect(96, 430, 888, 5);
  roundedPanel(ctx, 80, 456, 920, 372, "#E5F6FF");
  roundedPanel(ctx, 80, 850, 444, 200, "#DDF5D8");
  roundedPanel(ctx, 548, 850, 452, 200, "#D9F0FF");

  drawText(ctx, "Project Nelly 101", { y: 295, size: 28, bold: true, color: ORANGE });
  drawText(ctx, submission.fullName, { y: 350, size: 40, leading: 46, lines: 2, bold: true });
  drawText(ctx, `#${top.rank} Rekomendasi utama`, { y: 485, size: 28, bold: true, color: ORANGE });
  drawText(ctx, top.majorName, { y: 550, size: 54, leading: 64, lines: 3, bold: true });
  drawText(ctx, top.personalizedCareerDirection?.trim() || top.careerDirection, { y: 734, size: 30, leading: 38, lines: 3 });

  drawText(ctx, "Kecocokan profil", { y: 890, width: 412, size: 24, bold: true });
  drawText(ctx, scoreText(top.overallFitScore), { y: 944, width: 412, size: 48, bold: true });
  drawText(ctx, fit.interpretation, { y: 991, width: 412, size: 24, leading: 31, lines: 2 });
  drawText(ctx, "Ketahanan AI", { x: 572, y: 890, width: 404, size: 24, bold: true });
  drawText(ctx, scoreText(top.aiFutureResilienceScore), { x: 572, y: 944, width: 404, size: 48, bold: true });
  drawText(ctx, top.aiFutureResilienceLabel || "Belum tercatat", { x: 572, y: 991, width: 404, size: 24, lines: 2, leading: 31 });
  if (fit.savedLabel) drawText(ctx, `Label laporan tersimpan: ${fit.savedLabel}`, { y: 1084, size: 22 });
  drawText(ctx, "Kecocokan bukan peluang diterima. Ketahanan AI bukan jaminan kerja.", { y: 1120, size: 22, leading: 28, lines: 2 });

  const alternatives = submission.report.recommendations.slice(1, 4);
  if (alternatives.length) drawText(ctx, "Arah lain untuk dijelajahi", { y: 1204, size: 28, bold: true });
  alternatives.forEach((r, index) => {
    const y = 1256 + index * 94;
    drawText(ctx, `#${r.rank} ${r.majorName}`, { y, width: 680, size: 28, bold: true });
    drawText(ctx, scoreText(r.overallFitScore), { x: 819, y, width: 165, size: 28, bold: true });
    drawText(ctx, fitContextFor(r).interpretation, { y: y + 36, size: 24 });
  });
  drawText(ctx, "Hasil ini bahan refleksi, bukan keputusan final. Diskusikan dengan orang tua, guru BK, atau mentor.",
    { y: 1556, size: 24, leading: 32, lines: 3 });

  return canvasBlob(canvas);
}
