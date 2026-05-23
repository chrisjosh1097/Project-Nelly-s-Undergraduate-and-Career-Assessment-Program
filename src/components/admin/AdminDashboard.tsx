"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ResultsView } from "@/components/results/ResultsView";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Submission } from "@/lib/types";
import { downloadBlob, formatDateTime } from "@/lib/utils";

interface Filters {
  school: string;
  className: string;
  topRecommendation: string;
  cluster: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

const initialFilters: Filters = {
  school: "",
  className: "",
  topRecommendation: "",
  cluster: "",
  status: "",
  dateFrom: "",
  dateTo: ""
};

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value.trim()) params.set(key, value.trim());
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

function topCounts(items: string[], limit = 10) {
  const counts = new Map<string, number>();
  for (const item of items.filter(Boolean)) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "id-ID"))
    .slice(0, limit);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function AdminDashboard() {
  const router = useRouter();
  const { user, loading, getToken } = useAuth();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const query = useMemo(() => buildQuery(filters), [filters]);
  const analytics = useMemo(() => {
    const topRecommendations = submissions.map((submission) => submission.report.topRecommendation);
    return {
      total: submissions.length,
      uniqueSchools: new Set(submissions.map((submission) => submission.school).filter(Boolean)).size,
      avgFit: average(topRecommendations.map((recommendation) => recommendation.overallFitScore)),
      avgAi: average(topRecommendations.map((recommendation) => recommendation.aiFutureResilienceScore)),
      topMajors: topCounts(topRecommendations.map((recommendation) => recommendation.majorName)),
      topClusters: topCounts(topRecommendations.map((recommendation) => recommendation.cluster)),
      constraints: topCounts(submissions.flatMap((submission) => submission.answers.personalConstraints)),
      activities: topCounts(submissions.flatMap((submission) => submission.answers.favoriteActivities)),
      skills: topCounts(submissions.flatMap((submission) => submission.answers.skillStrengths))
    };
  }, [submissions]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/admin");
  }, [loading, router, user]);

  async function loadSubmissions(nextQuery = query) {
    if (!user) return;
    setIsLoading(true);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/submissions${nextQuery}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal memuat submission.");
      setSubmissions(data.submissions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat submission.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user) void loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function exportCsv() {
    const token = await getToken();
    const response = await fetch(`/api/admin/export${query}`, {
      headers: { authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? "Export gagal.");
    }
    downloadBlob(await response.blob(), "project-nelly-submissions.csv");
  }

  if (loading || !user) {
    return <div className="rounded-md border border-black/10 bg-white p-6 text-sm text-ink/70">Memuat admin...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge tone="green">Admin</Badge>
          <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Submission Siswa</h1>
          <p className="mt-2 text-sm text-ink/65">Review hasil pilot dan export CSV untuk analisis sekolah.</p>
        </div>
        <Button onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <section className="rounded-md border border-black/10 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-2 font-bold text-ink">
          <Filter className="h-4 w-4" />
          Filter
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Sekolah">
            <Input value={filters.school} onChange={(event) => setFilters({ ...filters, school: event.target.value })} />
          </Field>
          <Field label="Kelas">
            <Input value={filters.className} onChange={(event) => setFilters({ ...filters, className: event.target.value })} />
          </Field>
          <Field label="Top recommendation">
            <Input
              value={filters.topRecommendation}
              onChange={(event) => setFilters({ ...filters, topRecommendation: event.target.value })}
            />
          </Field>
          <Field label="Cluster">
            <Input value={filters.cluster} onChange={(event) => setFilters({ ...filters, cluster: event.target.value })} />
          </Field>
          <Field label="Status">
            <Input value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} placeholder="completed" />
          </Field>
          <Field label="Dari tanggal">
            <Input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} />
          </Field>
          <Field label="Sampai tanggal">
            <Input type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => loadSubmissions()}>
            <Search className="h-4 w-4" />
            Terapkan
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFilters(initialFilters);
              void loadSubmissions("");
            }}
          >
            Reset
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total submissions", analytics.total],
          ["Sekolah unik", analytics.uniqueSchools],
          ["Rata-rata fit", analytics.avgFit],
          ["Rata-rata AI resilience", analytics.avgAi]
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-black/10 bg-white p-4 shadow-soft">
            <div className="text-xs font-semibold uppercase text-ink/55">{label}</div>
            <div className="mt-2 text-3xl font-black text-ink">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          ["Top 10 jurusan", analytics.topMajors],
          ["Top 10 cluster", analytics.topClusters],
          ["Constraint umum", analytics.constraints],
          ["Aktivitas umum", analytics.activities],
          ["Skill umum", analytics.skills]
        ].map(([title, rows]) => (
          <div key={String(title)} className="rounded-md border border-black/10 bg-white p-4 shadow-soft">
            <h2 className="font-bold text-ink">{String(title)}</h2>
            <div className="mt-3 space-y-2">
              {(rows as { label: string; count: number }[]).map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-ink/70">{row.label}</span>
                  <Badge tone="neutral">{row.count}</Badge>
                </div>
              ))}
              {(rows as unknown[]).length === 0 ? <p className="text-sm text-ink/50">Belum ada data.</p> : null}
            </div>
          </div>
        ))}
      </section>

      {error ? <div className="rounded-md border border-coral/30 bg-coral/10 p-4 text-sm text-ink">{error}</div> : null}

      <section className="overflow-hidden rounded-md border border-black/10 bg-white shadow-soft">
        <div className="border-b border-black/10 px-4 py-3 text-sm font-semibold text-ink">
          {isLoading ? "Memuat..." : `${submissions.length} submission`}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase text-ink/55">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Sekolah</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Jurusan sekolah</th>
                <th className="px-4 py-3">Top Major</th>
                <th className="px-4 py-3">Top Career Direction</th>
                <th className="px-4 py-3">Top Cluster</th>
                <th className="px-4 py-3">Fit</th>
                <th className="px-4 py-3">AI</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {submissions.map((submission) => (
                <tr key={submission.id} className="align-top">
                  <td className="px-4 py-3 text-ink/65">{formatDateTime(submission.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-ink">
                    {submission.fullName}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{submission.email}</td>
                  <td className="px-4 py-3 text-ink/70">{submission.school}</td>
                  <td className="px-4 py-3 text-ink/70">{submission.className}</td>
                  <td className="px-4 py-3 text-ink/70">{submission.answers.currentSchoolMajor}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{submission.report.topRecommendation.majorName}</div>
                  </td>
                  <td className="max-w-72 px-4 py-3 text-ink/70">{submission.report.topRecommendation.careerDirection}</td>
                  <td className="px-4 py-3 text-ink/70">{submission.report.topRecommendation.cluster}</td>
                  <td className="px-4 py-3 text-ink/70">{submission.report.topRecommendation.overallFitScore}</td>
                  <td className="px-4 py-3 text-ink/70">{submission.report.topRecommendation.aiFutureResilienceScore}</td>
                  <td className="px-4 py-3 text-ink/70">{submission.status}</td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" onClick={() => setSelected(submission)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-4">
          <div className="mx-auto max-w-5xl rounded-md bg-white p-4 shadow-soft">
            <div className="mb-4 flex justify-end">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Tutup
              </Button>
            </div>
            <ResultsView submission={selected} compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
