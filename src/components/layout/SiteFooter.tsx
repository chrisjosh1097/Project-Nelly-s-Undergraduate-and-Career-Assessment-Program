import Link from "next/link";

const links = [
  { label: "Website", href: "https://projectnelly.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/project-nelly/" },
  { label: "Instagram", href: "https://www.instagram.com/project.nelly/" }
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
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-black/10 transition hover:bg-leaf hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
