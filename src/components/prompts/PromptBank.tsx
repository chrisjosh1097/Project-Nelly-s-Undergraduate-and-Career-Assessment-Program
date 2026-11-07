"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Compass, GraduationCap, BriefcaseBusiness, FolderOpen, ClipboardCheck, MessagesSquare } from "lucide-react";
import { aiPrompts, promptCategories, type PromptCategoryId, type PromptField } from "../../../data/aiPrompts";
import { fillPrompt, PROMPT_FIELD_MAX, type PromptValues } from "@/lib/prompts/fill";
import { PromptItem } from "./PromptItem";
import { PROMPT_CAUTION } from "./CopyPrompt";

const fields: { key: PromptField; label: string; placeholder: string }[] = [
  { key: "jurusanSekolah", label: "Jurusan sekolahmu", placeholder: "Contoh: IPA, SMK Teknik" },
  { key: "aktivitas", label: "Kegiatan yang kamu suka", placeholder: "Contoh: menggambar, ikut OSIS" },
  { key: "jurusanKuliah", label: "Jurusan kuliah yang kamu pertimbangkan", placeholder: "Contoh: Informatika" },
  { key: "karier", label: "Karier yang ingin kamu ketahui", placeholder: "Contoh: UI/UX Designer" },
];

export function PromptBank({ initial }: { initial: PromptValues }) {
  const [values, setValues] = useState<PromptValues>(initial);
  const personalised = Boolean(initial.jurusanKuliah?.trim());
  const suggested: PromptCategoryId = personalised ? "karier" : "diri";
  return <div className="space-y-6">
    <section aria-label="Isian prompt" className="panel space-y-3">
      <h2 className="text-lg font-bold">Isi sekali, semua prompt ikut terisi</h2>
      <p className="text-sm leading-6 text-stone-700">Boleh dikosongkan. Bagian kosong tetap tampil dalam [kurung] untuk kamu isi sendiri di AI.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(f => <label key={f.key} className="block space-y-1">
          <span className="text-sm font-semibold text-ink">{f.label}</span>
          <input value={values[f.key] ?? ""} maxLength={PROMPT_FIELD_MAX} placeholder={f.placeholder}
            onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
            className="w-full min-h-12 rounded-xl border border-stone-500 bg-white px-4 py-3 text-base text-ink placeholder:text-stone-500 focus:border-ink focus:ring-2 focus:ring-ink/20" />
        </label>)}
      </div>
      <p className="text-xs leading-5 text-stone-600">Jangan tulis nama, nomor HP, atau data pribadi lain di prompt.</p>
    </section>

    {!personalised ? <p className="text-sm leading-6 text-stone-700">
      Belum punya jurusan pilihan? <Link href="/assessment" className="font-semibold text-leaf underline underline-offset-4">Ikuti asesmen dulu</Link> untuk dapat rekomendasi.
    </p> : null}

    <div className="space-y-3">
      {promptCategories.map(cat => {
        const items = aiPrompts.filter(p => p.category === cat.id);
        const CategoryIcon = ({ diri: Compass, jurusan: GraduationCap, karier: BriefcaseBusiness, portofolio: FolderOpen, seleksi: ClipboardCheck, orangtua: MessagesSquare })[cat.id];
        return <details key={cat.id} open={cat.id === suggested} className="group panel min-w-0" data-category={cat.id}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="inline-flex min-w-0 items-center gap-3 text-lg font-bold"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-leaf"><CategoryIcon size={20} aria-hidden="true" /></span><span><span className="text-leaf">{cat.step}</span> · {cat.title}</span></span>
                {cat.id === suggested ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-900">Cocok untukmu sekarang</span> : null}
              </span>
              <span className="mt-1 block text-sm text-stone-600">{cat.intro}</span>
            </span>
            <ChevronDown aria-hidden className="h-5 w-5 shrink-0 transition group-open:rotate-180" />
          </summary>
          <ul className="mt-3 space-y-2">
            {items.map(p => <PromptItem key={p.id} id={p.id} title={p.title} purpose={p.purpose} hint={p.hint} text={fillPrompt(p, values)} />)}
          </ul>
        </details>;
      })}
    </div>
    <p className="text-xs leading-5 text-stone-600">{PROMPT_CAUTION}</p>
  </div>;
}
