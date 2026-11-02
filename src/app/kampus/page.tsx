import type { Metadata } from "next";
import { CampusSearch } from "@/components/campus/CampusSearch";

export const metadata: Metadata = { title: "Cari kampus & jurusan" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function CampusPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Number.parseInt(one(params.page), 10);
  return <div className="mx-auto w-full max-w-5xl space-y-6">
    <header className="space-y-2">
      <p className="eyebrow">Data kampus</p>
      <h1 className="text-2xl font-bold sm:text-3xl">Cari kampus &amp; jurusan</h1>
      <p className="max-w-2xl text-sm leading-6 text-stone-700">
        Cari prodi D3, D4 dan S1 di kampus Indonesia. Cek detail resmi di PDDikti sebelum mendaftar.
      </p>
    </header>
    <CampusSearch initial={{
      q: one(params.q).slice(0, 60),
      province: one(params.province).slice(0, 60),
      degree: ["D3", "D4", "S1"].includes(one(params.degree)) ? one(params.degree) : "",
      type: ["Negeri", "Swasta/Lainnya"].includes(one(params.type)) ? one(params.type) : "",
      page: Number.isFinite(page) && page > 0 && page <= 500 ? page : 1,
    }} />
  </div>;
}
