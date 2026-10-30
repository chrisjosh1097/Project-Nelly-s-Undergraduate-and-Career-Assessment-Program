"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Filter, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ResultsView } from "@/components/results/ResultsView";
import { AdminFilters } from "./AdminFilters";
import { SubmissionList } from "./SubmissionList";
import { educationPathwayLabel } from "@/lib/assessment/pathways";
import type { Submission } from "@/lib/types";
import type { SubmissionFilters } from "@/lib/submissions/filters";
import { downloadBlob } from "@/lib/utils";
function buildQuery(filters: SubmissionFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value?.trim()) params.set(key, value.trim());
  const text = params.toString();
  return text ? "?" + text : "";
}
function counts(items: string[]) {
  const m = new Map<string, number>();
  for (const value of items.filter(Boolean))
    m.set(value, (m.get(value) ?? 0) + 1);
  return [...m]
    .map(([label, count]) => ({ label, count }))
    .sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label, "id-ID"),
    )
    .slice(0, 10);
}
function average(items: number[]) {
  return items.length
    ? Math.round(items.reduce((a, b) => a + b, 0) / items.length)
    : 0;
}
function Chart({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Panel>
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-5 space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-2 flex justify-between gap-3 text-xs">
              <span>{r.label}</span>
              <strong>{r.count}</strong>
            </div>
            <div className="h-1.5 rounded-full bg-stone-100" aria-hidden="true">
              <div
                className="h-full rounded-full bg-leaf"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {!rows.length ? (
          <p className="text-sm text-stone-600">Belum ada data.</p>
        ) : null}
      </div>
    </Panel>
  );
}
export function AdminDashboard() {
  const [filters, setFilters] = useState<SubmissionFilters>({}),
    [applied, setApplied] = useState<SubmissionFilters>({});
  const [submissions, setSubmissions] = useState<Submission[]>([]),
    [selected, setSelected] = useState<Submission | null>(null);
  const [needsLogin, setNeedsLogin] = useState<boolean | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState("");
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [loginEmail, setLoginEmail] = useState(""),
    [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState(""),
    [resetTarget, setResetTarget] = useState("");
  const generation = useRef(0),
    returnId = useRef(""),
    detailHeading = useRef<HTMLHeadingElement>(null),
    resetting = useRef(false);
  function revoke() {
    generation.current++;
    setSubmissions([]);
    setSelected(null);
    setNeedsLogin(true);
    setResetTarget("");
    setPassword("");
  }
  async function load(next: SubmissionFilters = applied) {
    const id = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        "/api/admin/submissions" + buildQuery(next),
        { credentials: "include" },
      );
      const data = await response.json();
      if (id !== generation.current) return;
      if (response.status === 401) {
        revoke();
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Gagal memuat data.");
      setNeedsLogin(false);
      setSubmissions(data.submissions ?? []);
    } catch (e) {
      if (id === generation.current)
        setError(e instanceof Error ? e.message : "Gagal memuat data.");
    } finally {
      if (id === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    void load({});
    return () => {
      generation.current++;
    };
  }, []);
  useEffect(() => {
    if (selected) {
      detailHeading.current?.focus();
      window.scrollTo({ top: 0 });
    } else if (returnId.current) {
      document.getElementById(returnId.current)?.focus();
    }
  }, [selected]);
  const analytics = useMemo(() => {
    const top = submissions.flatMap((s) =>
      s.report?.topRecommendation ? [s.report.topRecommendation] : [],
    );
    return {
      total: submissions.length,
      schools: new Set(submissions.map((s) => s.school)).size,
      fit: average(top.map((r) => r.overallFitScore)),
      ai: average(top.map((r) => r.aiFutureResilienceScore)),
      charts: [
        {
          title: "Arah pendidikan",
          rows: counts(
            submissions.map((s) =>
              educationPathwayLabel(s.answers.educationPathway),
            ),
          ),
        },
        {
          title: "Gender",
          rows: counts(
            submissions.map((s) => s.answers.gender || "Belum tercatat"),
          ),
        },
        {
          title: "Umur",
          rows: counts(
            submissions.map((s) => s.answers.age || "Belum tercatat"),
          ),
        },
        {
          title: "Top 10 rekomendasi",
          rows: counts(top.map((r) => r.majorName)),
        },
        { title: "Top 10 cluster", rows: counts(top.map((r) => r.cluster)) },
        {
          title: "Pertimbangan umum",
          rows: counts(
            submissions.flatMap((s) => s.answers.personalConstraints),
          ),
        },
        {
          title: "Aktivitas umum",
          rows: counts(
            submissions.flatMap((s) => s.answers.favoriteActivities),
          ),
        },
        {
          title: "Skill umum",
          rows: counts(submissions.flatMap((s) => s.answers.skillStrengths)),
        },
      ],
    };
  }, [submissions]);
  async function login() {
    if (busy) return;
    setBusy("login");
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Login admin gagal.");
      setPassword("");
      setFilters({});
      setApplied({});
      await load({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login admin gagal.");
    } finally {
      setBusy("");
    }
  }
  async function logout() {
    setBusy("logout");
    generation.current++;
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Keluar belum berhasil. Coba lagi.");
      revoke();
      setMessage("");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Keluar gagal.");
    } finally {
      setBusy("");
    }
  }
  async function exportCsv() {
    if (busy) return;
    setBusy("export");
    setError("");
    try {
      const response = await fetch("/api/admin/export" + buildQuery(applied), {
        credentials: "include",
      });
      if (response.status === 401) {
        revoke();
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Ekspor gagal.");
      }
      downloadBlob(await response.blob(), "project-nelly-submissions.csv");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ekspor gagal.");
    } finally {
      setBusy("");
    }
  }
  function askReset(email: string) {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Masukkan email siswa yang valid.");
      return;
    }
    setError("");
    setMessage("");
    setResetTarget(clean);
  }
  async function reset() {
    if (resetting.current) return;
    resetting.current = true;
    setBusy("reset");
    setError("");
    try {
      const response = await fetch("/api/admin/submissions/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: resetTarget }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        revoke();
        return;
      }
      if (!response.ok)
        throw new Error(data.error ?? "Gagal menghapus attempt.");
      setMessage(
        data.deleted
          ? `Attempt ${data.email ?? resetTarget} sudah dihapus. Siswa dapat mengisi ulang.`
          : "Submission tidak ditemukan.",
      );
      setResetTarget("");
      setResetEmail("");
      if (selected?.email === resetTarget) setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus attempt.");
    } finally {
      resetting.current = false;
      setBusy("");
    }
  }
  if (needsLogin === null)
    return (
      <Panel>
        {error ? (
          <>
            <StatusMessage tone="error">{error}</StatusMessage>
            <Button className="mt-4" onClick={() => load()}>
              Coba lagi
            </Button>
          </>
        ) : (
          <StatusMessage>Memeriksa akses admin…</StatusMessage>
        )}
      </Panel>
    );
  if (needsLogin)
    return (
      <Panel className="mx-auto max-w-md">
        <p className="eyebrow">Khusus admin / guru BK</p>
        <h1 className="section-heading mt-4">Masuk ruang konselor</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          Gunakan akun admin untuk melihat data siswa dan mendampingi langkah
          mereka.
        </p>
        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void login();
          }}
        >
          <Field label="Email admin">
            <Input
              type="email"
              autoComplete="username"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
          <Button type="submit" disabled={!!busy} className="w-full">
            {busy === "login" ? "Memeriksa…" : "Masuk dashboard"}
          </Button>
        </form>
      </Panel>
    );
  if (selected)
    return (
      <div className="space-y-6">
        <Button variant="secondary" onClick={() => setSelected(null)}>
          <ArrowLeft size={16} />
          Kembali ke dashboard
        </Button>
        <Panel>
          <h2 ref={detailHeading} tabIndex={-1} className="text-lg font-bold">
            Detail asesmen siswa
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Email", selected.email],
              [
                "Gender / umur",
                `${selected.answers.gender || "Belum tercatat"} / ${selected.answers.age || "—"}`,
              ],
              ["Jurusan sekolah", selected.answers.currentSchoolMajor],
              ["Status", selected.status],
              [
                "Narasi",
                `${selected.narrativeStatus ?? "skipped"} · ${selected.report?.narrativeVersion ?? "—"}`,
              ],
              ["Versi penilaian", selected.report?.scoringVersion ?? "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-stone-600">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {selected.narrativeError ? (
            <p className="mt-4 text-xs text-red-800">
              {selected.narrativeError}
            </p>
          ) : null}
        </Panel>
        {selected.report ? (
          <ResultsView submission={selected} compact />
        ) : (
          <StatusMessage>Laporan belum tersedia.</StatusMessage>
        )}
      </div>
    );
  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Ruang konselor / dashboard admin</p>
          <h1 className="section-heading mt-3">Pahami arah siswa.</h1>
          <p className="mt-3 text-sm text-stone-600">
            Ringkasan dari maksimal 500 rekaman terbaru, sesuai filter yang
            diterapkan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportCsv} disabled={!!busy || loading}>
            <Download size={16} />
            {busy === "export" ? "Mengunduh…" : "Ekspor CSV"}
          </Button>
          <Button variant="secondary" onClick={logout} disabled={!!busy}>
            Keluar admin
          </Button>
        </div>
      </header>
      {error && !resetTarget ? (
        <StatusMessage tone="error">
          {error}
          <Button variant="secondary" className="ml-3" onClick={() => load()}>
            Coba lagi
          </Button>
        </StatusMessage>
      ) : null}
      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      <details className="panel">
        <summary className="flex min-h-12 items-center gap-3 font-bold">
          <Filter size={18} />
          Filter asesmen <span className="ml-auto">+</span>
        </summary>
        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(filters);
            void load(filters);
          }}
        >
          <AdminFilters filters={filters} onChange={setFilters} />
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              Terapkan filter
            </Button>
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => {
                setFilters({});
                setApplied({});
                void load({});
              }}
            >
              Bersihkan filter
            </Button>
          </div>
        </form>
      </details>
      <section
        aria-label="Ringkasan asesmen"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          ["Asesmen dimuat", analytics.total],
          ["Sekolah unik", analytics.schools],
          ["Rata-rata fit", analytics.fit],
          ["Rata-rata ketahanan AI", analytics.ai],
        ].map(([label, value]) => (
          <Panel key={label}>
            <p className="text-xs text-stone-600">{label}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </Panel>
        ))}
      </section>
      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Data asesmen</h2>
          <span className="text-xs text-stone-600" role="status">
            {loading ? "Memuat…" : `${submissions.length} rekaman`}
          </span>
        </div>
        <SubmissionList
          submissions={submissions}
          busy={!!busy}
          onSelect={(s) => {
            returnId.current =
              (document.activeElement as HTMLElement)?.id ?? "";
            setSelected(s);
          }}
          onReset={askReset}
        />
      </section>
      <details className="panel" open>
        <summary className="touch-link text-lg font-bold">
          Analitik siswa +
        </summary>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {analytics.charts.map((c) => (
            <Chart key={c.title} {...c} />
          ))}
        </div>
      </details>
      <details className="panel">
        <summary className="flex min-h-12 items-center gap-3 text-sm font-bold">
          <Trash2 size={17} />
          Hapus attempt melalui email
        </summary>
        <p className="my-4 text-sm leading-7 text-stone-600">
          Menghapus submission lama agar siswa dapat mengisi ulang. Tindakan ini
          tidak dapat dibatalkan.
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            askReset(resetEmail);
          }}
        >
          <Field label="Email siswa">
            <Input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
          </Field>
          <Button variant="danger" type="submit" disabled={!!busy}>
            Hapus attempt
          </Button>
        </form>
      </details>
      <ConfirmDialog
        open={!!resetTarget}
        title="Hapus attempt siswa?"
        confirmLabel="Ya, hapus attempt"
        busy={busy === "reset"}
        onClose={() => {
          setResetTarget("");
          setError("");
        }}
        onConfirm={reset}
      >
        <p>
          Submission untuk <strong>{resetTarget}</strong> akan dihapus permanen.
          Siswa dapat mengisi ulang setelahnya.
        </p>
        {error ? (
          <div className="mt-4">
            <StatusMessage tone="error">{error}</StatusMessage>
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
