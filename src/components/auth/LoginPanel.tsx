"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Chrome, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { completeRedirectSignIn } from "@/lib/firebase/client";

function friendlyLoginError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("auth/unauthorized-domain")) {
    return "Domain website belum ditambahkan di Firebase Authentication. Tambahkan projectnellyfutureassessment.com dan projectnellyfutureassessment.netlify.app ke Authorized domains.";
  }
  if (message.includes("auth/operation-not-allowed")) {
    return "Google Sign-In belum diaktifkan di Firebase Authentication.";
  }
  if (message.includes("auth/popup-closed-by-user")) {
    return "Login dibatalkan sebelum selesai. Coba lagi dengan tombol Google.";
  }
  if (message.includes("auth/web-storage-unsupported")) {
    return "Browser memblokir penyimpanan login. Coba buka di browser utama dan izinkan cookie/storage.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Koneksi ke Firebase gagal. Periksa internet atau coba refresh halaman.";
  }
  return "Login Google belum berhasil. Periksa konfigurasi Firebase Auth dan coba lagi.";
}

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/assessment";
  const { user, loading, configured, signIn } = useAuth();
  const [error, setError] = useState("");
  const [isSigningIn, setSigningIn] = useState(false);

  async function handleLogin() {
    setError("");
    setSigningIn(true);
    try {
      const signedInUser = await signIn();
      if (signedInUser) router.replace(next);
      else setSigningIn(false);
    } catch (loginError) {
      setError(friendlyLoginError(loginError));
      setSigningIn(false);
    }
  }

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, next, router, user]);

  useEffect(() => {
    if (!configured) return;
    let active = true;

    completeRedirectSignIn()
      .then((redirectUser) => {
        if (active && redirectUser) router.replace(next);
      })
      .catch((redirectError) => {
        if (active) setError(friendlyLoginError(redirectError));
      });

    return () => {
      active = false;
    };
  }, [configured, next, router]);

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
      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-coral/25 bg-coral/10 p-3 text-sm leading-6 text-ink">
          <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-coral" />
          <span>{error}</span>
        </div>
      ) : null}
      <Button className="w-full" onClick={handleLogin} disabled={loading || isSigningIn}>
        <Chrome className="h-4 w-4" />
        {isSigningIn ? "Mengarahkan ke Google..." : "Masuk dengan Google"}
      </Button>
    </div>
  );
}
