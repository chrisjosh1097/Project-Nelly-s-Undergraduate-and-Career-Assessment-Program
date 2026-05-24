"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";

export function Header() {
  const { user, signOut, loading } = useAuth();
  const assessmentHref = user ? "/assessment" : "/login?next=/assessment";

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="grid h-12 w-32 place-items-center overflow-hidden bg-white">
            <img
              src="/brand/project-nelly-logo-cropped.png"
              alt="Project Nelly"
              className="h-12 w-32 object-contain"
            />
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href={assessmentHref} className="hidden text-sm font-semibold text-ink/75 hover:text-ink sm:inline">
            Hasil Test
          </Link>
          {loading ? null : user ? (
            <Button variant="ghost" onClick={signOut} title="Keluar">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          ) : null}
          <Link
            href="/admin"
            className="hidden rounded-md px-2 py-1 text-xs font-medium text-moss/45 transition hover:bg-black/5 hover:text-moss sm:inline"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
