export type Degree = "D3" | "D4" | "S1";
export type CampusType = "Negeri" | "Swasta/Lainnya";

export interface CatalogCampus {
  id: number;
  name: string;
  type: CampusType;
  province?: string;
  lldikti?: number;
}

export interface CatalogProgram {
  campus: number;
  name: string;
  degree: Degree;
  quota2024?: number;
  applicants2024?: number;
}

export interface CampusCatalog {
  generatedAt: string;
  campuses: CatalogCampus[];
  programs: CatalogProgram[];
}

export interface RawProgramRow {
  source: "joearton" | "snpmb";
  campus: string;
  program: string;
  degree: Degree;
  province?: string;
  lldikti?: number;
  quota2024?: number;
  applicants2024?: number;
}

const DEGREES: Record<string, Degree> = {
  "d-iii": "D3",
  d3: "D3",
  "diploma tiga": "D3",
  "d-iv": "D4",
  d4: "D4",
  "sarjana terapan": "D4",
  s1: "S1",
  sarjana: "S1",
};

export function normalizeDegree(raw: string): Degree | null {
  return DEGREES[raw.trim().toLowerCase()] ?? null;
}

const LOWER_WORDS = new Set(["dan", "di", "dari", "untuk", "dalam", "pada", "atau", "&", "of", "and"]);
const ACRONYMS = new Set([
  "UI", "ITB", "IPB", "ITS", "UGM", "UPN", "UIN", "IAIN", "STAIN", "IKIP", "ISI", "PGRI", "STIE", "STIKES",
  "STMIK", "AMIK", "STT", "STAI", "STIT", "STKIP", "LP3I", "YKPN", "ABA", "NU", "II", "III", "IV", "VI",
  "PSDKU", "PJJ", "K3", "TI", "IT", "SDM", "PAUD", "PGSD", "PPKN", "TIK", "KKN", "ASMI", "AKBID", "AKPER",
]);

function titleWord(word: string, index: number): string {
  if (ACRONYMS.has(word) || (/^[A-Z0-9]{2,5}$/.test(word) && !/[AEIOU]/.test(word))) return word;
  const lower = word.toLowerCase();
  if (index > 0 && LOWER_WORDS.has(lower)) return lower;
  return lower.replace(/(^|[-/(])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
}

export function normalizeName(raw: string): string {
  let name = raw.replace(/\s+/g, " ").trim();
  name = name.replace(/\s*\([^()]*\)$/, "").trim();
  if (/[a-z]/.test(name)) return name;
  return name.split(" ").map(titleWord).join(" ");
}

export function nameKey(raw: string): string {
  return normalizeName(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function looksNegeri(name: string): boolean {
  return /\bnegeri\b/i.test(name);
}

export function mergeRows(rows: RawProgramRow[], generatedAt: string): CampusCatalog {
  const campusMap = new Map<string, { name: string; negeri: boolean; snpmbName?: string; province?: string; lldikti?: number }>();
  const programMap = new Map<string, { campusKey: string; name: string; degree: Degree; snpmb: boolean; quota2024?: number; applicants2024?: number }>();

  for (const row of rows) {
    const campusName = normalizeName(row.campus);
    const programName = normalizeName(row.program);
    const campusKey = nameKey(campusName).replace(/ /g, "");
    const programKey = nameKey(programName);
    if (!campusKey || !programKey) continue;

    const campus = campusMap.get(campusKey) ?? { name: campusName, negeri: false };
    if (row.source === "snpmb") {
      campus.negeri = true;
      campus.snpmbName ??= campusName;
      campus.province ??= row.province;
    }
    if (looksNegeri(campusName)) campus.negeri = true;
    if (campus.lldikti === undefined && row.lldikti !== undefined) campus.lldikti = row.lldikti;
    campusMap.set(campusKey, campus);

    const key = `${campusKey}|${programKey}|${row.degree}`;
    const existing = programMap.get(key);
    if (!existing || (row.source === "snpmb" && !existing.snpmb)) {
      programMap.set(key, {
        campusKey,
        name: row.source === "snpmb" || !existing ? programName : existing.name,
        degree: row.degree,
        snpmb: row.source === "snpmb",
        quota2024: row.quota2024,
        applicants2024: row.applicants2024,
      });
    }
  }

  const sortedCampuses = [...campusMap.entries()]
    .map(([key, c]) => ({ key, ...c, display: c.snpmbName ?? c.name }))
    .sort((a, b) => a.display.localeCompare(b.display, "id"));
  const ids = new Map<string, number>();
  const campuses: CatalogCampus[] = sortedCampuses.map((c, id) => {
    ids.set(c.key, id);
    return {
      id,
      name: c.display,
      type: c.negeri ? "Negeri" : "Swasta/Lainnya",
      ...(c.province ? { province: c.province } : {}),
      ...(c.lldikti !== undefined ? { lldikti: c.lldikti } : {}),
    };
  });

  const programs: CatalogProgram[] = [...programMap.values()]
    .map((p) => ({
      campus: ids.get(p.campusKey)!,
      name: p.name,
      degree: p.degree,
      ...(p.quota2024 !== undefined ? { quota2024: p.quota2024 } : {}),
      ...(p.applicants2024 !== undefined ? { applicants2024: p.applicants2024 } : {}),
    }))
    .sort((a, b) => a.campus - b.campus || a.name.localeCompare(b.name, "id") || a.degree.localeCompare(b.degree));

  return { generatedAt, campuses, programs };
}
