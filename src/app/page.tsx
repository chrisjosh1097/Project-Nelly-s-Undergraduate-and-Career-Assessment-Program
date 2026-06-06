import Link from "next/link";
import { ArrowRight, BarChart3, FileText, LockKeyhole, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="space-y-12">
      <section className="grid min-h-[calc(100vh-9rem)] items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="max-w-2xl">
          <Badge tone="green">Untuk siswa SMA/SMK Indonesia</Badge>
          <h1 className="mt-5 text-4xl font-black leading-tight text-ink sm:text-5xl">
            Tes Jurusan & Karier Project Nelly
          </h1>
          <p className="mt-5 text-lg leading-8 text-ink/75">
            Temukan arah jurusan kuliah dan karier yang sesuai dengan minat, skill, latar sekolah, batasan pribadi,
            dan kesiapan masa depan.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/login?next=/assessment">
              <Button>
                Mulai Tes Jurusan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 max-w-xl rounded-md border border-marigold/40 bg-marigold/15 p-4 text-sm leading-6 text-ink/75">
            <strong>Disclaimer: hasil ini hanya analisis berdasarkan jawaban yang kamu isi, bukan fakta mutlak atau keputusan final.</strong>{" "}
            Gunakan sebagai bahan refleksi untuk membantu kamu memilih jurusan dan arah karier.
          </p>
        </div>

        <div className="relative">
          <div className="rounded-md border border-black/10 bg-white p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-ink">Contoh Hasil</div>
              </div>
              <Badge tone="gold">AI resilience</Badge>
            </div>
            <div className="rounded-md bg-[#FFF7ED] p-5 ring-1 ring-leaf/15">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-leaf text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-ink/50">Rekomendasi Utama</div>
                  <div className="text-2xl font-black text-ink">Sistem Informasi</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-white p-4">
                  <BarChart3 className="h-5 w-5 text-leaf" />
                  <div className="mt-3 text-3xl font-black text-ink">86</div>
                  <div className="text-xs font-semibold text-ink/55">Fit score</div>
                </div>
                <div className="rounded-md bg-white p-4">
                  <LockKeyhole className="h-5 w-5 text-moss" />
                  <div className="mt-3 text-3xl font-black text-ink">78</div>
                  <div className="text-xs font-semibold text-ink/55">AI resilience</div>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm text-ink/70">
                <p>- Cocok dengan minat teknologi, komunikasi, dan problem solving.</p>
                <p>- Arah karier: business analyst, product manager, system analyst.</p>
                <p>- AI bisa menjadi alat bantu, bukan pengganti penuh.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: BarChart3,
            title: "Skor transparan",
            body: "Rekomendasi dihitung dari interest, skill, mapel, gaya kerja, problem area, dan constraint."
          },
          {
            icon: LockKeyhole,
            title: "Submit satu kali",
            body: "Satu email Google terverifikasi hanya bisa mengirim satu assessment."
          },
          {
            icon: FileText,
            title: "Laporan PDF",
            body: "Siswa dapat mengunduh jawaban dan laporan rekomendasi untuk diskusi dengan guru BK."
          }
        ].map((item) => (
          <article key={item.title} className="rounded-md border border-black/10 bg-white p-5">
            <item.icon className="h-5 w-5 text-leaf" />
            <h2 className="mt-4 font-bold text-ink">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">{item.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
