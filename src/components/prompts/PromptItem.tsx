import { ChevronDown } from "lucide-react";
import { CopyPromptButton } from "./CopyPrompt";

export function PromptItem({ id, title, purpose, text, hint, headingLevel = 3 }: {
  id: string; title: string; purpose: string; text: string; hint?: string; headingLevel?: 3 | 4;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  const detailsId = `prompt-${id}`;
  return <li className="min-w-0 rounded-xl border border-stone-200 bg-white p-3" data-prompt-id={id}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0 flex-1 basis-48">
        <Heading className="text-sm font-bold text-ink">{title}</Heading>
        <p className="mt-1 text-sm leading-6 text-stone-600">{purpose}</p>
      </div>
      <CopyPromptButton text={text} label={title} targetId={detailsId} />
    </div>
    <details id={detailsId} className="group/prompt mt-1">
      <summary className="touch-link list-none rounded-lg text-sm font-semibold text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">
        Lihat isi prompt <ChevronDown size={16} aria-hidden="true" className="transition group-open/prompt:rotate-180" />
      </summary>
      <p data-prompt-text className="whitespace-pre-line rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-700">{text}</p>
    </details>
    {hint ? <p className="mt-1 text-xs leading-5 text-stone-500">{hint}</p> : null}
  </li>;
}
