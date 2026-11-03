import Link from "next/link";
import { ArrowLeft, BookOpen, Briefcase, Cpu, Footprints, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { PublicMajorProfile } from "@/lib/majors/publicProfile";
import { Badge } from "@/components/ui/Badge";
import { CampusExamples } from "@/components/results/CampusExamples";

function Block({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <section aria-label={title} className="panel min-w-0">
    <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">{icon}{title}</h2>
    {children}
  </section>;
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-stone-600">Belum tercatat.</p>;
  return <ul className="flex flex-wrap gap-2">
    {items.map((item) => <li key={item}><Badge>{item}</Badge></li>)}
  </ul>;
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-stone-700">
    {items.map((item) => <li key={item}>{item}</li>)}
  </ul>;
}

const iconClass = "shrink-0 text-leaf";

export function MajorProfileView({ major }: { major: PublicMajorProfile }) {
  return <article className="mx-auto w-full max-w-5xl space-y-6 [overflow-wrap:anywhere]">
    <Link href="/jurusan" className="touch-link -ml-3 rounded-lg font-semibold text-stone-700 hover:text-ink">
      <ArrowLeft size={16} aria-hidden="true" />Semua jurusan
    </Link>
    <header className="space-y-3">
      <p className="eyebrow">{major.cluster} · {major.subCluster}</p>
      <h1 className="text-2xl font-bold sm:text-3xl">{major.name}</h1>
      {major.alternativeNames.length ? <p className="text-sm text-stone-600">Nama lain: {major.alternativeNames.join(", ")}</p> : null}
      <p className="max-w-3xl text-base leading-7 text-stone-700">{major.description}</p>
      {major.degreeTypes.length ? <p className="flex flex-wrap items-center gap-2 text-sm text-stone-700">
        Jenjang: {major.degreeTypes.map((d) => <Badge key={d} tone="green">{d}</Badge>)}
      </p> : null}
    </header>

    <div className="grid gap-4 md:grid-cols-2">
      <Block icon={<BookOpen size={18} className={iconClass} aria-hidden="true" />} title="Pelajaran sekolah yang mendukung">
        <Chips items={major.subjects} />
      </Block>
      <Block icon={<Sparkles size={18} className={iconClass} aria-hidden="true" />} title="Skill yang dipakai">
        <Chips items={major.skills} />
      </Block>
      <Block icon={<Briefcase size={18} className={iconClass} aria-hidden="true" />} title="Contoh karier">
        <Chips items={major.careers} />
      </Block>
      <Block icon={<Cpu size={18} className={iconClass} aria-hidden="true" />} title="Ketahanan terhadap AI">
        <p className="text-sm font-semibold text-ink">{major.aiScore}/100 · {major.aiLabel}</p>
        <p className="mt-2 text-sm leading-6 text-stone-700">{major.aiReason}</p>
      </Block>
    </div>

    <section aria-label="Gambaran beban belajar" className="panel min-w-0">
      <h2 className="mb-3 text-lg font-bold">Gambaran beban belajar</h2>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        {major.intensity.map(({ label, level }) => <div key={label} className="rounded-xl bg-stone-50 p-3">
          <dt className="text-xs text-stone-600">{label}</dt>
          <dd className="font-semibold text-ink">{level}</dd>
        </div>)}
      </dl>
      <p className="mt-3 text-xs leading-5 text-stone-600">Perkiraan umum. Kurikulum tiap kampus bisa berbeda.</p>
    </section>

    <Block icon={<Footprints size={18} className={iconClass} aria-hidden="true" />} title="Coba mulai dari sini">
      <Bullets items={major.firstSteps} />
    </Block>

    {major.hasCampusData ? <section className="panel min-w-0">
      <CampusExamples majorId={major.id} majorName={major.name} degreeTypes={major.degreeTypes} />
      <Link href={`/kampus?q=${encodeURIComponent(major.name)}`} className="touch-link -ml-3 mt-1 rounded-lg font-semibold text-leaf underline-offset-4 hover:underline">
        Cari kampus lain untuk {major.name}
      </Link>
    </section> : null}

    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
      <h2 className="text-lg font-bold">Cocok untukmu?</h2>
      <p className="mt-1 text-sm leading-6 text-stone-700">Ikuti asesmen untuk melihat kecocokan jurusan ini dengan minat dan skill-mu.</p>
      <Link href="/assessment" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black">
        Mulai asesmen
      </Link>
    </section>
  </article>;
}
