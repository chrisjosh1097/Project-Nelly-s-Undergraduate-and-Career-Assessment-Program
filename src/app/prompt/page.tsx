import type { Metadata } from "next";
import { PromptGate } from "@/components/prompts/PromptGate";
import { PROMPT_FIELD_MAX } from "@/lib/prompts/fill";

export const metadata: Metadata = { title: "Bank Prompt" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => ((Array.isArray(value) ? value[0] : value) ?? "").slice(0, PROMPT_FIELD_MAX);

export default async function PromptPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <div className="mx-auto w-full max-w-4xl space-y-6 [overflow-wrap:anywhere]">
    <header className="space-y-2">
      <p className="eyebrow">Bank Prompt</p>
      <h1 className="text-2xl font-bold sm:text-3xl">Prompt untuk ngobrol dengan AI</h1>
      <p className="max-w-2xl text-sm leading-6 text-stone-700">
        Belum tahu mulai dari mana? Ikuti urutan 1–5. Sudah punya tujuan? Langsung pilih yang kamu butuhkan.
      </p>
    </header>
    {/* Only non-identifying fields are read from the URL. */}
    <PromptGate initial={{ jurusanSekolah: one(params.jurusanSekolah), jurusanKuliah: one(params.jurusanKuliah), karier: one(params.karier) }} />
  </div>;
}
