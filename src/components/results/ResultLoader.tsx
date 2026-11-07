"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { ResultsView } from "./ResultsView";
import { useAuth } from "@/components/auth/AuthProvider";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import type { Submission } from "@/lib/types";
export function ResultLoader({
  alreadySubmitted = false,
}: {
  alreadySubmitted?: boolean;
}) {
  const { user } = useAuth();
  // A new identity gets a fresh state tree before any old report can render.
  return (
    <AccountResults
      key={`${user?.uid ?? "signed-out"}:${user?.email ?? ""}`}
      alreadySubmitted={alreadySubmitted}
    />
  );
}
function AccountResults({ alreadySubmitted }: { alreadySubmitted: boolean }) {
  const router = useRouter();
  const { user, loading, getToken } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!loading && !user)
      router.replace(
        `/login?next=${alreadySubmitted ? "/already-submitted" : "/result"}`,
      );
  }, [loading, user, router, alreadySubmitted]);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const token = await getToken();
        const response = await fetch("/api/submissions/me", {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (cancelled) return;
        if (response.status === 404) {
          setSubmission(null);
          setLoaded(true);
          setError("");
          return;
        }
        if (response.status === 401 || response.status === 403)
          setSubmission(null);
        if (!response.ok)
          throw new Error(data.error ?? "Hasil belum dapat dimuat.");
        if (cancelled) return;
        setSubmission(data.submission ?? null);
        setLoaded(true);
        setError("");
        if (
          ["pending", "processing"].includes(
            data.submission?.narrativeStatus,
          ) ||
          data.submission?.status === "processing"
        )
          timer = setTimeout(load, 3500);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal memuat hasil.");
          setLoaded(true);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [user, getToken, retry]);
  if (loading || !user || !loaded)
    return <StatusMessage>Memuat hasil…</StatusMessage>;
  if (!submission && error)
    return (
      <Panel>
        <StatusMessage tone="error">{error}</StatusMessage>
        <Button
          className="mt-5"
          onClick={() => {
            setLoaded(false);
            setRetry((v) => v + 1);
          }}
        >
          <RotateCcw size={16} aria-hidden="true" />
          Coba lagi
        </Button>
      </Panel>
    );
  if (!submission)
    return (
      <Panel>
        <h1 className="section-heading">Belum ada hasil asesmen.</h1>
        <p className="my-5 text-sm text-stone-600">
          Mulai dengan mengenali minat dan kekuatanmu.
        </p>
        <Link
          className="touch-link rounded-full bg-leaf px-6 text-white hover:bg-orange-800"
          href="/assessment"
        >
          Mulai asesmen <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </Panel>
    );
  if (!submission.report)
    return (
      <Panel>
        <StatusMessage>
          Jawaban tersimpan. Laporan sedang diproses; jangan kirim ulang.
        </StatusMessage>
        <Button className="mt-5" onClick={() => setRetry((v) => v + 1)}>
          <RefreshCw size={16} aria-hidden="true" />
          Periksa lagi
        </Button>
      </Panel>
    );
  const pending = ["pending", "processing"].includes(
    submission.narrativeStatus ?? "",
  );
  return (
    <div className="space-y-5">
      {alreadySubmitted ? (
        <StatusMessage>
          Email ini sudah pernah mengirim asesmen. Hasil di bawah adalah hasil
          sebelumnya dan tidak digenerasi ulang.
        </StatusMessage>
      ) : null}
      {pending ? (
        <StatusMessage>
          Hasil utama sudah dapat dibaca. Penjelasan personal sedang diperkaya
          dan akan diperbarui otomatis.
        </StatusMessage>
      ) : submission.narrativeStatus === "failed" ||
        submission.narrativeStatus === "skipped" ? (
        <StatusMessage>
          Penjelasan berbasis aturan sudah tersedia. Pengayaan personal belum
          tersedia; skor dan rekomendasi tetap dapat digunakan.
        </StatusMessage>
      ) : null}
      {error ? (
        <StatusMessage tone="error">
          {error}
          <Button
            variant="secondary"
            className="ml-3"
            onClick={() => setRetry((v) => v + 1)}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Coba lagi
          </Button>
        </StatusMessage>
      ) : null}
      <ResultsView submission={submission} />
    </div>
  );
}
