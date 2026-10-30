import type {Submission,RecommendationResult} from "@/lib/types";
function careerDirectionFor(r:RecommendationResult){return r.personalizedCareerDirection||r.careerDirection}
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
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
}

function drawWrappedCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.length > 0 && lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?]?$/, "")}...`;
  }

  for (const canvasLine of lines) {
    ctx.fillText(canvasLine, x, y);
    y += lineHeight;
  }
  return y;
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal membuat gambar Instagram."));
    }, "image/png");
  });
}

export async function createInstagramCardBlob(submission: Submission) {
  const top = submission.report.topRecommendation;
  const alternatives = submission.report.recommendations.slice(1, 4);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung canvas untuk membuat gambar.");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#BC340E";
  ctx.fillRect(0, 0, canvas.width, 330);
  ctx.fillStyle = "#191817";
  ctx.fillRect(0, 1240, canvas.width, 110);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 36px Arial";
  ctx.fillText("Project Nelly 101", 70, 92);
  ctx.font = "500 28px Arial";
  ctx.fillText("Laporan singkat rekomendasi jurusan & karier", 70, 138);

  ctx.save();
  ctx.shadowColor = "rgba(17, 17, 17, 0.18)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  drawRoundedRect(ctx, 70, 230, 940, 680, 28);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#BC340E";
  ctx.font = "800 34px Arial";
  ctx.fillText("#1 Rekomendasi Utama", 115, 305);
  ctx.fillStyle = "#111111";
  ctx.font = "900 76px Arial";
  let y = drawWrappedCanvasText(ctx, top.majorName, 115, 395, 850, 82, 2);

  ctx.fillStyle = "#333333";
  ctx.font = "500 30px Arial";
  y = drawWrappedCanvasText(ctx, careerDirectionFor(top), 115, y + 14, 830, 42, 3);

  const scoreY = Math.max(y + 36, 580);
  drawRoundedRect(ctx, 115, scoreY, 255, 125, 22);
  ctx.fillStyle = "#FFF3E8";
  ctx.fill();
  ctx.fillStyle = "#BC340E";
  ctx.font = "900 54px Arial";
  ctx.fillText(`${top.overallFitScore}`, 145, scoreY + 68);
  ctx.font = "700 23px Arial";
  ctx.fillText("FIT SCORE", 145, scoreY + 101);

  drawRoundedRect(ctx, 400, scoreY, 355, 125, 22);
  ctx.fillStyle = "#191817";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 54px Arial";
  ctx.fillText(`${top.aiFutureResilienceScore}`, 430, scoreY + 68);
  ctx.font = "700 23px Arial";
  ctx.fillText("AI RESILIENCE", 430, scoreY + 101);

  ctx.fillStyle = "#111111";
  ctx.font = "800 30px Arial";
  ctx.fillText("Kenapa cocok?", 115, scoreY + 185);
  ctx.fillStyle = "#333333";
  ctx.font = "500 27px Arial";
  let reasonY = scoreY + 232;
  for (const reason of top.reasonBullets.slice(0, 1)) {
    ctx.fillStyle = "#BC340E";
    ctx.fillText("•", 115, reasonY);
    ctx.fillStyle = "#333333";
    reasonY = drawWrappedCanvasText(ctx, reason, 145, reasonY, 790, 36, 3) + 8;
  }

  const alternativeY = 935;
  drawRoundedRect(ctx, 70, alternativeY, 940, 220, 28);
  ctx.fillStyle = "#FFF7ED";
  ctx.fill();
  ctx.fillStyle = "#111111";
  ctx.font = "800 30px Arial";
  ctx.fillText("Alternatif yang juga layak dipertimbangkan", 115, alternativeY + 62);
  ctx.font = "700 28px Arial";
  alternatives.forEach((recommendation, index) => {
    ctx.fillStyle = "#BC340E";
    ctx.fillText(`#${recommendation.rank}`, 115, alternativeY + 116 + index * 42);
    ctx.fillStyle = "#111111";
    ctx.fillText(recommendation.majorName, 175, alternativeY + 116 + index * 42);
  });

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 28px Arial";
  ctx.fillText(submission.fullName, 70, 1288);
  ctx.font = "500 22px Arial";
  ctx.fillText("Hasil ini bahan refleksi, bukan keputusan final.", 70, 1322);

  return canvasBlob(canvas);
}

