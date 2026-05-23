"use client";

import { useState } from "react";
import { Download, FileJson, Sparkles, Target, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import type { RecommendationResult, Submission } from "@/lib/types";
import { downloadBlob, formatDateTime } from "@/lib/utils";
import { generatePtnPtsVokasiAdvice } from "@/lib/recommendation/advice";

function ScoreBar({ value, tone = "green" }: { value: number; tone?: "green" | "gold" | "coral" }) {
  const color = tone === "green" ? "bg-leaf" : tone === "gold" ? "bg-marigold" : "bg-coral";
  return (
    <div className="mt-2 h-2 rounded-full bg-black/10">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function SmallRecommendationCard({ recommendation }: { recommendation: RecommendationResult }) {
  return (
    <article className="rounded-md border border-black/10 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <Badge tone="blue">#{recommendation.rank}</Badge>
          <h3 className="mt-2 font-bold text-ink">{recommendation.majorName}</h3>
          <p className="mt-1 text-sm leading-5 text-ink/65">{recommendation.careerDirection}</p>
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
      <p className="mt-3 text-sm leading-6 text-ink/70">{recommendation.reasonBullets[0]}</p>
    </article>
  );
}

export function ResultsView({ submission, compact = false }: { submission: Submission; compact?: boolean }) {
  const { getToken } = useAuth();
  const [downloadError, setDownloadError] = useState("");
  const top = submission.report.topRecommendation;
  const alternatives = submission.report.recommendations.slice(1);
  const advice = submission.report.ptnPtsVokasiAdvice ?? generatePtnPtsVokasiAdvice(submission.answers);
  const patternNotes = submission.report.answerPatternNotes ?? [];

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
              <Button variant="secondary" onClick={() => download("/api/submissions/answers", `jawaban-${submission.id}.json`)}>
                <FileJson className="h-4 w-4" />
                Download Jawaban Saya
              </Button>
            </div>
          ) : null}
        </div>
        {downloadError ? (
          <div className="mb-5 rounded-md border border-coral/25 bg-coral/10 p-3 text-sm text-ink">{downloadError}</div>
        ) : null}

        <div className="rounded-md border border-leaf/25 bg-[#EEF7EF] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 lg:flex-row">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="green" className="text-sm">#1</Badge>
                <Badge tone="green">{top.fitLabel}</Badge>
                <Badge tone="gold">AI Future Resilience {top.aiFutureResilienceLabel}</Badge>
                <Badge tone="blue">{top.cluster}</Badge>
              </div>
              <h2 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl">{top.majorName}</h2>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-ink/75">{top.careerDirection}</p>
            </div>
            <div className="grid min-w-52 grid-cols-2 gap-3">
              <div className="rounded-md bg-white p-4">
                <Target className="h-5 w-5 text-leaf" />
                <div className="mt-3 text-3xl font-black text-ink">{top.overallFitScore}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink/55">Overall Fit</div>
                <ScoreBar value={top.overallFitScore} />
              </div>
              <div className="rounded-md bg-marigold/25 p-4 ring-1 ring-marigold/40">
                <Wand2 className="h-5 w-5 text-[#7A4D0D]" />
                <div className="mt-3 text-3xl font-black text-ink">{top.aiFutureResilienceScore}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink/55">AI Resilience</div>
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
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-ink">Karier terkait</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {top.relatedCareers.map((career) => (
                    <Badge key={career} tone="neutral">
                      {career}
                    </Badge>
                  ))}
                </div>
              </div>
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
          <Badge tone="neutral">Deterministic heuristic</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {alternatives.map((recommendation) => (
            <SmallRecommendationCard key={recommendation.majorId} recommendation={recommendation} />
          ))}
        </div>
      </section>

      <section className="rounded-md border border-black/10 bg-white p-4 text-sm leading-6 text-ink/70">
        Hasil ini bukan keputusan final. Gunakan sebagai bahan diskusi dengan orang tua, guru BK, mentor, atau pihak sekolah.
      </section>
    </div>
  );
}
