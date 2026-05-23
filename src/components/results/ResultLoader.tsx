"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResultsView } from "@/components/results/ResultsView";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Submission } from "@/lib/types";

export function ResultLoader({ alreadySubmitted = false }: { alreadySubmitted?: boolean }) {
  const router = useRouter();
  const { user, loading, getToken } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${alreadySubmitted ? "/already-submitted" : "/result"}`);
  }, [alreadySubmitted, loading, router, user]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const token = await getToken();
        const response = await fetch("/api/submissions/me", {
          headers: { authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Hasil belum ditemukan.");
        setSubmission(data.submission);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat hasil.");
      }
    }

    void load();
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
