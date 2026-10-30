import type { SubmissionFilters } from "@/lib/submissions/filters";
import { Field, Input } from "@/components/ui/Input";
export function AdminFilters({
  filters,
  onChange,
}: {
  filters: SubmissionFilters;
  onChange: (filters: SubmissionFilters) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Cari semua asesmen">
        <Input
          type="search"
          placeholder="Nama, email, sekolah, kelas, jurusan, cluster"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </Field>
      {[
        { key: "school", label: "Sekolah" },
        { key: "className", label: "Kelas" },
        { key: "topRecommendation", label: "Rekomendasi utama" },
        { key: "cluster", label: "Cluster" },
        { key: "dateFrom", label: "Dari tanggal", type: "date" },
        { key: "dateTo", label: "Sampai tanggal", type: "date" },
      ].map((f) => (
        <Field key={f.key} label={f.label}>
          <Input
            type={f.type ?? "text"}
            value={filters[f.key as keyof SubmissionFilters] ?? ""}
            onChange={(e) => onChange({ ...filters, [f.key]: e.target.value })}
          />
        </Field>
      ))}
      <Field label="Status">
        <select
          aria-label="Status"
          className="w-full rounded-xl border border-stone-500 bg-white px-3 py-3"
          value={filters.status ?? ""}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        >
          <option value="">Semua status</option>
          <option value="completed">Selesai</option>
          <option value="processing">Diproses</option>
          <option value="failed">Gagal</option>
        </select>
      </Field>
      <Field label="Arah pendidikan">
        <select
          aria-label="Arah pendidikan"
          className="w-full rounded-xl border border-stone-500 bg-white px-3 py-3"
          value={filters.educationPathway ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              educationPathway: (e.target.value ||
                undefined) as SubmissionFilters["educationPathway"],
            })
          }
        >
          <option value="">Semua jalur</option>
          <option value="university">Universitas / Akademik</option>
          <option value="vocational">Vokasi / Terapan</option>
          <option value="exploring">Menjelajahi keduanya</option>
          <option value="unrecorded">Belum tercatat</option>
        </select>
      </Field>
    </div>
  );
}
