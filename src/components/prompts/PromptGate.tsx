"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Panel } from "@/components/ui/Panel";
import { promptValuesFor, type PromptValues } from "@/lib/prompts/fill";
import type { Submission } from "@/lib/types";
import { PromptBank } from "./PromptBank";

type State = { status: "loading" } | { status: "locked" } | { status: "error"; message: string } | { status: "ready"; values: PromptValues };

/** Bank Prompt opens only for signed-in students who already have a report. Query values win over report values. */
export function PromptGate({ initial }: { initial: PromptValues }) {
  const router = useRouter();
  const { user, loading, getToken } = useAuth();
  const [state, setState] = useState<State>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const initialKey = JSON.stringify(initial);
  const query = useMemo(() => JSON.parse(initialKey) as PromptValues, [initialKey]);
  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/prompt");
  }, [loading, user, router]);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/submissions/me", { headers: { authorization: `Bearer ${await getToken()}` } });
        if (cancelled) return;
        if (response.status === 404) return setState({ status: "locked" });
        const data = await response.json() as { submission?: Submission; error?: string };
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error ?? "Bank Prompt belum dapat dibuka.");
        const top = data.submission?.report?.topRecommendation;
        if (!data.submission || !top) return setState({ status: "locked" });
        const fromReport = promptValuesFor(data.submission.answers, top);
        const values: PromptValues = { ...fromReport };
        for (const [key, value] of Object.entries(query) as [keyof PromptValues, string | undefined][]) if (value?.trim()) values[key] = value;
        setState({ status: "ready", values });
      } catch (e) {
        if (!cancelled) setState({ status: "error", message: e instanceof Error ? e.message : "Bank Prompt belum dapat dibuka." });
      }
    })();
    return () => { cancelled = true; };
  }, [user, getToken, query, retry]);

  if (loading || !user || state.status === "loading") return <StatusMessage>Memeriksa hasil asesmenmu…</StatusMessage>;
  if (state.status === "error") return <Panel>
    <StatusMessage tone="error">{state.message}</StatusMessage>
    <button type="button" onClick={() => { setState({ status: "loading" }); setRetry(v => v + 1); }}
      className="mt-4 inline-flex min-h-11 items-center rounded-full bg-leaf px-5 text-sm font-semibold text-white hover:bg-orange-800">Coba lagi</button>
  </Panel>;
  if (state.status === "locked") return <Panel>
    <h2 className="flex items-center gap-2 text-lg font-bold"><Lock size={18} className="shrink-0 text-leaf" aria-hidden="true" />Bank Prompt terbuka setelah kamu punya hasil</h2>
    <p className="mt-2 text-sm leading-6 text-stone-700">Selesaikan asesmen dulu. Setelah hasilmu keluar, prompt akan terisi otomatis dari jawabanmu.</p>
    <Link href="/assessment" className="touch-link mt-3 rounded-full bg-leaf px-6 text-white hover:bg-orange-800">Mulai asesmen</Link>
  </Panel>;
  return <PromptBank initial={state.values} />;
}
