"use client";
import { useMemo, useState } from "react";
import { Field, Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import type { ScoringMatrix } from "@/lib/admin/scoringMatrix";

const pct = (weight: number) => `${Math.round(weight * 100)}%`;

function thresholdText(thresholds: ReadonlyArray<{ min: number; label: string }>) {
  return thresholds.map((t, i) => {
    const upper = i === 0 ? null : thresholds[i - 1].min - 1;
    const range = upper === null ? `≥${t.min}` : t.min === 0 ? `<${thresholds[i - 1].min}` : `${t.min}–${upper}`;
    return { range, label: t.label };
  });
}

function WeightTable({ caption, rows }: { caption: string; rows: { label: string; weight: number }[] }) {
  return (
    <table className="mt-4 w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-stone-200 text-left text-xs text-stone-600">
          <th scope="col" className="py-2 pr-3 font-semibold">Komponen</th>
          <th scope="col" className="py-2 text-right font-semibold">Bobot</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-stone-100">
            <th scope="row" className="py-2 pr-3 text-left font-normal">{r.label}</th>
            <td className="py-2 text-right font-bold tabular-nums">{pct(r.weight)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Thresholds({ rows }: { rows: { range: string; label: string }[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2 text-xs">
      {rows.map((r) => (
        <li key={r.label} className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5">
          <strong className="tabular-nums">{r.range}</strong> {r.label}
        </li>
      ))}
    </ul>
  );
}

const labelTone: Record<string, string> = {
  Tinggi: "bg-emerald-50 text-emerald-900",
  Sedang: "bg-amber-50 text-amber-900",
  "Perlu Adaptasi Tinggi": "bg-red-50 text-red-900",
};

export function ScoringMatrixView({ matrix }: { matrix: ScoringMatrix }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? matrix.majors.filter((m) => `${m.name} ${m.cluster} ${m.profileName}`.toLowerCase().includes(q)) : matrix.majors;
  }, [matrix.majors, query]);

  return (
    <div className="min-w-0 space-y-6">
      <p className="text-sm leading-7 text-stone-600">
        Bobot dan ambang ini diambil langsung dari mesin skor, jadi selalu sama dengan perhitungan laporan siswa.
        Halaman ini hanya untuk dibaca.
      </p>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Panel className="min-w-0">
          <h2 className="text-base font-bold">Skor kecocokan</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Skor 0–100 per jurusan dari jawaban siswa. Setiap komponen dinilai 0–100, lalu dijumlah sesuai bobot.
          </p>
          <WeightTable caption="Bobot skor kecocokan" rows={matrix.fitWeights} />
          <p className="mt-3 text-xs leading-5 text-stone-600">
            Tambahan cita-cita: +{matrix.aspirationBoosts.exactPhrase} jika cita-cita menyebut frasa jurusan persis,
            +{matrix.aspirationBoosts.keywordPair} jika cocok lewat pasangan kata kunci. Skor maksimal tetap 100.
          </p>
          <h3 className="mt-5 text-sm font-bold">Label kecocokan</h3>
          <Thresholds rows={thresholdText(matrix.fitThresholds)} />
        </Panel>
        <Panel className="min-w-0">
          <h2 className="text-base font-bold">Ketahanan terhadap AI</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Skor 0–100 per jurusan dari profil bidangnya, sama untuk semua siswa. Tidak memengaruhi urutan kecuali saat skor kecocokan seri.
          </p>
          <WeightTable caption="Bobot ketahanan AI" rows={matrix.aiWeights} />
          <h3 className="mt-5 text-sm font-bold">Label ketahanan AI</h3>
          <Thresholds rows={thresholdText(matrix.aiThresholds)} />
        </Panel>
      </div>
      <Panel className="min-w-0">
        <h2 className="text-base font-bold">Matriks ketahanan AI per jurusan</h2>
        <p className="mt-2 text-sm text-stone-600">
          {rows.length} dari {matrix.majors.length} jurusan. Urut dari skor tertinggi. Geser tabel ke samping di layar kecil.
        </p>
        <div className="mt-4 max-w-sm">
          <Field label="Cari jurusan">
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nama, klaster, atau profil" />
          </Field>
        </div>
        <div className="mt-4 max-w-full overflow-x-auto rounded-xl border border-stone-200" tabIndex={0} role="region" aria-label="Tabel matriks, dapat digeser">
          <table className="min-w-[1100px] w-full text-xs">
            <caption className="sr-only">Matriks ketahanan AI per jurusan</caption>
            <thead className="bg-stone-50 text-left text-stone-700">
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-stone-50 px-3 py-2 font-semibold">Jurusan</th>
                <th scope="col" className="px-3 py-2 font-semibold">Profil AI</th>
                {matrix.aiWeights.map((w) => (
                  <th key={w.label} scope="col" className="px-2 py-2 text-right font-semibold">
                    {w.label}
                    <span className="block font-normal text-stone-600">{pct(w.weight)}</span>
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-semibold">Skor AI</th>
                <th scope="col" className="px-3 py-2 font-semibold">Label</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-t border-stone-100">
                  <th scope="row" className="sticky left-0 min-w-[12rem] bg-white px-3 py-2 text-left font-semibold">
                    {m.name}
                    <span className="block font-normal text-stone-600">{m.cluster}</span>
                  </th>
                  <td className="min-w-[11rem] px-3 py-2">{m.profileName}</td>
                  {m.components.map((value, i) => (
                    <td key={matrix.aiWeights[i].label} className="px-2 py-2 text-right tabular-nums">{value}</td>
                  ))}
                  <td className="px-3 py-2 text-right text-sm font-bold tabular-nums">{m.aiScore}</td>
                  <td className="px-3 py-2">
                    <span className={`whitespace-nowrap rounded-full px-2 py-1 ${labelTone[m.aiLabel] ?? ""}`}>{m.aiLabel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? <p className="p-4 text-sm text-stone-600">Tidak ada jurusan yang cocok.</p> : null}
        </div>
      </Panel>
    </div>
  );
}
