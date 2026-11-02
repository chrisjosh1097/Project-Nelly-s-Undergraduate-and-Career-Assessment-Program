"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { StatusMessage } from "@/components/ui/StatusMessage";

interface CampusItem {
  campus: string;
  type: "Negeri" | "Swasta/Lainnya";
  province?: string;
  lldikti?: number;
  program: string;
  degree: "D3" | "D4" | "S1";
  quota2024?: number;
  applicants2024?: number;
  pddiktiUrl: string;
}

interface SearchResponse {
  items: CampusItem[];
  total: number;
  page: number;
  pageSize: number;
  provinces: string[];
  source: string;
}

export interface CampusFilters {
  q: string;
  province: string;
  degree: string;
  type: string;
  page: number;
}

const FALLBACK_SOURCE =
  "Sumber: kompilasi PDDikti (joearton, 2022) dan data SNPMB 2024 (Ibnul Habib, MIT). Data bisa berubah — cek sumber resmi.";
const selectClass =
  "w-full min-h-12 rounded-xl border border-stone-500 bg-white px-3 py-3 text-base text-ink focus:border-ink focus:ring-2 focus:ring-ink/20";
const number = (n: number) => n.toLocaleString("id-ID");

function queryString(f: CampusFilters): string {
  const params = new URLSearchParams();
  if (f.q.trim()) params.set("q", f.q.trim());
  if (f.province) params.set("province", f.province);
  if (f.degree) params.set("degree", f.degree);
  if (f.type) params.set("type", f.type);
  if (f.page > 1) params.set("page", String(f.page));
  return params.toString();
}

export function CampusSearch({ initial }: { initial?: Partial<CampusFilters> }) {
  const [text, setText] = useState(initial?.q ?? "");
  const [filters, setFilters] = useState<CampusFilters>({
    q: initial?.q ?? "",
    province: initial?.province ?? "",
    degree: initial?.degree ?? "",
    type: initial?.type ?? "",
    page: initial?.page && initial.page > 0 ? initial.page : 1,
  });
  const [state, setState] = useState<{ status: "loading" | "error" } | { status: "ready"; data: SearchResponse }>({ status: "loading" });
  const [provinces, setProvinces] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const firstRender = useRef(true);

  // Debounce typing; submit applies immediately.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => setFilters((f) => (f.q === text ? f : { ...f, q: text, page: 1 })), 300);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    const qs = queryString(filters);
    window.history.replaceState(null, "", qs ? `/kampus?${qs}` : "/kampus");
    const controller = new AbortController();
    setState({ status: "loading" });
    fetch(`/api/campus/search${qs ? `?${qs}` : ""}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as SearchResponse;
        if (!data.items.length && data.total > 0 && filters.page > 1) {
          setFilters((f) => ({ ...f, page: 1 }));
          return;
        }
        setProvinces(data.provinces);
        setState({ status: "ready", data });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [filters, attempt]);

  const update = useCallback((patch: Partial<CampusFilters>) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 })), []);

  function submit(event: FormEvent) {
    event.preventDefault();
    update({ q: text });
  }

  const data = state.status === "ready" ? state.data : null;
  const lastPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const from = data && data.total ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return <div className="min-w-0 space-y-5">
    <form role="search" aria-label="Cari kampus dan jurusan" onSubmit={submit} className="panel min-w-0 space-y-4">
      <Field label="Nama jurusan atau kampus">
        <span className="flex min-w-0 gap-2">
          <Input type="search" value={text} maxLength={60} placeholder="misalnya teknik mesin" onChange={(e) => setText(e.target.value)} className="min-w-0" />
          <Button type="submit" aria-label="Cari" className="min-h-12 shrink-0 px-4"><Search size={18} aria-hidden="true" /></Button>
        </span>
      </Field>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <Field label="Jenjang">
          <select className={selectClass} value={filters.degree} onChange={(e) => update({ degree: e.target.value })}>
            <option value="">Semua</option>
            <option value="D3">D3</option>
            <option value="D4">D4</option>
            <option value="S1">S1</option>
          </select>
        </Field>
        <Field label="Provinsi">
          <select className={selectClass} value={filters.province} onChange={(e) => update({ province: e.target.value })}>
            <option value="">Semua provinsi</option>
            {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Jenis kampus">
          <select className={selectClass} value={filters.type} onChange={(e) => update({ type: e.target.value })}>
            <option value="">Semua</option>
            <option value="Negeri">Negeri</option>
            <option value="Swasta/Lainnya">Swasta/Lainnya</option>
          </select>
        </Field>
      </div>
      {filters.province ? <p className="text-xs leading-5 text-stone-600">Filter provinsi hanya mencakup kampus negeri dari data SNPMB 2024.</p> : null}
    </form>

    <section aria-label="Hasil pencarian kampus" aria-busy={state.status === "loading"} className="min-w-0 space-y-3">
      {state.status === "error" ? <StatusMessage tone="error">
        <span className="block">Data kampus belum bisa dimuat.</span>
        <Button variant="secondary" className="mt-3" onClick={() => setAttempt((n) => n + 1)}>Coba lagi</Button>
      </StatusMessage> : null}
      {state.status === "loading" ? <p className="text-sm text-stone-600" role="status">Memuat data kampus…</p> : null}
      {data && !data.total ? <p className="panel text-sm leading-6 text-stone-700">Belum ada yang cocok. Coba kata lain, misalnya &quot;teknik mesin&quot;.</p> : null}
      {data && data.total ? <>
        <p className="text-sm text-stone-700" aria-live="polite">Menampilkan {number(from)}–{number(to)} dari {number(data.total)}</p>
        <ul className="grid min-w-0 gap-3 lg:grid-cols-2">
          {data.items.map((item) => <li key={`${item.campus}|${item.program}|${item.degree}`} className="panel min-w-0 [overflow-wrap:anywhere]">
            <span className="block text-base font-bold text-ink">{item.program}</span>
            <span className="block text-sm leading-6 text-stone-700">{item.campus}</span>
            <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-600">
              <Badge>{item.degree}</Badge>
              <span>{item.type} · {item.province ?? (item.lldikti ? `Wilayah LLDikti ${item.lldikti}` : "Lokasi belum tercatat")}</span>
            </span>
            {typeof item.quota2024 === "number" || typeof item.applicants2024 === "number" ? <span className="mt-1 block text-xs leading-5 text-stone-600">
              {[typeof item.quota2024 === "number" ? `Daya tampung ${number(item.quota2024)}` : "",
                typeof item.applicants2024 === "number" ? `peminat ${number(item.applicants2024)}` : ""].filter(Boolean).join(" · ")} (SNPMB 2024)
            </span> : null}
            <a href={item.pddiktiUrl} target="_blank" rel="noopener noreferrer" className="touch-link -ml-3 rounded-lg text-sm font-semibold text-leaf underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">
              Cek di PDDikti<ExternalLink size={14} aria-hidden="true" />
            </a>
          </li>)}
        </ul>
        <nav aria-label="Halaman hasil" className="flex items-center justify-between gap-3">
          <Button variant="secondary" disabled={data.page <= 1} onClick={() => update({ page: data.page - 1 })}>Sebelumnya</Button>
          <span className="text-sm tabular-nums text-stone-700">{data.page} / {lastPage}</span>
          <Button variant="secondary" disabled={data.page >= lastPage} onClick={() => update({ page: data.page + 1 })}>Berikutnya</Button>
        </nav>
      </> : null}
      <p className="text-xs leading-5 text-stone-600">{data?.source || FALLBACK_SOURCE}</p>
    </section>
  </div>;
}
