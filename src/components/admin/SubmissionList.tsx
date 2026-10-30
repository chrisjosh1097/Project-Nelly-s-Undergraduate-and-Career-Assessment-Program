import type { Submission } from "@/lib/types";
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
  submissions: Submission[];
  onSelect: (submission: Submission) => void;
  onReset?: (email: string) => void;
  busy?: boolean;
}) {
  if (!submissions.length)
    return (
      <p className="panel text-sm text-stone-600">
        Belum ada asesmen yang sesuai.
      </p>
    );
  const actions = (s: Submission, mode: string) => (
    <div className="flex flex-wrap gap-2">
      <Button
        id={`report-${mode}-${s.id}`}
        variant="secondary"
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
  );
  const status = (s: Submission) => (
    <div className="flex flex-wrap gap-2">
      <Badge>{s.status}</Badge>
      <Badge>Narasi: {s.narrativeStatus ?? "skipped"}</Badge>
    </div>
  );
  return (
    <>
      <div className="space-y-3 md:hidden">
        {submissions.map((s) => (
          <article className="panel space-y-4" key={s.id}>
            <div>
              <h3 className="text-lg font-bold">{s.fullName}</h3>
              <p className="mt-1 text-sm text-stone-600">
                {s.school} · {s.className}
              </p>
              <p className="mt-1 text-xs text-stone-600">{s.email}</p>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-stone-600">Arah pendidikan</dt>
                <dd>{educationPathwayLabel(s.answers.educationPathway)}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-600">Rekomendasi utama</dt>
                <dd className="font-semibold">
                  {s.report?.topRecommendation.majorName ?? "Sedang diproses"}
                </dd>
              </div>
            </dl>
            {status(s)}
            {actions(s, "mobile")}
          </article>
        ))}
      </div>
      <div className="hidden rounded-2xl border border-stone-200 bg-white p-3 md:block">
        <table className="admin-records">
          <thead>
            <tr>
              <th>Siswa / sekolah</th>
              <th>Jalur & rekomendasi</th>
              <th>Status</th>
              <th>Aksi</th>
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
                  <p>{educationPathwayLabel(s.answers.educationPathway)}</p>
                  <p className="mt-1 font-semibold">
                    {s.report?.topRecommendation.majorName ?? "Sedang diproses"}
                  </p>
                  {s.report ? (
                    <p className="mt-2 text-xs text-stone-600">
                      Fit {s.report.topRecommendation.overallFitScore} · AI{" "}
                      {s.report.topRecommendation.aiFutureResilienceScore}
                    </p>
                  ) : null}
                </td>
                <td className="max-w-44 align-top">{status(s)}</td>
                <td className="align-top">{actions(s, "desktop")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
