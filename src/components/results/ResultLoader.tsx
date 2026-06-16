"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResultsView } from "@/components/results/ResultsView";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Submission } from "@/lib/types";

function isPersonalizedResultReady(submission: Submission) {
  return submission.narrativeStatus === "completed" || submission.report.narrative?.source === "gemini";
}

function shouldPollPersonalizedResult(submission: Submission) {
  return submission.narrativeStatus === "pending" || submission.narrativeStatus === "processing";
}

function ResultProcessingScreen({
  alreadySubmitted,
  status
}: {
  alreadySubmitted: boolean;
  status: Submission["narrativeStatus"];
}) {
  const statusCopy =
    status === "processing"
      ? "Analisis personal sedang dibuat."
      : status === "failed"
        ? "Hasil personal belum selesai. Silakan cek lagi beberapa menit lagi atau hubungi admin."
        : status === "skipped"
          ? "Hasil personal belum aktif. Silakan hubungi admin."
          : "Hasil kamu sudah masuk antrean.";

  return (
    <section className="rounded-md border border-black/10 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED]">
          <span className="h-3 w-3 animate-pulse rounded-full bg-coral" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-coral">Sedang diproses</p>
          <h1 className="mt-2 text-2xl font-black text-ink">Hasil kamu sedang dipersonalisasi</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
            {statusCopy} Kamu bisa cek kembali halaman ini dalam beberapa menit. Jangan submit ulang, karena jawaban kamu
            sudah tersimpan.
          </p>
          {alreadySubmitted ? (
            <p className="mt-3 rounded-md bg-marigold/15 p-3 text-sm leading-6 text-ink/70">
              Email Google ini sudah pernah submit. Begitu analisis personal selesai, hasil sebelumnya akan muncul di halaman ini.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ResultLoader({ alreadySubmitted = false }: { alreadySubmitted?: boolean }) {
  const router = useRouter();
  const { user, loading, getToken } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${alreadySubmitted ? "/already-submitted" : "/result"}`);
  }, [alreadySubmitted, loading, router, user]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      if (!user) return;
      try {
        const token = await getToken();
        const response = await fetch("/api/submissions/me", {
          headers: { authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Hasil belum ditemukan.");
        if (cancelled) return;
        setSubmission(data.submission);
        setError("");

        if (data.submission && shouldPollPersonalizedResult(data.submission)) {
          timer = setTimeout(load, 3500);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Gagal memuat hasil.");
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [getToken, user]);

  if (loading || (!submission && !error)) {
    return <div className="rounded-md border border-black/10 bg-white p-6 text-sm text-ink/70">Memuat hasil...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md border border-coral/30 bg-coral/10 p-5">
        <p className="text-sm text-ink">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/assessment")}>
          Buka Tes Jurusan
        </Button>
      </div>
    );
  }

  if (submission && !isPersonalizedResultReady(submission) && submission.narrativeStatus) {
    return <ResultProcessingScreen alreadySubmitted={alreadySubmitted} status={submission.narrativeStatus} />;
  }

  return (
    <div className="space-y-5">
      {alreadySubmitted ? (
        <div className="rounded-md border border-marigold/40 bg-marigold/15 p-4 text-sm leading-6 text-ink">
          Email Google ini sudah pernah submit. Hasil di bawah adalah hasil sebelumnya dan tidak digenerasi ulang.
        </div>
      ) : null}
      <ResultsView submission={submission!} />
    </div>
  );
}
