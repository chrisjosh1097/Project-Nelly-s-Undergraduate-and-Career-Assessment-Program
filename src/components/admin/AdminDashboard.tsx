"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Filter, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ResultsView } from "@/components/results/ResultsView";
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

function BarChart({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <div className="rounded-md border border-black/10 bg-white p-4 shadow-soft">
      <h2 className="font-bold text-ink">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-ink/65">
              <span>{row.label}</span>
              <span>{row.count}</span>
            </div>
            <div className="h-3 rounded-full bg-black/10">
              <div className="h-3 rounded-full bg-leaf" style={{ width: `${Math.max((row.count / max) * 100, 6)}%` }} />
            </div>
          </div>
        ))}
        {rows.length === 0 ? <p className="text-sm text-ink/50">Belum ada data.</p> : null}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setLoggingIn] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingAttempt, setIsResettingAttempt] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

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
      gender: topCounts(submissions.map((submission) => submission.answers.gender ?? "Belum ada data"), 5),
      age: topCounts(submissions.map((submission) => submission.answers.age ?? "Belum ada data"), 10),
      constraints: topCounts(submissions.flatMap((submission) => submission.answers.personalConstraints)),
      activities: topCounts(submissions.flatMap((submission) => submission.answers.favoriteActivities)),
      skills: topCounts(submissions.flatMap((submission) => submission.answers.skillStrengths))
    };
  }, [submissions]);

  async function loadSubmissions(nextQuery = query) {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/submissions${nextQuery}`, {
        credentials: "include"
      });
      const data = await response.json();
      if (response.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Gagal memuat submission.");
      setNeedsLogin(false);
      setSubmissions(data.submissions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat submission.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loginAdmin() {
    setLoggingIn(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Login admin gagal.");
      setNeedsLogin(false);
      setLoginPassword("");
      await loadSubmissions("");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login admin gagal.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function logoutAdmin() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setNeedsLogin(true);
    setSubmissions([]);
  }

  async function exportCsv() {
    const response = await fetch(`/api/admin/export${query}`, {
      credentials: "include"
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? "Export gagal.");
    }
    downloadBlob(await response.blob(), "project-nelly-submissions.csv");
  }

  async function resetSubmissionAttempt(targetEmail = resetEmail) {
    const email = targetEmail.trim().toLowerCase();
    if (!email) {
      setResetMessage("Masukkan email siswa yang attempt-nya ingin dihapus.");
      return;
    }

    const confirmed = window.confirm(`Hapus attempt untuk ${email}? Setelah dihapus, siswa bisa submit ulang.`);
    if (!confirmed) return;

    setIsResettingAttempt(true);
    setError("");
    setResetMessage("");
    try {
      const response = await fetch("/api/admin/submissions/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email })
      });
      const data = (await response.json().catch(() => ({}))) as { deleted?: boolean; email?: string; error?: string };
      if (response.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Gagal menghapus attempt.");

      setResetMessage(
        data.deleted
          ? `Attempt ${data.email ?? email} sudah dihapus. Siswa bisa mengisi ulang.`
          : `Submission untuk ${data.email ?? email} tidak ditemukan.`
      );
      setResetEmail("");
      if (selected?.email.toLowerCase() === email) setSelected(null);
      await loadSubmissions();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Gagal menghapus attempt.");
    } finally {
      setIsResettingAttempt(false);
    }
  }

  if (needsLogin) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-black/10 bg-white p-6 shadow-soft">
        <Badge tone="green">Admin</Badge>
        <h1 className="mt-3 text-2xl font-bold text-ink">Login Admin</h1>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          Masukkan email dan password admin untuk membuka dashboard analytics.
        </p>
        <div className="mt-6 space-y-4">
          <Field label="Email admin">
            <Input
              value={loginEmail}
              placeholder="email admin"
              onChange={(event) => setLoginEmail(event.target.value)}
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={loginPassword}
              placeholder="Password admin"
              onChange={(event) => setLoginPassword(event.target.value)}
            />
          </Field>
          {error ? <div className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-ink">{error}</div> : null}
          <Button className="w-full" onClick={loginAdmin} disabled={isLoggingIn}>
            {isLoggingIn ? "Memeriksa..." : "Masuk Dashboard"}
          </Button>
        </div>
      </div>
    );
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
        <Button variant="secondary" onClick={logoutAdmin}>
          Logout Admin
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

      <section className="rounded-md border border-coral/20 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 font-bold text-ink">
              <Trash2 className="h-4 w-4 text-coral" />
              Hapus Attempt Siswa
            </div>
            <p className="text-sm leading-6 text-ink/65">
              Gunakan ini jika siswa salah isi atau perlu mengulang. Submission lama akan dihapus dari database sehingga email tersebut bisa submit lagi.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <Input
              type="email"
              value={resetEmail}
              placeholder="email siswa"
              onChange={(event) => setResetEmail(event.target.value)}
              className="sm:min-w-72"
            />
            <Button variant="danger" onClick={() => resetSubmissionAttempt()} disabled={isResettingAttempt}>
              <Trash2 className="h-4 w-4" />
              {isResettingAttempt ? "Menghapus..." : "Hapus Attempt"}
            </Button>
          </div>
        </div>
        {resetMessage ? <p className="mt-3 text-sm font-semibold text-ink/70">{resetMessage}</p> : null}
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
        <BarChart title="Count Gender" rows={analytics.gender} />
        <BarChart title="Count Umur" rows={analytics.age} />
        <BarChart title="Top Rekomendasi" rows={analytics.topMajors} />
        {[
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
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Umur</th>
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
                  <td className="px-4 py-3 text-ink/70">{submission.answers.gender ?? "-"}</td>
                  <td className="px-4 py-3 text-ink/70">{submission.answers.age ?? "-"}</td>
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
                  <td className="space-y-2 px-4 py-3">
                    <Button variant="secondary" onClick={() => setSelected(submission)}>
                      View
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => resetSubmissionAttempt(submission.email)}
                      disabled={isResettingAttempt}
                      title="Hapus attempt agar siswa bisa submit ulang"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
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
