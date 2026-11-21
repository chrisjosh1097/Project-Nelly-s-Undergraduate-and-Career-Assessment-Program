"use client";
import { useState } from "react";
import { Download, ArrowUpRight, Compass, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAuth } from "@/components/auth/AuthProvider";
import { educationPathwayLabel } from "@/lib/assessment/pathways";
import { studentStrengthHighlightsFor } from "@/lib/recommendation/display";
import { generatePtnPtsVokasiAdvice } from "@/lib/recommendation/advice";
import { downloadBlob, formatDateTime } from "@/lib/utils";
import type { Submission } from "@/lib/types";
import { RecommendationCard } from "./RecommendationCard";
import { promptValuesFor } from "@/lib/prompts/fill";
import { COMPARE_MAX, CompareBar, CompareTable } from "./CompareMajors";
import { CampusDegree } from "@/components/campus/CampusRowMeta";
import { campusMajorMap } from "../../../data/campusMajorMap";
import Link from "next/link";
import { AspirationRoutesPanel, GuidanceTensions, StudentGuidanceSummary } from "./StudentGuidancePanel";
import { createInstagramCardBlob } from "./shareCard";
import { aspirationSpotlightFor, bestScoreOf, isScoreOrdered, CLOSE_GAP, cleanLines, fitContextFor, gapText, resultGroupsFor, scoreText } from "./resultPresentation";
export function ResultsView({
  submission,
  compact = false,
}: {
  submission: Submission;
  compact?: boolean;
}) {
  const { getToken } = useAuth();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const top = submission.report.topRecommendation;
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const allRecommendations = submission.report.recommendations.some(r => r.majorId === top.majorId)
    ? submission.report.recommendations
    : [top, ...submission.report.recommendations];
  const compared = compareIds
    .map(id => allRecommendations.find(r => r.majorId === id))
    .filter((r): r is NonNullable<typeof r> => !!r);
  const toggleCompare = (id: string) => setCompareIds(ids =>
    ids.includes(id) ? ids.filter(x => x !== id) : ids.length >= COMPARE_MAX ? ids : [...ids, id]);
  const compareFor = (id: string) => compact ? undefined : ({
    selected: compareIds.includes(id),
    disabled: compareIds.length >= COMPARE_MAX,
    onToggle: () => toggleCompare(id),
  });
  const advice =
    submission.report.ptnPtsVokasiAdvice ??
    generatePtnPtsVokasiAdvice(submission.answers);
  const fit = fitContextFor(top);
  const summary = submission.report.narrative?.summary?.trim() ||
    `Laporan tersimpan menempatkan ${top.majorName} sebagai arah utama dengan kecocokan ${scoreText(top.overallFitScore)}.`;
  const strengths = cleanLines(studentStrengthHighlightsFor(submission));
  const aspirations = [submission.answers.dreamProfession, submission.answers.futureVision]
    .map(text => text?.trim()).filter(Boolean);
  const notes = cleanLines(submission.report.answerPatternNotes);
  const guidance = submission.report.studentGuidance;
  const tensions = cleanLines(guidance?.tensions);
  const hasRoutes = !!guidance && (guidance.aspirationRoutes.length > 0 || guidance.glossary.length > 0);
  const hasAdvice = cleanLines(advice).length > 0;
  // Display-only: stored order and scores are untouched; we only describe distance from the closest score.
  // Unusual legacy order (a later item scoring higher) falls back to one list in stored order, without gap labels.
  const ordered = isScoreOrdered(allRecommendations);
  const best = ordered ? bestScoreOf(allRecommendations) : undefined;
  const alternatives = submission.report.recommendations.filter(r => r.majorId !== top.majorId);
  const closeOnes = best === undefined ? [] : alternatives.filter(r => best - r.overallFitScore <= CLOSE_GAP).slice(0, 2);
  const groups = best === undefined
    ? [{ id: "semua", title: "", hint: "", items: alternatives }]
    : resultGroupsFor(alternatives, best);
  const aspirationHits = allRecommendations.filter(r => r.aspirationMatch);
  const anchorFor = (id: string) => (id === top.majorId ? "#rencana" : `#arah-${id}`);
  const topRule = campusMajorMap[top.majorId];
  const campusQuery = topRule && "include" in topRule ? topRule.include[0] : top.majorName;
  const jumpLinks = [
    ...(aspirationHits.length ? [["cita-citamu", "Cita-citamu"]] : []),
    ["ringkasan", "Ringkasan"],
    ["rencana", "Rencana"],
    ...(hasRoutes ? [["cita-cita", "Cita-cita"]] : []),
    ["alternatif", "Alternatif"],
    ["kampus", "Kampus"],
  ];
  async function download(kind: "pdf" | "image") {
    if (busy) return;
    setBusy(kind);
    setError("");
    try {
      if (kind === "image")
        downloadBlob(
          await createInstagramCardBlob(submission),
          `kartu-instagram-${submission.id}.png`,
        );
      else {
        const token = await getToken();
        const response = await fetch("/api/submissions/pdf", {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Unduhan gagal. Coba lagi.");
        }
        downloadBlob(await response.blob(), `laporan-${submission.id}.pdf`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unduhan gagal.");
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">
            Peta arahmu · {formatDateTime(submission.createdAt)}
          </p>
          <h1 className="section-heading mt-3">
            Peta arah dan langkahmu
          </h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            {submission.fullName} · {submission.school} · {submission.className}
          </p>
          <div className="mt-2">
            <Badge>
              {educationPathwayLabel(submission.answers.educationPathway)}
            </Badge>
          </div>
        </div>
        {!compact ? (
          <div className="grid gap-2 sm:flex lg:shrink-0">
            <Button onClick={() => download("pdf")} disabled={!!busy}>
              <Download size={16} aria-hidden="true" />
              {busy === "pdf" ? "Mengunduh…" : "Laporan PDF"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => download("image")}
              disabled={!!busy}
            >
              <ArrowUpRight size={16} aria-hidden="true" />
              {busy === "image" ? "Membuat…" : "Kartu Instagram"}
            </Button>
          </div>
        ) : null}
      </header>
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {!compact ? <nav aria-label="Lompat ke bagian" className="sticky top-0 z-20 border-b border-stone-200 bg-[#fcfaf8]/95 backdrop-blur lg:hidden">
        <ul className="flex gap-1 overflow-x-auto py-1">
          {jumpLinks.map(([id, label]) => <li key={id} className="shrink-0"><a href={`#${id}`} className="flex min-h-11 items-center rounded-full px-2.5 text-sm font-semibold text-stone-700 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf">{label}</a></li>)}
        </ul>
      </nav> : null}
      {aspirationHits.length ? <section id="cita-citamu" aria-labelledby="cita-citamu-heading" className="scroll-mt-16 min-w-0 rounded-[22px] border-2 border-orange-300 bg-orange-50/70 p-5 sm:p-6">
        <h2 id="cita-citamu-heading" className="flex items-center gap-2 text-lg font-extrabold"><Star size={20} className="shrink-0 text-leaf" aria-hidden="true" />Cita-citamu ada di hasil ini</h2>
        <ul className="mt-4 grid gap-3">
          {aspirationHits.map(r => <li key={r.majorId} className="min-w-0 rounded-xl border border-orange-200 bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <a href={anchorFor(r.majorId)} className="touch-link -ml-1 rounded-lg px-1 text-base font-bold text-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf">{r.majorName}</a>
              <span className="text-sm font-bold tabular-nums text-leaf">Kecocokan {scoreText(r.overallFitScore)}</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-stone-700">{aspirationSpotlightFor(r, best)}</p>
          </li>)}
        </ul>
        <p className="mt-3 text-xs leading-5 text-stone-600">{best === undefined ? "Urutan di bawah bukan peringkat nilai." : "Urutan di bawah bukan peringkat nilai. Selisih beberapa poin berarti sama-sama cocok."}</p>
      </section> : null}
      <section id="ringkasan" aria-label="Ringkasan arahmu" className="scroll-mt-16 min-w-0 overflow-hidden rounded-[22px] border border-stone-200 bg-white">
        <div className="bg-gradient-to-br from-orange-800 to-leaf p-5 text-white sm:p-6">
          <p className="text-xs font-bold tracking-wide text-white">Paling dekat dengan jawabanmu</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="min-w-0 text-3xl font-extrabold sm:text-4xl">{top.majorName}</h2>
            {cleanLines(top.degreeTypes).map(degree => <CampusDegree key={degree} degree={degree} />)}
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-orange-50">{top.personalizedCareerDirection?.trim() || top.careerDirection}</p>
          <dl className="mt-5 grid min-w-0 grid-cols-2 gap-4 border-t border-white/30 pt-4">
            <div className="min-w-0">
              <dt className="text-xs text-orange-50">Kecocokan profil</dt>
              <dd className="mt-1 text-2xl font-extrabold tabular-nums text-white">{scoreText(top.overallFitScore)}</dd>
              <dd className="mt-1 text-sm font-bold">{fit.interpretation}</dd>
              {fit.conflicts && fit.savedLabel ? <dd className="mt-1 text-xs leading-5 text-orange-100">Label laporan tersimpan: {fit.savedLabel}</dd> : null}
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-orange-50">Ketahanan terhadap perubahan AI</dt>
              <dd className="mt-1 text-2xl font-extrabold tabular-nums text-white">{scoreText(top.aiFutureResilienceScore)}</dd>
              <dd className="mt-1 text-sm font-bold">{top.aiFutureResilienceLabel}</dd>
            </div>
          </dl>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-orange-50">{fit.explanation}</p>
          {closeOnes.length ? <div className="mt-4 rounded-xl bg-white/10 p-3">
            <p className="text-sm font-bold">Sama-sama dekat (selisih kecil, anggap setara):</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {closeOnes.map(r => <li key={r.majorId}><a href={anchorFor(r.majorId)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{r.majorName}<span className="text-xs font-normal text-stone-600">{gapText(r, best!)}</span></a></li>)}
            </ul>
          </div> : null}
          <p className="mt-3 text-xs leading-6 text-orange-100">Skor kecocokan bukan peluang diterima. Ketahanan AI bukan jaminan pekerjaan. Urutan bukan peringkat nilai.</p>
        </div>
        <div className={`grid min-w-0 gap-6 p-5 sm:p-6 ${aspirations.length ? "lg:grid-cols-2" : ""}`}>
          <div className="min-w-0 space-y-5">
            <section>
              <h3 className="flex items-center gap-2 text-base font-bold"><Compass size={18} className="shrink-0 text-leaf" aria-hidden="true" />Ringkasan laporan</h3>
              <p className="mt-2 text-sm leading-7 text-stone-700">{summary}</p>
              {guidance ? <StudentGuidanceSummary guidance={guidance} showTensions={!aspirations.length} /> : null}
            </section>
            {strengths.length ? <section>
              <h3 className="flex items-center gap-2 text-base font-bold"><Sparkles size={18} className="shrink-0 text-leaf" aria-hidden="true" />Kekuatan dari jawabanmu</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600">{strengths.map(line => <li key={line}>{line}</li>)}</ul>
            </section> : null}
          </div>
          {aspirations.length ? <section aria-label="Aspirasi yang kamu tulis" className="min-w-0 border-l-2 border-orange-300 pl-4">
            <h3 className="text-base font-bold">Aspirasi yang kamu tulis</h3>
            {aspirations.map((text, i) => <p key={i} className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-700">{text}</p>)}
            <div className="mt-4 text-xs leading-6 text-stone-600">Gunakan tujuan ini untuk membandingkan kurikulum dan pengalaman praktik. Periksa persyaratan resmi pendidikan, profesi, dan kerja untuk arah yang kamu tuju.</div>
            {tensions.length ? <GuidanceTensions tensions={tensions} /> : null}
          </section> : null}
        </div>
      </section>
      <div id="rencana" className="scroll-mt-16"><RecommendationCard recommendation={top} expanded workStyle={submission.answers.workStyle} preferences={submission.answers.collegePathPreferences} promptValues={compact ? undefined : promptValuesFor(submission.answers, top)} compare={compareFor(top.majorId)} /></div>
      {guidance && hasRoutes ? <div id="cita-cita" className="scroll-mt-16"><AspirationRoutesPanel guidance={guidance} /></div> : null}
      <section id="alternatif" className="scroll-mt-16">
        <h2 className="section-heading mb-2">Arah lain untuk dijelajahi</h2>
        <p className="mb-5 text-sm leading-6 text-stone-600">{best === undefined ? "Urutan mengikuti laporan tersimpan dan bukan peringkat nilai." : "Dikelompokkan menurut selisih skor dari arah terdekat, bukan juara 1, 2, 3."}</p>
        <div className="space-y-6">
          {groups.map(g => <section key={g.id} aria-labelledby={g.title ? `grup-${g.id}` : undefined}>
            {g.title ? <><h3 id={`grup-${g.id}`} className="text-base font-bold">{g.title}</h3>
            <p className="mb-3 text-xs leading-5 text-stone-600">{g.hint}</p></> : null}
            <div className="grid gap-3">
              {g.items.map((r) => (
                <RecommendationCard key={r.majorId} recommendation={r} bestScore={best} workStyle={submission.answers.workStyle} preferences={submission.answers.collegePathPreferences} compare={compareFor(r.majorId)} />
              ))}
            </div>
          </section>)}
        </div>
      </section>
      {!compact ? <CompareTable selected={compared} /> : null}
      <div className="result-grid">
        <Panel id="kampus" className="scroll-mt-16">
          <h2 className="text-xl font-bold">Kampus dan jalur belajarmu</h2>
          {hasAdvice ? <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-stone-600">
            {cleanLines(advice).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul> : null}
          <Link href={`/kampus?q=${encodeURIComponent(campusQuery)}`} className="touch-link mt-3 rounded-lg text-sm font-semibold text-leaf underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">
            Cari kampus & jurusan lain<ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </Panel>
        <Panel>
          <h2 className="text-xl font-bold">Memahami kedua skor</h2>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            Kecocokan profil: 82–100 sangat cocok; 70–81 cocok; 58–69 cukup
            cocok; di bawah 58 perlu dipertimbangkan lagi.
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            Ketahanan AI: 80–100 tinggi; 60–79 sedang; di bawah 60 perlu
            adaptasi tinggi. Ini menggambarkan kebutuhan kemampuan manusia dan
            potensi AI sebagai alat bantu, bukan prediksi pasti.
          </p>
          <p className="mt-4 text-xs leading-6 text-stone-600">
            Versi skor: {submission.report.scoringVersion}.{" "}
            {submission.report.narrative?.source === "gemini"
              ? "Penjelasan telah diperkaya tanpa mengubah skor."
              : "Penjelasan berbasis aturan penilaian."}
          </p>
        </Panel>
      </div>
      {notes.length ? (
        <StatusMessage>
          {notes.map((n, i) => (
            <p key={i}>{n}</p>
          ))}
        </StatusMessage>
      ) : null}
      <p className="border-t border-stone-200 pt-5 text-xs leading-7 text-stone-600">
        <strong>
          Hasil ini hanya analisis berdasarkan jawaban yang kamu isi, bukan
          fakta mutlak atau keputusan final.
        </strong>{" "}
        Gunakan untuk diskusi dengan orang tua, guru BK, atau mentor.
      </p>
      {!compact ? <CompareBar selected={compared} onRemove={id => toggleCompare(id)} onClear={() => setCompareIds([])} /> : null}
      {!compact && compared.length ? <div aria-hidden="true" className="h-32 sm:h-20" /> : null}
    </div>
  );
}
