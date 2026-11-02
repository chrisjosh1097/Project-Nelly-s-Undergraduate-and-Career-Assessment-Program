"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

// Tappable term with a short plain-language explanation (glossary chip).
export function Term({ label, children, definition }: { label: string; children?: ReactNode; definition: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);
  return <span ref={ref} className="relative inline-flex">
    <button type="button" aria-expanded={open} aria-controls={id} aria-label={`${label}: arti istilah`}
      onClick={() => setOpen(v => !v)}
      className="-my-3.5 inline-flex min-h-11 items-center gap-1 rounded-full underline decoration-dotted underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">
      {children ?? label}
    </button>
    {open ? <span id={id} role="note" className="absolute left-0 top-full z-30 mt-2 block w-64 max-w-[80vw] rounded-xl border border-stone-200 bg-white p-3 text-xs font-normal leading-5 text-stone-700 shadow-lg">
      <span className="block font-bold text-ink">{label}</span>{definition}
    </span> : null}
  </span>;
}
