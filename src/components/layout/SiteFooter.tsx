import Link from "next/link";

const links = [
  { label: "Website", href: "https://projectnelly.com/", icon: "/social/web-logo.png" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/project-nelly/", icon: "/social/linkedin-logo.png" },
  { label: "Instagram", href: "https://www.instagram.com/project.nelly/", icon: "/social/instagram-logo.png" }
];

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-black/10 bg-[#F3F4F6]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.25fr] lg:items-center">
        <div className="rounded-md bg-white/70 p-6">
          <img
            src="/brand/project-nelly-logo-full.png"
            alt="Project Nelly"
            className="h-auto w-56 max-w-full object-contain"
          />
          <p className="mt-4 text-sm font-semibold text-ink/60">© 2024</p>
        </div>
        <div className="space-y-4">
          <p className="max-w-xl text-sm leading-6 text-ink/65">
            Project Nelly membantu siswa mengenali arah jurusan dan karier melalui refleksi terstruktur, data, dan edukasi masa depan.
          </p>
          <div className="flex flex-wrap gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                title={link.label}
                className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-white p-2 ring-1 ring-black/10 transition hover:bg-[#FFF7ED] hover:ring-orange-500/40"
              >
                <img src={link.icon} alt="" className="h-7 w-7 object-contain" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
