"use client";
import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import type { RecommendationResult } from "@/lib/types";
import { cleanLines, scoreText } from "./resultPresentation";
import { campusDegreeParams } from "./CampusExamples";

export const COMPARE_MAX = 3;

export function CompareToggle({ recommendation: r, selected, disabled, onToggle }: {
  recommendation: RecommendationResult; selected: boolean; disabled: boolean; onToggle: () => void;
}) {
  return <button
    type="button"
    aria-pressed={selected}
    aria-label={`Bandingkan ${r.majorName}`}
    disabled={disabled && !selected}
    onClick={onToggle}
    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-leaf bg-leaf text-white" : "border-stone-300 bg-white text-ink hover:bg-orange-50"}`}
  >
    {selected ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
    {selected ? "Dibandingkan" : disabled ? `Maks. ${COMPARE_MAX}` : "Bandingkan"}
  </button>;
}

export function CompareBar({ selected, onRemove, onClear }: {
  selected: RecommendationResult[]; onRemove: (majorId: string) => void; onClear: () => void;
}) {
  if (!selected.length) return null;
  return <div role="region" aria-label="Jurusan yang dibandingkan" className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-xs font-semibold text-stone-600">{selected.length}/{COMPARE_MAX} dipilih</span>
      <ul className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {selected.map(r => <li key={r.majorId} className="shrink-0">
          <button type="button" onClick={() => onRemove(r.majorId)} aria-label={`Hapus ${r.majorName} dari perbandingan`} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-stone-100 px-3 text-xs font-semibold text-ink hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf">
            {r.majorName}<X size={14} aria-hidden="true" />
          </button>
        </li>)}
      </ul>
      {selected.length >= 2
        ? <a href="#bandingkan" className="inline-flex min-h-11 items-center rounded-full bg-leaf px-4 text-sm font-semibold text-white hover:bg-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">Lihat perbandingan</a>
        : <span className="text-xs text-stone-600">Pilih 1 jurusan lagi</span>}
      <button type="button" onClick={onClear} className="min-h-11 rounded-full px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf">Hapus semua</button>
    </div>
  </div>;
}

type CampusCount = { status: "loading" } | { status: "error" } | { status: "ready"; total: number };

function useCampusCounts(selected: RecommendationResult[]) {
  const [counts, setCounts] = useState<Record<string, CampusCount>>({});
  const key = selected.map(r => r.majorId).join(",");
  useEffect(() => {
    const controller = new AbortController();
    for (const r of selected) {
      if (counts[r.majorId]?.status === "ready") continue;
      setCounts(c => ({ ...c, [r.majorId]: { status: "loading" } }));
      const query = new URLSearchParams({ limit: "1" });
      campusDegreeParams(r.degreeTypes).forEach(d => query.append("degree", d));
      fetch(`/api/campus/major/${encodeURIComponent(r.majorId)}?${query}`, { signal: controller.signal })
        .then(async response => {
          if (!response.ok) throw new Error(String(response.status));
          const data = await response.json() as { total?: number };
          setCounts(c => ({ ...c, [r.majorId]: { status: "ready", total: Number(data.total) || 0 } }));
        })
        .catch(() => { if (!controller.signal.aborted) setCounts(c => ({ ...c, [r.majorId]: { status: "error" } })); });
    }
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return counts;
}

function campusText(count?: CampusCount) {
  if (!count || count.status === "loading") return "Memuat…";
  if (count.status === "error") return "Gagal dimuat";
  return count.total > 0 ? `${count.total.toLocaleString("id-ID")} program studi` : "Belum ada data";
}

const list = (items: string[] | undefined, max = 2) => {
  const lines = cleanLines(items).slice(0, max);
  return lines.length ? lines.join(" · ") : "-";
};

export function CompareTable({ selected }: { selected: RecommendationResult[] }) {
  const counts = useCampusCounts(selected);
  if (selected.length < 2) return null;
  const rows: [string, (r: RecommendationResult) => string][] = [
    ["Kecocokan", r => scoreText(r.overallFitScore)],
    ["Ketahanan AI", r => `${scoreText(r.aiFutureResilienceScore)} · ${r.aiFutureResilienceLabel}`],
    ["Jenjang", r => list(r.degreeTypes, 3)],
    ["Pelajaran yang cocok", r => list(r.scoringBreakdown?.matchedSubjects)],
    ["Skill yang perlu diasah", r => list(r.actionGuidance?.skillTargets.map(t => t.gap) ?? r.skillGaps)],
    ["Contoh karier", r => list(cleanLines(r.nicheCareerPaths).length ? r.nicheCareerPaths : r.relatedCareers)],
    ["Program studi di katalog", r => campusText(counts[r.majorId])],
  ];
  return <section id="bandingkan" aria-label="Perbandingan jurusan" className="panel scroll-mt-16 min-w-0">
    <h2 className="text-xl font-bold">Bandingkan jurusan</h2>
    <p className="mt-1 text-xs leading-5 text-stone-600">Geser tabel ke samping di HP. Skor diambil dari laporan tersimpan.</p>
    <div className="mt-4 overflow-x-auto" tabIndex={0} aria-label="Tabel perbandingan, bisa digeser">
      <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm [overflow-wrap:normal]">
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 z-10 w-28 min-w-[7rem] bg-white p-2 text-left text-xs font-semibold text-stone-600"><span className="sr-only">Aspek</span></th>
            {selected.map(r => <th key={r.majorId} scope="col" className="min-w-[150px] border-b border-stone-200 p-2 text-left font-bold text-ink">{r.majorName}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => <tr key={label}>
            <th scope="row" className="sticky left-0 z-10 min-w-[7rem] border-b border-stone-100 bg-white p-2 text-left align-top text-xs font-semibold text-stone-600">{label}</th>
            {selected.map(r => <td key={r.majorId} className="border-b border-stone-100 p-2 align-top leading-6 text-stone-700">{value(r)}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
    <p className="mt-3 text-xs leading-5 text-stone-600">Jumlah program studi dari kompilasi PDDikti dan SNPMB. Data bisa berubah — cek sumber resmi.</p>
  </section>;
}
