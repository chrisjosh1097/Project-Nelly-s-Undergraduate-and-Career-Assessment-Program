import type { Metadata } from "next";
import Link from "next/link";
import { majorIndex } from "@/lib/majors/publicProfile";

export const metadata: Metadata = { title: "Kenali jurusan" };

export default function MajorIndexPage() {
  const groups = majorIndex();
  const total = groups.reduce((sum, g) => sum + g.majors.length, 0);
  return <div className="mx-auto w-full max-w-5xl space-y-6">
    <header className="space-y-2">
      <p className="eyebrow">Kenali jurusan</p>
      <h1 className="text-2xl font-bold sm:text-3xl">{total} jurusan untuk dijelajahi</h1>
      <p className="max-w-2xl text-sm leading-6 text-stone-700">
        Baca apa yang dipelajari, skill yang dipakai, contoh karier, dan contoh kampusnya.
      </p>
    </header>
    {groups.map((group) => <section key={group.cluster} aria-label={group.cluster} className="space-y-2">
      <h2 className="text-lg font-bold">{group.cluster}</h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {group.majors.map((m) => <li key={m.id}>
          <Link href={`/jurusan/${m.id}`} className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-orange-300 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">
            <span>{m.name}</span>
            <span className="shrink-0 text-xs font-normal text-stone-600">{m.degreeTypes.join(" · ")}</span>
          </Link>
        </li>)}
      </ul>
    </section>)}
  </div>;
}
