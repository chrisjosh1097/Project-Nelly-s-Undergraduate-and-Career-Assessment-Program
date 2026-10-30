"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Compass, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

export function Header() {
  const path = usePathname();
  const { user, signOut, loading } = useAuth();
  const assessment = path === "/assessment",
    admin = path.startsWith("/admin");
  const links = [
    { href: "/", label: "Beranda", icon: Home },
    {
      href: user ? "/assessment" : "/login?next=/assessment",
      label: "Asesmen",
      icon: ClipboardList,
    },
    {
      href: user ? "/result" : "/login?next=/result",
      label: "Hasilmu",
      icon: Compass,
    },
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link
          href="/"
          aria-label="Project Nelly — beranda"
          className="brand-link"
        >
          <img
            src="/brand/project-nelly-logo-cropped.png"
            width="918"
            height="666"
            alt="Project Nelly"
          />
          <span>101 SERIES</span>
        </Link>
        {assessment ? (
          <span className="eyebrow hidden sm:block">
            Kenali diri, temukan arah
          </span>
        ) : null}
        {!assessment && !admin ? (
          <nav aria-label="Navigasi siswa" className="student-nav">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                aria-current={path === href ? "page" : undefined}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        ) : null}
        {admin ? (
          <Link href="/" className="touch-link">
            <ArrowLeft size={16} /> Beranda
          </Link>
        ) : null}
        {!admin && !loading ? (
          user ? (
            <Button
              variant="ghost"
              onClick={signOut}
              aria-label="Keluar dari akun"
            >
              <LogOut size={19} />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          ) : (
            <Link href="/login" className="touch-link">
              Masuk
            </Link>
          )
        ) : null}
      </div>
    </header>
  );
}
