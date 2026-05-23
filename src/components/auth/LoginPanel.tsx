"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/assessment";
  const { user, loading, configured, signIn } = useAuth();

  async function handleLogin() {
    await signIn();
    router.replace(next);
  }

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, next, router, user]);

  if (!configured) {
    return (
      <div className="rounded-md border border-coral/30 bg-coral/10 p-5 text-sm text-ink">
        Firebase belum dikonfigurasi. Isi environment variable di `.env.local` sebelum mencoba login.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-md border border-black/10 bg-white p-6 shadow-soft">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-leaf/10 text-leaf">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">Login untuk mulai tes</h1>
          <p className="text-sm text-ink/65">Gunakan email Google terverifikasi sebelum mengisi assessment.</p>
        </div>
      </div>
      <Button className="w-full" onClick={handleLogin} disabled={loading}>
        <Chrome className="h-4 w-4" />
        Masuk dengan Google
      </Button>
    </div>
  );
}
