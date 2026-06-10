"use client";

import { useState } from "react";
import { Download, Sparkles, Target, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import type { RecommendationResult, Submission } from "@/lib/types";
import { downloadBlob, formatDateTime } from "@/lib/utils";
import { generatePtnPtsVokasiAdvice } from "@/lib/recommendation/advice";
import { CAREER_MATCH_LABEL, shouldShowAlternativePathway, studentStrengthHighlightsFor } from "@/lib/recommendation/display";

function ScoreBar({ value, tone = "green" }: { value: number; tone?: "green" | "gold" | "coral" }) {
  const color = tone === "green" ? "bg-leaf" : tone === "gold" ? "bg-marigold" : "bg-coral";
  return (
    <div className="mt-2 h-2 rounded-full bg-black/10">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
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

function SmallRecommendationCard({
  recommendation,
  showPathwayAdvice
}: {
  recommendation: RecommendationResult;
  showPathwayAdvice: boolean;
}) {
  const nicheCareers = nicheCareersFor(recommendation);
  const pathwayAdvice = recommendation.careerPathwayAdvice?.slice(0, 3) ?? [];

  return (
    <article className="rounded-md border border-black/10 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <Badge tone="blue">#{recommendation.rank}</Badge>
          <h3 className="mt-2 font-bold text-ink">{recommendation.majorName}</h3>
          <p className="mt-1 text-sm leading-5 text-ink/65">{careerDirectionFor(recommendation)}</p>
        </div>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <span className="font-semibold text-ink">Fit {recommendation.overallFitScore}</span>
          <ScoreBar value={recommendation.overallFitScore} />
        </div>
        <div>
          <span className="font-semibold text-ink">AI Resilience {recommendation.aiFutureResilienceScore}</span>
          <ScoreBar value={recommendation.aiFutureResilienceScore} tone="gold" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">{CAREER_MATCH_LABEL}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {nicheCareers.map((career) => (
            <Badge key={career} tone="neutral">
              {career}
            </Badge>
          ))}
        </div>
      </div>
      {showPathwayAdvice && pathwayAdvice.length > 0 ? (
        <div className="mt-3 rounded-md bg-[#FFF7ED] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Arah singkat</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink/70">
            {pathwayAdvice.map((step) => (
              <li key={step}>- {step}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

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

async function createInstagramCardBlob(submission: Submission) {
  const top = submission.report.topRecommendation;
  const alternatives = submission.report.recommendations.slice(1, 4);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung canvas untuk membuat gambar.");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#F97316";
  ctx.fillRect(0, 0, canvas.width, 330);
  ctx.fillStyle = "#0F2A43";
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

  ctx.fillStyle = "#F97316";
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
  ctx.fillStyle = "#F97316";
  ctx.font = "900 54px Arial";
  ctx.fillText(`${top.overallFitScore}`, 145, scoreY + 68);
  ctx.font = "700 23px Arial";
  ctx.fillText("FIT SCORE", 145, scoreY + 101);

  drawRoundedRect(ctx, 400, scoreY, 355, 125, 22);
  ctx.fillStyle = "#0F2A43";
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
    ctx.fillStyle = "#F97316";
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
    ctx.fillStyle = "#F97316";
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

export function ResultsView({ submission, compact = false }: { submission: Submission; compact?: boolean }) {
  const { getToken } = useAuth();
  const [downloadError, setDownloadError] = useState("");
  const top = submission.report.topRecommendation;
  const topNicheCareers = nicheCareersFor(top);
  const alternatives = submission.report.recommendations.slice(1);
  const advice = submission.report.ptnPtsVokasiAdvice ?? generatePtnPtsVokasiAdvice(submission.answers);
  const patternNotes = submission.report.answerPatternNotes ?? [];
  const narrativeSource = submission.report.narrative?.source;
  const studentStrengths = studentStrengthHighlightsFor(submission);

  async function download(endpoint: string, filename: string) {
    setDownloadError("");
    try {
      const token = await getToken();
      const response = await fetch(endpoint, {
        headers: { authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Download gagal. Coba lagi sebentar lagi.");
      }
      const blob = await response.blob();
      downloadBlob(blob, filename);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download gagal. Coba lagi sebentar lagi.");
    }
  }

  async function downloadInstagramCard() {
    setDownloadError("");
    try {
      const blob = await createInstagramCardBlob(submission);
      downloadBlob(blob, `kartu-instagram-${submission.id}.png`);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Gagal membuat kartu Instagram.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-md border border-black/10 bg-white p-5 shadow-soft sm:p-7">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Badge tone="green">Dibuat {formatDateTime(submission.createdAt)}</Badge>
            <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Rekomendasi Utama Kamu</h1>
            <p className="mt-2 text-sm text-ink/65">
              {submission.fullName} - {submission.school} - {submission.className}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
              Ringkasan ini dihitung dari minat, skill, mata pelajaran, gaya kerja, area masalah, preferensi kuliah, dan batasan pribadi.
            </p>
          </div>
          {!compact ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => download("/api/submissions/pdf", `laporan-${submission.id}.pdf`)}>
                <Download className="h-4 w-4" />
                Download Laporan PDF
              </Button>
              <Button variant="secondary" onClick={downloadInstagramCard}>
                <Download className="h-4 w-4" />
                Download Kartu Instagram
              </Button>
            </div>
          ) : null}
        </div>
        {downloadError ? (
          <div className="mb-5 rounded-md border border-coral/25 bg-coral/10 p-3 text-sm text-ink">{downloadError}</div>
        ) : null}
        {submission.answers.dreamProfession || submission.answers.futureVision ? (
          <div className="mb-5 rounded-md border border-black/10 bg-white p-4 text-sm leading-6 text-ink/75">
            <h2 className="font-bold text-ink">Aspirasi yang kamu tulis</h2>
            {submission.answers.dreamProfession ? (
              <p className="mt-2">
                <span className="font-semibold">Bidang/profesi yang bikin penasaran:</span> {submission.answers.dreamProfession}
              </p>
            ) : null}
            {submission.answers.futureVision ? (
              <p className="mt-2">
                <span className="font-semibold">Masa depan yang kamu inginkan:</span> {submission.answers.futureVision}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-md border border-leaf/25 bg-[#FFF7ED] p-5 ring-1 ring-leaf/10 sm:p-7">
          <div className="flex flex-col justify-between gap-4 lg:flex-row">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="green" className="text-sm">#1</Badge>
                <Badge tone="green">{top.fitLabel}</Badge>
                <Badge tone="gold">AI Future Resilience {top.aiFutureResilienceLabel}</Badge>
                <Badge tone="blue">{top.cluster}</Badge>
              </div>
              <h2 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl">{top.majorName}</h2>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-ink/75">{careerDirectionFor(top)}</p>
            </div>
            <div className="grid min-w-52 grid-cols-2 gap-3">
              <div className="rounded-md bg-white p-4">
                <Target className="h-5 w-5 text-leaf" />
                <div className="mt-3 text-3xl font-black text-ink">{top.overallFitScore}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink/55">Overall Fit</div>
                <ScoreBar value={top.overallFitScore} />
              </div>
              <div className="rounded-md bg-moss p-4 text-white ring-1 ring-moss/20">
                <Wand2 className="h-5 w-5 text-white" />
                <div className="mt-3 text-3xl font-black text-white">{top.aiFutureResilienceScore}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-white/75">AI Resilience</div>
                <ScoreBar value={top.aiFutureResilienceScore} tone="gold" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h3 className="font-bold text-ink">Kenapa cocok</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/75">
                {top.reasonBullets.slice(0, 5).map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <Sparkles className="mt-1 h-4 w-4 shrink-0 text-leaf" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
              {studentStrengths.length > 0 ? (
                <div className="mt-5 rounded-md bg-white p-4">
                  <h3 className="font-bold text-ink">Kelebihan kamu</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/75">
                    {studentStrengths.map((strength) => (
                      <li key={strength} className="flex gap-2">
                        <Sparkles className="mt-1 h-4 w-4 shrink-0 text-coral" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-ink">{CAREER_MATCH_LABEL}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {topNicheCareers.map((career) => (
                    <Badge key={career} tone="neutral">
                      {career}
                    </Badge>
                  ))}
                </div>
                {top.careerPersonalizationReason ? (
                  <p className="mt-2 text-sm leading-6 text-ink/70">{top.careerPersonalizationReason}</p>
                ) : null}
              </div>
              {top.aspirationReflection || top.careerPathwayAdvice?.length ? (
                <div className="rounded-md bg-white p-4">
                  <h3 className="font-bold text-ink">Arah menuju karier yang kamu ceritakan</h3>
                  {top.aspirationReflection ? (
                    <p className="mt-2 text-sm leading-6 text-ink/70">{top.aspirationReflection}</p>
                  ) : null}
                  {top.careerPathwayAdvice?.length ? (
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/75">
                      {top.careerPathwayAdvice.map((step) => (
                        <li key={step}>- {step}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              <div>
                <h3 className="font-bold text-ink">Skill yang perlu ditingkatkan</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {top.skillGaps.map((skill) => (
                    <Badge key={skill} tone="coral">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-md bg-white p-4">
              <h3 className="font-bold text-ink">Next steps</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/75">
                {top.recommendedNextSteps.map((step) => (
                  <li key={step}>- {step}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md bg-white p-4">
              <h3 className="font-bold text-ink">Catatan</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/75">
                {top.cautionNotes.map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-black/10 bg-white p-5 shadow-soft lg:col-span-2">
          <h2 className="text-xl font-bold text-ink">Panduan Membaca Skor</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-md bg-[#FFF7ED] p-4">
              <h3 className="font-bold text-ink">Overall Fit Score</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
                <li>82-100: Sangat Cocok</li>
                <li>70-81: Cocok</li>
                <li>58-69: Cukup Cocok</li>
                <li>0-57: Perlu Dipertimbangkan Lagi</li>
              </ul>
            </div>
            <div className="rounded-md bg-moss p-4 text-white">
              <h3 className="font-bold">AI Future Resilience Score</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-white/80">
                <li>80-100: Tinggi</li>
                <li>60-79: Sedang</li>
                <li>0-59: Perlu Adaptasi Tinggi</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="rounded-md border border-black/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-ink">Apa arti skor ketahanan terhadap AI?</h2>
          <p className="mt-3 text-sm leading-7 text-ink/70">
            Skor ini menunjukkan seberapa besar bidang karier ini tetap membutuhkan kemampuan manusia seperti kreativitas,
            empati, judgement, problem solving kompleks, kerja praktik, dan kemampuan menggunakan AI sebagai alat bantu.
          </p>
          <p className="mt-3 text-sm leading-7 text-ink/70">
            Skor tinggi bukan berarti tanpa perubahan. Bidang ini tetap relevan, tetapi cara kerjanya akan banyak berubah dengan AI.
          </p>
        </div>
        <div className="rounded-md border border-black/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-bold text-ink">Catatan Memilih Kampus dan Jalur Kuliah</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
            {advice.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </section>

      {patternNotes.length > 0 ? (
        <section className="rounded-md border border-marigold/40 bg-marigold/15 p-4 text-sm leading-6 text-ink/75">
          {patternNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Rekomendasi #2-#10</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {alternatives.map((recommendation) => (
            <SmallRecommendationCard
              key={recommendation.majorId}
              recommendation={recommendation}
              showPathwayAdvice={shouldShowAlternativePathway(narrativeSource, recommendation.careerPathwayAdvice)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-md border border-black/10 bg-white p-4 text-sm leading-6 text-ink/70">
        <strong>Disclaimer: hasil ini hanya analisis berdasarkan jawaban yang kamu isi, bukan fakta mutlak atau keputusan final.</strong>{" "}
        Gunakan sebagai bahan diskusi dengan orang tua, guru BK, mentor, atau pihak sekolah.
      </section>
    </div>
  );
}
