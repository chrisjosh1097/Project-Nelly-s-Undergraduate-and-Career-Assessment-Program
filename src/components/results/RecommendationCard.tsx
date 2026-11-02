"use client";
import { useEffect, useState } from "react";
import type { ActionGuidance, RecommendationResult } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, ListChecks, Footprints } from "lucide-react";
import { cleanLines, comparisonSignalFor, componentEvidenceFor, fitContextFor, scoreText, visibleCareerCautions } from "./resultPresentation";
import { CampusExamples } from "./CampusExamples";

function Lines({ title, items }: { title: string; items?: string[] }) {
  const lines = cleanLines(items);
  if (!lines.length) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-bold text-ink">{title}</h3>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600">
        {lines.map(line => <li key={line}>{line}</li>)}
      </ul>
    </section>
  );
}

function SkillTargets({ guidance }: { guidance: ActionGuidance }) {
  return guidance.skillTargets.length ? <section>
      <h3 className="mb-2 text-sm font-bold text-ink">Target skill yang bisa kamu tunjukkan</h3>
      <ul className="space-y-3 text-sm leading-6 text-stone-700">
        {guidance.skillTargets.map(t => <li key={t.gap} className="rounded-xl border border-stone-200 p-3">
          <span className="block font-semibold text-ink">{t.gap}</span>
          <span className="block">{t.target}</span>
          <span className="mt-1 block text-xs leading-5 text-stone-600">Bukti: {t.proof}</span>
        </li>)}
      </ul>
    </section> : null;
}

function planStorageKey(planKey: string, majorId: string) {
  return `nelly-plan:${planKey}:${majorId}`;
}

function readDone(key: string): number[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= 4) : [];
  } catch { return []; }
}

function WeekPlan({ guidance, planKey, majorId }: { guidance: ActionGuidance; planKey?: string; majorId: string }) {
  const storageKey = planKey ? planStorageKey(planKey, majorId) : null;
  const [done, setDone] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (storageKey) setDone(readDone(storageKey));
    setOpen(window.matchMedia?.("(min-width: 640px)").matches ?? true);
  }, [storageKey]);
  if (!guidance.weekPlan.length) return null;
  const toggle = (week: number) => {
    const next = done.includes(week) ? done.filter(n => n !== week) : [...done, week].sort();
    setDone(next);
    if (storageKey) { try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* storage unavailable */ } }
  };
  const total = guidance.weekPlan.length;
  const count = guidance.weekPlan.filter(w => done.includes(w.week)).length;
  return <section aria-label="Rencana 4 minggu">
      <details open={open} onToggle={e => setOpen(e.currentTarget.open)} className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-ink">
          <span>Rencana {total} minggu ({total} langkah)</span>
          <span className="flex items-center gap-2 text-xs font-semibold text-leaf">
            <span data-testid="plan-progress">{count} dari {total} selesai</span>
            <ChevronDown aria-hidden className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </summary>
        <ol className="mt-2 space-y-3 text-sm leading-6 text-stone-700">
          {guidance.weekPlan.map(w => {
            const checked = done.includes(w.week);
            const id = `plan-${majorId}-${w.week}`;
            return <li key={w.week} className="flex gap-3 border-l-2 border-orange-300 pl-3">
              <input id={id} type="checkbox" checked={checked} onChange={() => toggle(w.week)} className="mt-1 h-5 w-5 shrink-0 accent-orange-600" />
              <label htmlFor={id} className="min-w-0 cursor-pointer">
                <span className="block text-xs font-bold text-leaf">Minggu {w.week} · {w.durationLabel}</span>
                <span className={`block ${checked ? "text-stone-500 line-through" : ""}`}>{w.action}</span>
                <span className="block text-xs leading-5 text-stone-600">Bukti: {w.proof}</span>
              </label>
            </li>;
          })}
        </ol>
        <p className="mt-2 text-xs leading-5 text-stone-500">Centang tersimpan di perangkat ini saja.</p>
      </details>
    </section>;
}

export function RecommendationCard({ recommendation: r, expanded = false, workStyle, preferences, planKey }: {
  recommendation: RecommendationResult; expanded?: boolean; workStyle?: string; preferences?: string[]; planKey?: string;
}) {
  const [opened, setOpened] = useState(false);
  const fit = fitContextFor(r);
  const rows = componentEvidenceFor(r, workStyle);
  const bonus = r.scoringBreakdown?.aspirationMajorBoost;
  const signals = cleanLines(r.scoringBreakdown?.matchedAspirationMajorSignals);
  const steps = cleanLines(r.recommendedNextSteps);
  const cautions = cleanLines([...(r.cautionNotes ?? []), ...visibleCareerCautions(r)]);
  const careers = cleanLines(r.nicheCareerPaths).length ? r.nicheCareerPaths : r.relatedCareers;
  const hasExplanation = cleanLines(r.reasonBullets).length || cleanLines(careers).length ||
    cleanLines(r.skillStrengthMatches).length || r.careerPersonalizationReason?.trim() || r.aspirationReflection?.trim();
  const explanation = <div className="grid gap-5 px-2 pb-4 md:grid-cols-2">
    <Lines title="Dasar pertimbangan" items={r.reasonBullets} />
    <div className="min-w-0 space-y-5">
    <Lines title="Arah karier untuk dijelajahi" items={careers} />
    <Lines title="Kekuatan yang mendukung" items={r.skillStrengthMatches} />
    {r.careerPersonalizationReason?.trim() ? <p className="text-sm leading-6 text-stone-600">{r.careerPersonalizationReason}</p> : null}
    {r.aspirationReflection?.trim() ? <p className="rounded-xl bg-orange-50 p-3 text-sm leading-6 text-stone-700">{r.aspirationReflection}</p> : null}
    </div>
  </div>;
  const body = (
    <div className="min-w-0 space-y-5 pt-4 [overflow-wrap:anywhere]">
      {expanded && r.actionGuidance?.comparisonNote ? <p className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-700">{r.actionGuidance.comparisonNote}</p> : null}
      {!expanded ? <>
        <p className="text-sm leading-6 text-stone-600">{r.personalizedCareerDirection?.trim() || r.careerDirection}</p>
        <p className="text-sm leading-6 text-stone-600">{fit.explanation}</p>
      </> : null}
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-5">
        <section aria-label="Bukti dari jawabanmu" className="min-w-0">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
            <ListChecks size={18} className="shrink-0 text-leaf" aria-hidden="true" />Bukti dari jawabanmu
          </h3>
          <dl className="divide-y divide-stone-100 rounded-xl border border-stone-200 px-3">
            {rows.map(row => <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-3">
                <dt className="text-sm font-semibold">{row.label}</dt>
                <dd className="text-sm font-bold tabular-nums text-leaf">{scoreText(row.score)}</dd>
              <dd className="col-span-2 mt-1 text-xs leading-5 text-stone-600">{row.evidence.length ? row.evidence.join(" · ") : "Rincian belum tercatat"}</dd>
            </div>)}
          </dl>
          {typeof bonus === "number" && Number.isFinite(bonus) ? <p className="mt-3 text-xs leading-5 text-stone-600">Tambahan aspirasi tersimpan: {bonus} poin. Sudah termasuk dalam skor laporan.</p> : null}
          {signals.length ? <p className="mt-2 text-xs leading-5 text-stone-600">Sinyal aspirasi tersimpan: {signals.join(", ")}</p> : null}
        </section>
          {r.actionGuidance ? <SkillTargets guidance={r.actionGuidance} /> : null}
        </div>
        <div className="min-w-0 space-y-4">
          {steps.length ? <section className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
              <Footprints size={18} className="shrink-0 text-leaf" aria-hidden="true" />Langkah berikutnya
            </h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-stone-700">
              {steps.slice(0, 3).map(line => <li key={line}>{line}</li>)}
            </ol>
            {steps.length > 3 ? <details className="mt-2">
              <summary className="touch-link rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">Langkah lainnya</summary>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-stone-700">{steps.slice(3).map(line => <li key={line}>{line}</li>)}</ul>
            </details> : null}
          </section> : null}
          {r.actionGuidance ? <WeekPlan guidance={r.actionGuidance} planKey={planKey} majorId={r.majorId} /> : <Lines title="Skill yang perlu ditingkatkan" items={r.skillGaps} />}
          {expanded || opened ? <CampusExamples majorId={r.majorId} majorName={r.majorName} degreeTypes={r.degreeTypes} preferences={preferences} /> : null}
          <Lines title="Arah menuju kariermu" items={r.careerPathwayAdvice} />
          <Lines title="Hal yang perlu dicek" items={cautions} />
        </div>
      </div>
      {hasExplanation ? expanded ? <details className="rounded-xl border border-stone-200 px-3">
        <summary className="touch-link rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">Penjelasan laporan tersimpan</summary>
        {explanation}
      </details> : explanation : null}
      <details className="border-t border-stone-200 pt-2">
        <summary className="touch-link rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">Bagaimana skor dibaca?</summary>
        <p className="pb-3 text-xs leading-6 text-stone-600">
          Bobot penilaian: minat 30%, skill 25%, mata pelajaran 15%, gaya kerja 10%, area masalah 10%, pertimbangan 10%.
          Nilai di atas adalah komponen laporan tersimpan, bukan peluang diterima atau persentase kemampuan yang sudah dikuasai.
          Skor dan urutan laporan ini tidak dihitung ulang.
        </p>
      </details>
    </div>
  );
  return expanded ? <article className="panel min-w-0">
    <h2 className="text-xl font-bold">Kenali rekomendasi utamamu</h2>{body}
  </article> : <details className="recommendation-details panel min-w-0 open:lg:col-span-2" onToggle={(event) => { if (event.currentTarget.open) setOpened(true); }}>
    <summary className="flex min-h-14 items-start gap-3 rounded-lg [overflow-wrap:anywhere] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-leaf">
      <span className="pt-1 text-xs font-bold tabular-nums text-leaf">{String(r.rank).padStart(2, "0")}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold sm:text-lg">{r.majorName}</span>
        <span className="mt-1 block text-xs leading-6 text-stone-700">Kecocokan {scoreText(r.overallFitScore)} · {fit.interpretation}</span>
        <span className="block text-xs leading-6 text-stone-600">Ketahanan AI {scoreText(r.aiFutureResilienceScore)} · {r.aiFutureResilienceLabel}</span>
        <span className="mt-1 flex flex-wrap gap-2">
          {cleanLines(r.degreeTypes).map(d => <Badge key={d}>{d}</Badge>)}
        </span>
        {fit.conflicts && fit.savedLabel ? <span className="mt-1 block text-xs leading-5 text-stone-600">Label laporan tersimpan: {fit.savedLabel}</span> : null}
        <span className="mt-2 block text-xs leading-5 text-stone-600">{comparisonSignalFor(r)}</span>
        {r.actionGuidance?.comparisonNote ? <span className="mt-2 block rounded-lg bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-700"><span className="font-semibold text-ink">Catatan urutan: </span>{r.actionGuidance.comparisonNote}</span> : null}
        {cleanLines(careers).length ? <span className="mt-2 hidden flex-wrap items-center gap-1.5 text-xs lg:flex leading-5 text-stone-600"><span className="font-semibold text-ink">Contoh karier:</span>{cleanLines(careers).slice(0, 3).map(c => <span key={c} className="rounded-full border border-stone-200 px-2 py-0.5">{c}</span>)}</span> : null}
      </span>
      <ChevronDown size={20} className="mt-1 shrink-0 text-leaf" aria-hidden="true" />
    </summary>
    {body}
  </details>;
}
