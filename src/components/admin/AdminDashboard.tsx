"use client";
import { formatSchoolMajor } from "@/lib/assessment/schoolMajorDisplay";
import { narrativeLabel, scoringVersionLabel } from "@/lib/admin/labels";
import { useEffect, useRef, useState } from "react";
import { Download, Filter, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ResultsView } from "@/components/results/ResultsView";
import { AdminFilters } from "./AdminFilters";
import { SubmissionList } from "./SubmissionList";
import type { Submission } from "@/lib/types";
import type {
  AdminSubmissionPage,
  AdminSubmissionSummary,
} from "@/lib/admin/submissions";
import type { SubmissionFilters } from "@/lib/submissions/filters";
import { downloadBlob } from "@/lib/utils";
import { adminRequest, readAdminJson } from "./request";
function buildQuery(filters: SubmissionFilters, page?: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value?.trim()) params.set(key, value.trim());
  if (page && page !== 1) params.set("page", String(page));
  const text = params.toString();
  return text ? "?" + text : "";
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
  const [pageData, setPageData] = useState<AdminSubmissionPage | null>(null),
    [selected, setSelected] = useState<Submission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
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
    setPageData(null);
    setSelected(null);
    setLoading(false);
    setDetailLoading(false);
    setNeedsLogin(true);
    setResetTarget("");
    setResetEmail("");
    setFilters({});
    setApplied({});
    setMessage("");
    setError("");
    returnId.current = "";
    setPassword("");
  }
  async function load(
    next: SubmissionFilters = applied,
    page = pageData?.page ?? 1,
  ) {
    const id = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const { response, data } = await adminRequest(
        "/api/admin/submissions" + buildQuery(next, page),
        readAdminJson,
      );
      if (id !== generation.current) return;
      if (response.status === 401) {
        revoke();
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Gagal memuat data.");
      setNeedsLogin(false);
      setPageData(data as AdminSubmissionPage);
      setApplied(next);
    } catch (e) {
      if (id === generation.current)
        setError(e instanceof Error ? e.message : "Gagal memuat data.");
    } finally {
      if (id === generation.current) setLoading(false);
    }
  }
  async function openDetail(summary: AdminSubmissionSummary) {
    const id = ++generation.current;
    returnId.current = (document.activeElement as HTMLElement)?.id ?? "";
    setDetailLoading(true);
    setError("");
    try {
      const { response, data } = await adminRequest(
        "/api/admin/submissions/" + encodeURIComponent(summary.id),
        readAdminJson,
      );
      if (id !== generation.current) return;
      if (response.status === 401) {
        revoke();
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Gagal memuat laporan.");
      setSelected(data.submission);
    } catch (e) {
      if (id === generation.current)
        setError(e instanceof Error ? e.message : "Gagal memuat laporan.");
    } finally {
      if (id === generation.current) setDetailLoading(false);
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
  const submissions = pageData?.submissions ?? [];
  const analytics = pageData?.analytics ?? {
    total: 0,
    schools: 0,
    fit: 0,
    ai: 0,
    charts: [],
  };
  const firstRow = pageData?.total ? (pageData.page - 1) * 50 + 1 : 0;
  const lastRow = pageData ? Math.min(pageData.page * 50, pageData.total) : 0;
  async function login() {
    if (busy) return;
    setBusy("login");
    setError("");
    const id = ++generation.current;
    try {
      const { response, data } = await adminRequest(
        "/api/admin/login",
        (r) => r.json().catch(() => ({})),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: loginEmail, password }),
        },
      );
      if (id !== generation.current) return;
      if (!response.ok) throw new Error(data.error ?? "Login admin gagal.");
      setPassword("");
      setFilters({});
      setApplied({});
      setNeedsLogin(null);
      await load({}, 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login admin gagal.");
    } finally {
      setBusy("");
    }
  }
  async function logout() {
    setBusy("logout");
    revoke();
    try {
      const { response } = await adminRequest(
        "/api/admin/logout",
        async () => null,
        {
          method: "POST",
          credentials: "include",
        },
      );
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
    const id = generation.current;
    try {
      const { response, data } = await adminRequest(
        "/api/admin/export" + buildQuery(applied),
        async (r) => (r.ok ? r.blob() : readAdminJson(r).catch(() => ({}))),
      );
      if (id !== generation.current) return;
      if (response.status === 401) {
        revoke();
        return;
      }
      if (!response.ok) {
        throw new Error(data.error ?? "Ekspor gagal.");
      }
      downloadBlob(data, "project-nelly-submissions.csv");
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
    const id = generation.current;
    try {
      const { response, data } = await adminRequest(
        "/api/admin/submissions/reset",
        (r) => readAdminJson(r).catch(() => ({})),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: resetTarget }),
        },
      );
      if (id !== generation.current) return;
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
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setSelected(null)}>
            <ArrowLeft size={16} />
            Kembali ke dashboard
          </Button>
          <Button variant="secondary" onClick={logout} disabled={!!busy}>
            Keluar admin
          </Button>
        </div>
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
              ["Jurusan sekolah", formatSchoolMajor(selected.answers)],
              ["Status", selected.status],
              [
                "Narasi",
                narrativeLabel(selected.narrativeStatus, selected.report?.narrativeVersion),
              ],
              ["Versi skor", scoringVersionLabel(selected.report?.scoringVersion)],
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
    <div className="min-w-0 space-y-6">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Ruang konselor / dashboard admin</p>
          <h1 className="section-heading mt-3">Pahami arah siswa.</h1>
          <p className="mt-3 text-sm text-stone-600">
            Cari seluruh rekaman asesmen. Ringkasan dan CSV mengikuti pencarian
            serta filter yang diterapkan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={exportCsv}
            disabled={!!busy || loading || detailLoading}
          >
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
      {detailLoading ? <StatusMessage>Memuat laporan…</StatusMessage> : null}
      <section className="panel" aria-labelledby="admin-filters-heading">
        <h2
          id="admin-filters-heading"
          className="flex min-h-12 items-center gap-3 font-bold"
        >
          <Filter size={18} />
          Pencarian dan filter asesmen
        </h2>
        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (loading || detailLoading || busy) return;
            void load(filters, 1);
          }}
        >
          <AdminFilters filters={filters} onChange={setFilters} />
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit" disabled={loading || detailLoading || !!busy}>
              Cari
            </Button>
            <Button
              variant="secondary"
              disabled={loading || detailLoading || !!busy}
              onClick={() => {
                setFilters({});
                void load({}, 1);
              }}
            >
              Bersihkan filter
            </Button>
          </div>
        </form>
      </section>
      <section
        aria-label="Ringkasan asesmen"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          ["Asesmen sesuai filter", analytics.total],
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
      <section className="min-w-0" aria-busy={loading || detailLoading}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Data asesmen</h2>
          <span className="text-xs text-stone-600" role="status">
            {loading
              ? "Memuat…"
              : `${firstRow}–${lastRow} dari ${pageData?.total ?? 0} rekaman`}
          </span>
        </div>
        <SubmissionList
          submissions={submissions}
          busy={!!busy || loading || detailLoading}
          onSelect={openDetail}
          onReset={askReset}
        />
        <nav
          aria-label="Halaman asesmen"
          className="mt-4 flex flex-wrap items-center justify-between gap-3"
        >
          <Button
            variant="secondary"
            aria-label="Halaman sebelumnya"
            disabled={
              loading ||
              detailLoading ||
              !!busy ||
              !pageData ||
              pageData.page <= 1
            }
            onClick={() => load(applied, (pageData?.page ?? 1) - 1)}
          >
            Sebelumnya
          </Button>
          <p className="text-sm">
            Halaman {pageData?.page ?? 1} dari {pageData?.totalPages ?? 1}
          </p>
          <Button
            variant="secondary"
            aria-label="Halaman berikutnya"
            disabled={
              loading ||
              detailLoading ||
              !!busy ||
              !pageData ||
              pageData.page >= pageData.totalPages
            }
            onClick={() => load(applied, (pageData?.page ?? 1) + 1)}
          >
            Berikutnya
          </Button>
        </nav>
      </section>
      <section className="panel" aria-labelledby="admin-analytics-heading">
        <h2 id="admin-analytics-heading" className="text-lg font-bold">
          Analitik siswa
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {analytics.charts.map((c) => (
            <Chart key={c.title} {...c} />
          ))}
        </div>
      </section>
      <section className="panel" aria-labelledby="admin-reset-heading">
        <h2
          id="admin-reset-heading"
          className="flex min-h-12 items-center gap-3 text-sm font-bold"
        >
          <Trash2 size={17} />
          Hapus attempt melalui email
        </h2>
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
          <Button
            variant="danger"
            type="submit"
            disabled={!!busy || loading || detailLoading}
          >
            Hapus attempt
          </Button>
        </form>
      </section>
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
