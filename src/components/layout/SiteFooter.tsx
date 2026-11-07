import Link from "next/link";
import { ArrowUpRight, Globe2 } from "lucide-react";

const InstagramIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
const LinkedInIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21h-4V9Z" /></svg>;
export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200">
      <div className="mx-auto max-w-6xl px-5 py-9">
        <div className="flex flex-wrap justify-between gap-5">
          <div>
            <p className="font-bold">Project Nelly 101</p>
            <p className="mt-2 max-w-md text-sm leading-7 text-stone-600">
              Kenali diri, temukan arah. Hasil asesmen adalah bahan refleksi,
              bukan keputusan final.
            </p>
          </div>
          <nav aria-label="Project Nelly" className="flex flex-wrap gap-3">
            {[
              { label: "Website", href: "https://projectnelly.com/", Icon: () => <Globe2 size={18} aria-hidden="true" /> },
              {
                label: "Instagram",
                href: "https://www.instagram.com/project.nelly/",
                Icon: InstagramIcon,
              },
              {
                label: "LinkedIn",
                href: "https://www.linkedin.com/company/project-nelly/",
                Icon: LinkedInIcon,
              },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${link.label} (tab baru)`}
                className="touch-link rounded-full border border-stone-200 bg-white px-4 underline-offset-4 hover:border-orange-300 hover:bg-orange-50 hover:underline"
              >
                <span className="text-leaf"><link.Icon /></span>
                {link.label}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5 text-xs text-stone-600">
          <span>© Project Nelly · Untuk siswa SMA & SMK Indonesia</span>
          <Link
            href="/admin"
            className="touch-link underline underline-offset-4"
          >
            Admin / Guru BK
          </Link>
        </div>
      </div>
    </footer>
  );
}
