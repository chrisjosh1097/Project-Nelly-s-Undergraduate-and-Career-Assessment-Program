"use client";

import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";

export function Header() {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#F8FAF4]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-leaf text-white">N</span>
          <span>Project Nelly</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/assessment" className="hidden text-sm font-semibold text-ink/75 hover:text-ink sm:inline">
            Tes Jurusan
          </Link>
          <Link href="/admin" className="hidden text-sm font-semibold text-ink/75 hover:text-ink sm:inline">
            Admin
          </Link>
          {loading ? null : user ? (
            <Button variant="ghost" onClick={signOut} title="Keluar">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="secondary">
                <ShieldCheck className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
