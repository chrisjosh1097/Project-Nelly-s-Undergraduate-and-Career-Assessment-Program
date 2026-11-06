import type { AdminSubmissionSummary } from "@/lib/admin/submissions";
import { narrativeStatusLabel } from "@/lib/admin/labels";
import { educationPathwayLabel } from "@/lib/assessment/pathways";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
export function SubmissionList({
  submissions,
  onSelect,
  onReset,
  busy = false,
}: {
  submissions: AdminSubmissionSummary[];
  onSelect: (submission: AdminSubmissionSummary) => void;
  onReset?: (email: string) => void;
  busy?: boolean;
}) {
  if (!submissions.length)
    return (
      <p className="panel text-sm text-stone-600">
        Belum ada asesmen yang sesuai.
      </p>
    );
  return (
    <div
      role="region"
      aria-label="Tabel asesmen siswa, geser untuk melihat semua kolom"
      tabIndex={0}
      className="max-w-full overflow-x-auto rounded-2xl border border-stone-200 bg-white p-3"
    >
      <table className="admin-records" style={{ minWidth: 760 }}>
        <caption className="sr-only">
          Data asesmen siswa sesuai pencarian dan filter
        </caption>
        <thead>
          <tr>
            <th scope="col">Siswa / sekolah</th>
            <th scope="col">Jalur & rekomendasi</th>
            <th scope="col">Status</th>
            <th scope="col">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id}>
              <td className="max-w-56 align-top">
                <strong>{s.fullName}</strong>
                <p>
                  {s.school} · {s.className}
                </p>
                <p className="text-xs text-stone-600">{s.email}</p>
                <p className="text-xs text-stone-600">
                  {formatDateTime(s.createdAt)}
                </p>
              </td>
              <td className="max-w-64 align-top">
                <p>{educationPathwayLabel(s.educationPathway)}</p>
                <p className="mt-1 font-semibold">
                  {s.topRecommendation?.majorName ?? "Sedang diproses"}
                </p>
                {s.topRecommendation ? (
                  <p className="mt-2 text-xs text-stone-600">
                    Fit {s.topRecommendation.overallFitScore} · AI{" "}
                    {s.topRecommendation.aiFutureResilienceScore}
                  </p>
                ) : null}
              </td>
              <td className="max-w-44 align-top">
                <div className="flex flex-wrap gap-2">
                  <Badge>{s.status}</Badge>
                  <Badge>Narasi: {narrativeStatusLabel(s.narrativeStatus)}</Badge>
                </div>
              </td>
              <td className="align-top">
                <div className="flex flex-wrap gap-2">
                  <Button
                    id={`report-${s.id}`}
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onSelect(s)}
                    aria-label={`Lihat laporan ${s.fullName}`}
                  >
                    Lihat laporan
                  </Button>
                  {onReset ? (
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => onReset(s.email)}
                      aria-label={`Hapus attempt ${s.fullName}`}
                    >
                      Hapus attempt
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
