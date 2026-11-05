"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/** "Salin" button. Never place inside <summary>. Falls back to selecting the text when clipboard is unavailable. */
export function CopyPromptButton({ text, label, targetId }: { text: string; label: string; targetId?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const selectFallback = () => {
    const el = targetId ? document.getElementById(targetId) : null;
    if (el) {
      if (el instanceof HTMLDetailsElement) el.open = true;
      const range = document.createRange();
      range.selectNodeContents(el.querySelector("[data-prompt-text]") ?? el);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setState("manual");
  };
  const copy = async () => {
    clearTimeout(timer.current);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch { selectFallback(); }
    timer.current = setTimeout(() => setState("idle"), 2500);
  };
  return <span className="inline-flex flex-col items-start gap-1">
    <button type="button" onClick={copy} aria-label={`Salin prompt: ${label}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-orange-300 bg-white px-4 text-sm font-semibold text-leaf hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">
      {state === "copied" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      {state === "copied" ? "Tersalin" : "Salin"}
    </button>
    <span role="status" aria-live="polite" className="text-xs text-stone-600">
      {state === "copied" ? "Prompt disalin" : state === "manual" ? "Teks sudah dipilih. Salin manual dari teks di bawah." : ""}
    </span>
  </span>;
}

export const PROMPT_CAUTION = "Jawaban AI bisa salah. Cek ulang ke sumber resmi, guru BK, atau orang yang bekerja di bidang itu.";
