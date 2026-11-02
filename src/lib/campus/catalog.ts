// server-only: imports the full catalog JSON. Never import from a client component.
import catalogJson from "../../../data/campus/catalog.json";
import { campusMajorMap, maritimeMajorIds, type CampusMajorRule } from "../../../data/campusMajorMap";
import { nameKey, type CampusCatalog, type CampusType, type Degree } from "./normalize";

export const CAMPUS_SOURCE_LINE =
  "Sumber: kompilasi PDDikti (joearton, 2022) dan data SNPMB 2024 (Ibnul Habib, MIT). Data bisa berubah — cek sumber resmi.";
export const MARITIME_NOTE =
  "Sekolah pelayaran/kedinasan resmi mungkin tidak ada di daftar ini — cek situs instansinya.";
export const SEARCH_PAGE_SIZE = 20;

export interface CampusMatch {
  campus: string;
  type: CampusType;
  province?: string;
  lldikti?: number;
  program: string;
  degree: Degree;
  quota2024?: number;
  applicants2024?: number;
  pddiktiUrl: string;
}

const catalog = catalogJson as CampusCatalog;
const JAVA = new Set(["DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten"]);
const DEGREE_ORDER: Degree[] = ["D3", "D4", "S1"];

interface IndexedProgram {
  key: string;
  match: CampusMatch;
}

const indexed: IndexedProgram[] = catalog.programs.map((p) => {
  const campus = catalog.campuses[p.campus];
  return {
    key: ` ${nameKey(p.name)} `,
    match: {
      campus: campus.name,
      type: campus.type,
      ...(campus.province ? { province: campus.province } : {}),
      ...(campus.lldikti !== undefined ? { lldikti: campus.lldikti } : {}),
      program: p.name,
      degree: p.degree,
      ...(p.quota2024 !== undefined ? { quota2024: p.quota2024 } : {}),
      ...(p.applicants2024 !== undefined ? { applicants2024: p.applicants2024 } : {}),
      pddiktiUrl: `https://pddikti.kemdiktisaintek.go.id/search/${encodeURIComponent(campus.name)}`,
    },
  };
});

const provinces = [...new Set(catalog.campuses.flatMap((c) => (c.province ? [c.province] : [])))].sort((a, b) =>
  a.localeCompare(b, "id"),
);

function phraseKey(phrase: string): string {
  return ` ${nameKey(phrase)} `;
}

// Defence-university programs are not realistic examples for general students.
const GLOBAL_EXCLUDE = ["pertahanan", "kapal perang", "kendaraan tempur", "sistem senjata", "militer", "matra"].map(phraseKey);

export function programsForRule(rule: CampusMajorRule): CampusMatch[] {
  if ("none" in rule) return [];
  const include = rule.include.map(phraseKey);
  const exclude = [...GLOBAL_EXCLUDE, ...(rule.exclude ?? []).map(phraseKey)];
  return indexed
    .filter((p) => include.some((k) => p.key.includes(k)) && !exclude.some((k) => p.key.includes(k)))
    .map((p) => p.match);
}

export function allowedDegrees(degreeTypes?: string[]): Set<Degree> {
  const allowed = new Set<Degree>();
  for (const raw of degreeTypes ?? []) {
    if (raw === "Vokasi") {
      allowed.add("D3");
      allowed.add("D4");
    } else if ((DEGREE_ORDER as string[]).includes(raw)) allowed.add(raw as Degree);
  }
  return allowed.size ? allowed : new Set(DEGREE_ORDER);
}

function preferenceScore(m: CampusMatch, preferences: string[]): number {
  let score = 0;
  for (const pref of preferences) {
    if (pref === "PTN di Jawa" && m.type === "Negeri" && m.province && JAVA.has(m.province)) score += 1;
    if (pref === "PTN luar Jawa" && m.type === "Negeri" && m.province && !JAVA.has(m.province)) score += 1;
    if (pref === "PTS bagus di kota besar" && m.type === "Swasta/Lainnya") score += 1;
  }
  return score;
}

export function campusesForMajor(
  majorId: string,
  opts: { degreeTypes?: string[]; preferences?: string[]; limit?: number } = {},
): { items: CampusMatch[]; total: number; maritimeNote: boolean } {
  const rule = campusMajorMap[majorId];
  if (!rule) return { items: [], total: 0, maritimeNote: false };
  const allowed = allowedDegrees(opts.degreeTypes);
  const vocationalFirst = allowed.has("D3") || allowed.has("D4");
  const preferences = opts.preferences ?? [];
  const limit = Math.min(Math.max(opts.limit ?? 6, 1), 12);

  const seen = new Set<string>();
  const matches = programsForRule(rule)
    .filter((m) => allowed.has(m.degree))
    .sort(
      (a, b) =>
        preferenceScore(b, preferences) - preferenceScore(a, preferences) ||
        (vocationalFirst ? Number(a.degree === "S1") - Number(b.degree === "S1") : 0) ||
        Number(b.type === "Negeri") - Number(a.type === "Negeri") ||
        (b.applicants2024 ?? -1) - (a.applicants2024 ?? -1) ||
        a.campus.localeCompare(b.campus, "id"),
    )
    // One row per campus keeps the short list varied.
    .filter((m) => (seen.has(m.campus) ? false : (seen.add(m.campus), true)));

  return { items: matches.slice(0, limit), total: matches.length, maritimeNote: maritimeMajorIds.has(majorId) };
}

export function searchPrograms(q: {
  text?: string;
  province?: string;
  degree?: Degree;
  type?: CampusType;
  page?: number;
}): { items: CampusMatch[]; total: number; page: number; pageSize: typeof SEARCH_PAGE_SIZE } {
  const words = nameKey(q.text ?? "").split(" ").filter(Boolean);
  const page = Math.max(1, q.page ?? 1);
  const results = indexed
    .filter((p) => {
      const m = p.match;
      if (q.degree && m.degree !== q.degree) return false;
      if (q.type && m.type !== q.type) return false;
      if (q.province && m.province !== q.province) return false;
      if (!words.length) return true;
      const haystack = `${p.key}${nameKey(m.campus)} `;
      return words.every((w) => haystack.includes(w));
    })
    .map((p) => p.match)
    .sort(
      (a, b) =>
        Number(b.type === "Negeri") - Number(a.type === "Negeri") ||
        (b.applicants2024 ?? -1) - (a.applicants2024 ?? -1) ||
        a.campus.localeCompare(b.campus, "id") ||
        a.program.localeCompare(b.program, "id"),
    );
  const start = (page - 1) * SEARCH_PAGE_SIZE;
  return { items: results.slice(start, start + SEARCH_PAGE_SIZE), total: results.length, page, pageSize: SEARCH_PAGE_SIZE };
}

export function listProvinces(): string[] {
  return provinces;
}
