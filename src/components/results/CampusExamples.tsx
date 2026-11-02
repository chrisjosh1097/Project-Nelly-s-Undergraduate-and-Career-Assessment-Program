"use client";
import { useEffect, useState } from "react";
import { ExternalLink, School } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

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

interface CampusResponse {
  items: CampusItem[];
  total: number;
  maritimeNote: boolean;
  source: string;
}

const PDDIKTI_SEARCH = "https://pddikti.kemdiktisaintek.go.id/search/";
const MARITIME_NOTE = "Sekolah pelayaran/kedinasan resmi mungkin tidak ada di daftar ini — cek situs instansinya.";
const linkClass =
  "touch-link rounded-lg text-sm font-semibold text-leaf underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf";

export function campusDegreeParams(degreeTypes?: string[]): string[] {
  const out = new Set<string>();
  for (const d of degreeTypes ?? []) {
    if (d === "Vokasi") {
      out.add("D3");
      out.add("D4");
    } else if (d === "D3" || d === "D4" || d === "S1") out.add(d);
  }
  return [...out];
}

const number = (n: number) => n.toLocaleString("id-ID");

export function CampusExamples({ majorId, majorName, degreeTypes, preferences }: {
  majorId: string; majorName: string; degreeTypes?: string[]; preferences?: string[];
}) {
  const [state, setState] = useState<{ status: "loading" } | { status: "error" } | { status: "ready"; data: CampusResponse }>({ status: "loading" });
  const query = new URLSearchParams();
  campusDegreeParams(degreeTypes).forEach((d) => query.append("degree", d));
  (preferences ?? []).forEach((p) => query.append("pref", p));
  const url = `/api/campus/major/${encodeURIComponent(majorId)}${query.size ? `?${query}` : ""}`;

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        setState({ status: "ready", data: (await response.json()) as CampusResponse });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [url]);

  if (state.status === "loading") {
    return <div aria-hidden="true" data-testid="campus-skeleton" className="h-5 w-2/3 animate-pulse rounded bg-stone-100" />;
  }
  if (state.status === "error") {
    return <a href={`${PDDIKTI_SEARCH}${encodeURIComponent(majorName)}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
      Cari di PDDikti<ExternalLink size={14} aria-hidden="true" />
    </a>;
  }
  const { items, maritimeNote, source } = state.data;
  if (!items.length) return null;

  return <section aria-label="Contoh kampus" className="min-w-0">
    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
      <School size={16} className="shrink-0 text-leaf" aria-hidden="true" />Contoh kampus yang membuka jurusan ini
    </h3>
    <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 px-3">
      {items.map((item) => <li key={`${item.campus}|${item.program}|${item.degree}`} className="py-2.5 text-sm leading-6">
        <span className="block font-semibold text-ink">{item.campus}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-stone-700">
          <span>{item.program}</span>
          <Badge>{item.degree}</Badge>
          <span className="text-xs text-stone-600">{item.type}{item.province ? ` · ${item.province}` : item.lldikti ? ` · Wilayah LLDikti ${item.lldikti}` : ""}</span>
        </span>
        {typeof item.quota2024 === "number" || typeof item.applicants2024 === "number" ? <span className="block text-xs leading-5 text-stone-600">
          {[typeof item.quota2024 === "number" ? `Daya tampung ${number(item.quota2024)}` : "",
            typeof item.applicants2024 === "number" ? `peminat ${number(item.applicants2024)}` : ""].filter(Boolean).join(" · ")} (SNPMB 2024)
        </span> : null}
        <a href={item.pddiktiUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Cek di PDDikti<ExternalLink size={14} aria-hidden="true" />
        </a>
      </li>)}
    </ul>
    {maritimeNote ? <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-xs leading-5 text-stone-700">{MARITIME_NOTE}</p> : null}
    <p className="mt-1 text-xs leading-5 text-stone-600">{source}</p>
  </section>;
}
