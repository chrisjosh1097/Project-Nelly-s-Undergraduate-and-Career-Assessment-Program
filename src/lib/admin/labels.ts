import type { NarrativeStatus } from "@/lib/types";

// Display-only labels for the admin dashboard. Stored values are never changed.
const STATUS_LABELS: Record<NarrativeStatus, string> = {
  pending: "menunggu",
  processing: "diproses",
  completed: "selesai",
  failed: "gagal",
  skipped: "dilewati",
};

export function scoringVersionLabel(version?: string): string {
  if (!version) return "—";
  const match = version.match(/v\d+(?:\.\d+)*/);
  if (!match) return version;
  return version.startsWith("knowledge-base-heuristic") ? `${match[0]} (aturan tetap)` : match[0];
}

export function narrativeSourceLabel(version?: string): string {
  if (!version) return "—";
  if (version.startsWith("gemini")) return "Gemini";
  if (version.startsWith("heuristic")) return "Template";
  return version;
}

export function narrativeStatusLabel(status?: NarrativeStatus): string {
  return STATUS_LABELS[status ?? "skipped"] ?? String(status);
}

export function narrativeLabel(status?: NarrativeStatus, version?: string): string {
  return `${narrativeSourceLabel(version)} · ${narrativeStatusLabel(status)}`;
}
