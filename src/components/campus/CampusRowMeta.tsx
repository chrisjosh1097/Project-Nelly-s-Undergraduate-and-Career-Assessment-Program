"use client";
import { Badge } from "@/components/ui/Badge";
import { Term } from "@/components/ui/Term";
import { campusGlossary } from "../../../data/campusGlossary";

export type CampusRowData = {
  degree: string;
  type: string;
  province?: string;
  lldikti?: string | number;
  quota2024?: number;
  applicants2024?: number;
};

const number = (n: number) => n.toLocaleString("id-ID");

export const RATIO_NOTE = "Bukan passing grade atau peluang diterima.";

// "± 1 kursi : N peminat" — only when quota > 0 and applicants known.
export function competitionRatio(quota?: number, applicants?: number) {
  if (typeof quota !== "number" || typeof applicants !== "number" || quota <= 0 || applicants < 0) return null;
  return Math.max(1, Math.round(applicants / quota));
}

function glossaryFor(term: string) {
  return (campusGlossary as Record<string, string>)[term];
}

export function CampusDegree({ degree }: { degree: string }) {
  const definition = glossaryFor(degree);
  return <Badge>{definition ? <Term label={degree} definition={definition} /> : degree}</Badge>;
}

export function CampusPlace({ item, fallback }: { item: CampusRowData; fallback?: string }) {
  const typeDef = glossaryFor(item.type);
  const place = item.province
    ? item.province
    : item.lldikti
      ? <>Wilayah <Term label="LLDikti" definition={campusGlossary.LLDikti} /> {item.lldikti}</>
      : fallback;
  return <span className="text-xs text-stone-600">
    {typeDef ? <Term label={item.type} definition={typeDef} /> : item.type}
    {place ? <> · {place}</> : null}
  </span>;
}

export function CampusStats({ item, className = "block text-xs leading-5 text-stone-600" }: { item: CampusRowData; className?: string }) {
  const hasQuota = typeof item.quota2024 === "number";
  const hasApplicants = typeof item.applicants2024 === "number";
  if (!hasQuota && !hasApplicants) return null;
  const ratio = competitionRatio(item.quota2024, item.applicants2024);
  return <span className={className}>
    <span className="block">
      {hasQuota ? <><Term label="Daya tampung" definition={campusGlossary["Daya tampung"]} /> {number(item.quota2024!)}</> : null}
      {hasQuota && hasApplicants ? " · " : null}
      {hasApplicants ? <><Term label="peminat" definition={campusGlossary.Peminat} /> {number(item.applicants2024!)}</> : null}
      {" "}(<Term label="SNPMB" definition={campusGlossary.SNPMB} /> 2024)
    </span>
    {ratio ? <span className="block" data-testid="campus-ratio">± 1 kursi : {number(ratio)} peminat (SNPMB 2024). {RATIO_NOTE}</span> : null}
  </span>;
}
