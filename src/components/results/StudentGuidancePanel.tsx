import type { StudentGuidance } from "@/lib/types";
import { Route, Lightbulb, BookOpen } from "lucide-react";

export function GuidanceTensions({ tensions, className = "mt-4" }: { tensions: string[]; className?: string }) {
  return <section aria-label="Hal yang perlu kamu ketahui" className={className}>
      <h3 className="flex items-center gap-2 text-base font-bold"><Lightbulb size={18} className="shrink-0 text-leaf" aria-hidden="true" />Hal yang perlu kamu ketahui</h3>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-700">{tensions.map(line => <li key={line}>{line}</li>)}</ul>
    </section>;
}

/** Renders curated guidance only when the saved report already contains it. */
export function StudentGuidanceSummary({ guidance, showTensions = true }: { guidance: StudentGuidance; showTensions?: boolean }) {
  return <>
    {guidance.evidenceSummary ? <p className="mt-2 text-sm leading-7 text-stone-700">{guidance.evidenceSummary}</p> : null}
    {showTensions && guidance.tensions.length ? <GuidanceTensions tensions={guidance.tensions} /> : null}
  </>;
}

export function AspirationRoutesPanel({ guidance }: { guidance: StudentGuidance }) {
  if (!guidance.aspirationRoutes.length && !guidance.glossary.length) return null;
  return <section aria-label="Jalur cita-cita dan istilah" className="panel min-w-0 space-y-6">
    {guidance.aspirationRoutes.length ? <div>
      <h2 className="flex items-center gap-2 text-xl font-bold"><Route size={20} className="shrink-0 text-leaf" aria-hidden="true" />Langkah menuju cita-citamu</h2>
      <div className={`mt-4 grid min-w-0 gap-4 ${guidance.aspirationRoutes.length === 2 ? "lg:grid-cols-2" : guidance.aspirationRoutes.length >= 3 ? "lg:grid-cols-3" : ""}`}>
        {guidance.aspirationRoutes.map(route => <article key={route.title} className="min-w-0 rounded-xl border border-stone-200 p-4">
          <h3 className="text-base font-bold">{route.title}</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-stone-700">{route.steps.map(step => <li key={step}>{step}</li>)}</ol>
          <p className="mt-3 rounded-lg bg-orange-50 p-3 text-xs font-semibold leading-5 text-stone-800">{route.verify}</p>
        </article>)}
      </div>
    </div> : null}
    {guidance.glossary.length ? <details className="rounded-xl border border-stone-200 px-3">
      <summary className="touch-link flex items-center gap-2 rounded-lg text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"><BookOpen size={16} className="shrink-0 text-leaf" aria-hidden="true" />Arti istilah di laporan ini</summary>
      <dl className="grid gap-3 pb-4 text-sm leading-6 sm:grid-cols-2">
        {guidance.glossary.map(term => <div key={term.term}><dt className="font-bold text-ink">{term.term}</dt><dd className="text-stone-600">{term.plain}</dd></div>)}
      </dl>
    </details> : null}
  </section>;
}
