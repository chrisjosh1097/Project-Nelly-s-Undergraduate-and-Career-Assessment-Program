import { majors as knowledgeMajors } from "../../../data";

/**
 * v3.3.0 explicit-aspiration matcher (deterministic, no fuzzy matching).
 *
 * A dreamProfession that literally names a catalog major (or a reviewed profession
 * alias such as "arsitek" or "dokter gigi") yields a match. Matches are used only to
 * guarantee that major's presence in the top 10; scores never change.
 */

export type AspirationMatch = {
  phrase: string;
  /** Candidate tiers: the first tier with an eligible major wins; within a tier the highest score wins. */
  tiers: string[][];
  /** Per tier: true when the major is only a reviewed proxy (e.g. "desain interior" → Arsitektur), not what the student named. */
  related: boolean[];
};

const NEGATIONS = new Set(["bukan", "tidak", "tdk", "ga", "gak", "nggak", "enggak", "engga", "jangan", "selain", "kecuali", "ogah"]);
const SCOPE_BREAKERS = new Set(["dan", "atau", "tapi", "tetapi", "namun", "serta", "melainkan", "sedangkan"]);
const CLAUSE_SPLIT = /[,;.\/()\n!?:|]+/u;

/** Catalog names too short or ambiguous to count as an explicit mention. */
export const excludedCatalogNames = new Set([
  "it", "ai", "si", "pr", "hi", "bk", "mi", "tlm", "rpl", "pwk", "hrm", "law", "teknik terapan", "finance", "management",
]);

/** Phrases after which a catalog token means something else (e.g. "hukum newton"). */
const CONTEXT_EXCLUSIONS: Record<string, string[]> = {
  hukum: ["newton", "fisika", "alam", "kekekalan", "ohm", "archimedes", "pascal", "kepler", "mendel", "kirchhoff", "termodinamika"],
};

/** Phrases before which a catalog token is not a field of study (e.g. "laporan keuangan"). */
const PRECEDING_EXCLUSIONS: Record<string, string[]> = {
  keuangan: ["laporan"],
  komunikasi: ["speaking"],
};

/** Reviewed profession aliases → group of target major IDs. */
export const curatedAspirationAliases: Array<{ phrases: string[]; targets: string[]; related?: true }> = [
  { phrases: ["arsitek", "architect"], targets: ["arsitektur"] },
  { phrases: ["desain interior", "desainer interior", "interior designer"], targets: ["arsitektur"], related: true },
  { phrases: ["teknik komputer", "tekkom", "computer engineer"], targets: ["teknik_komputer"] },
  { phrases: ["teknik informatika", "programmer", "programer"], targets: ["informatika", "teknologi_rekayasa_perangkat_lunak"] },
  { phrases: ["software engineer", "software developer"], targets: ["software_engineering", "teknologi_rekayasa_perangkat_lunak"] },
  { phrases: ["dokter", "dokter umum", "dokter spesialis", "dokter bedah", "dokter forensik", "dokter anak", "dokter kandungan"], targets: ["kedokteran"] },
  { phrases: ["dokter gigi", "drg"], targets: ["kedokteran_gigi"] },
  { phrases: ["dokter hewan"], targets: ["kedokteran_hewan"] },
  { phrases: ["psikolog"], targets: ["psikologi"] },
  // A psychiatrist is a medical specialist: the route is Kedokteran, not Psikologi.
  { phrases: ["psikiater", "dokter spesialis jiwa", "dokter jiwa"], targets: ["kedokteran"] },
  { phrases: ["apoteker"], targets: ["farmasi"] },
  { phrases: ["akuntan"], targets: ["akuntansi", "akuntansi_terapan"] },
  { phrases: ["aktuaris"], targets: ["aktuaria"] },
  { phrases: ["perawat"], targets: ["keperawatan"] },
  { phrases: ["bidan"], targets: ["kebidanan"] },
  { phrases: ["pengacara", "lawyer", "advokat", "hakim", "jaksa", "notaris"], targets: ["hukum"] },
  { phrases: ["kriminolog"], targets: ["kriminologi"] },
  { phrases: ["ahli gizi", "nutrisionis"], targets: ["gizi"] },
  { phrases: ["fisioterapis"], targets: ["fisioterapi"] },
  { phrases: ["urban planner", "perencanaan wilayah dan kota", "planologi"], targets: ["perencanaan_wilayah_kota"] },
  { phrases: ["koki", "chef"], targets: ["tata_boga"] },
  { phrases: ["mining engineer", "tambang", "pertambangan", "teknik pertambangan"], targets: ["teknik_pertambangan", "teknik_pertambangan_terapan"] },
  { phrases: ["civil engineer", "civil engineering"], targets: ["teknik_sipil"] },
  { phrases: ["electrical engineer", "electrical engineering"], targets: ["teknik_elektro"] },
  { phrases: ["mechanical engineer", "mechanical engineering", "teknik mesin"], targets: ["teknik_mesin", "teknik_mesin_terapan"] },
  { phrases: ["sains data"], targets: ["data_science"] },
  { phrases: ["statistik"], targets: ["statistika"] },
  { phrases: ["ilmu komunikasi"], targets: ["komunikasi"] },
  { phrases: ["public relation", "public relations"], targets: ["public_relations"] },
  { phrases: ["desain grafis", "graphic designer", "desainer grafis"], targets: ["desain_komunikasi_visual"] },
  { phrases: ["teknisi pesawat"], targets: ["vokasi_teknik"], related: true },
];

/** Broad careers: keep the existing soft boost, never guaranteed. Documented for reviewers/tests. */
export const softOnlyAspirationTerms = [
  "teknik", "engineer", "insinyur", "guru", "dosen", "pengusaha", "bisnis", "kesehatan", "data analyst",
  "diplomat", "desainer", "pns", "bps", "polisi", "tentara",
];

export function aspirationTokens(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

type Entry = { tokens: string[]; phrase: string; tiers: string[][]; related: boolean[] };

/**
 * Slash pairs that are part of a catalog name (e.g. "UI/UX", "D3/D4"). Only these exact
 * pairs are joined before clause splitting; every other slash still separates clauses.
 */
const SLASH_PAIR = /([\p{L}\p{N}]+)\s*\/\s*([\p{L}\p{N}]+)/gu;

function catalogSlashPairs() {
  const pairs = new Set<string>();
  for (const major of knowledgeMajors)
    for (const name of [major.name, ...major.alternativeNames])
      for (const m of name.matchAll(SLASH_PAIR)) {
        const pair = `${aspirationTokens(m[1]).join(" ")}/${aspirationTokens(m[2]).join(" ")}`;
        // Two complete alternative names ("Entrepreneurship/Kewirausahaan") need no joining.
        if (m[1].length <= 3 || m[2].length <= 3) pairs.add(pair);
      }
  return pairs;
}

let slashPairs: Set<string> | undefined;

function joinCatalogSlashes(text: string) {
  slashPairs ??= catalogSlashPairs();
  return text.replace(SLASH_PAIR, (whole, left: string, right: string) =>
    slashPairs!.has(`${aspirationTokens(left).join(" ")}/${aspirationTokens(right).join(" ")}`) ? `${left} ${right}` : whole);
}

function buildEntries(): Entry[] {
  const byPhrase = new Map<string, { literal?: string; groups: Array<{ targets: string[]; related: boolean }> }>();
  const slot = (phrase: string) => byPhrase.get(phrase) ?? byPhrase.set(phrase, { groups: [] }).get(phrase)!;
  for (const major of knowledgeMajors) {
    for (const name of [major.name, ...major.alternativeNames]) {
      const phrase = aspirationTokens(name).join(" ");
      if (!phrase || excludedCatalogNames.has(phrase)) continue;
      const tokenCount = phrase.split(" ").length;
      if (tokenCount === 1 && phrase.length < 4) continue;
      slot(phrase).literal ??= major.id;
    }
  }
  for (const alias of curatedAspirationAliases)
    for (const raw of alias.phrases) slot(aspirationTokens(raw).join(" ")).groups.push({ targets: alias.targets, related: Boolean(alias.related) });

  return [...byPhrase.entries()]
    .map(([phrase, { literal, groups }]) => ({
      phrase,
      tokens: phrase.split(" "),
      // Literal catalog name wins; grouped aliases are the fallback when it is ineligible.
      tiers: [...(literal ? [[literal]] : []), ...groups.map((group) => (literal ? [...new Set([literal, ...group.targets])] : group.targets))],
      related: [...(literal ? [false] : []), ...groups.map((group) => !literal && group.related)],
    }))
    .sort((a, b) => b.tokens.length - a.tokens.length);
}

let entries: Entry[] | undefined;

function negatedPositions(tokens: string[]) {
  const negated = new Array<boolean>(tokens.length).fill(false);
  let active = false;
  tokens.forEach((token, index) => {
    if (SCOPE_BREAKERS.has(token)) active = false;
    else if (NEGATIONS.has(token)) active = true;
    else negated[index] = active;
  });
  return negated;
}

function matchClause(tokens: string[], list: Entry[]) {
  const negated = negatedPositions(tokens);
  const used = new Array<boolean>(tokens.length).fill(false);
  const hits: Array<{ at: number; entry: Entry }> = [];
  for (const entry of list) {
    const n = entry.tokens.length;
    for (let i = 0; i + n <= tokens.length; i++) {
      if (used.slice(i, i + n).some(Boolean)) continue;
      if (!entry.tokens.every((token, k) => tokens[i + k] === token)) continue;
      for (let k = i; k < i + n; k++) used[k] = true; // consume even if excluded, so sub-phrases don't re-match
      if (negated[i]) continue;
      const blockers = CONTEXT_EXCLUSIONS[entry.phrase];
      if (blockers && blockers.includes(tokens[i + n] ?? "")) continue;
      if (PRECEDING_EXCLUSIONS[entry.phrase]?.includes(tokens[i - 1] ?? "")) continue;
      hits.push({ at: i, entry });
    }
  }
  return hits.sort((a, b) => a.at - b.at);
}

/** Explicit major mentions in first-mention order (phrases never cross punctuation). */
export function matchExplicitAspirations(text: string): AspirationMatch[] {
  entries ??= buildEntries();
  return joinCatalogSlashes(text ?? "")
    .split(CLAUSE_SPLIT)
    .flatMap((clause) => matchClause(aspirationTokens(clause), entries!))
    .map(({ entry }) => ({ phrase: entry.phrase, tiers: entry.tiers, related: entry.related }));
}

/** Catalog names that are long enough to count but do not reach their own major (KB validation). */
export function catalogNameMismatches() {
  const issues: string[] = [];
  for (const major of knowledgeMajors)
    for (const name of [major.name, ...major.alternativeNames]) {
      const phrase = aspirationTokens(name).join(" ");
      if (!phrase || excludedCatalogNames.has(phrase) || (!phrase.includes(" ") && phrase.length < 4)) continue;
      const hits = matchExplicitAspirations(name);
      if (!hits.length || hits.some((hit) => !hit.tiers[0]?.includes(major.id))) issues.push(`${major.id}: ${name}`);
    }
  return issues;
}

const OFFICIAL_SERVICE_PHRASES = [
  "tni", "polri", "polisi", "polwan", "tentara", "militer", "akmil", "akpol", "aal", "aau", "kowad", "kowal", "kowau",
  "angkatan darat", "angkatan laut", "angkatan udara", "kedinasan", "sekolah kedinasan", "stan", "pknstan", "stis",
  "ipdn", "poltekip", "poltekim", "bmkg", "stmkg", "taruna", "abdi negara",
].map((phrase) => ({ phrase, tokens: phrase.split(" "), tiers: [] as string[][], related: [] as boolean[] }))
  .sort((a, b) => b.tokens.length - a.tokens.length);

export const OFFICIAL_SERVICE_NOTE =
  "Cita-citamu menyebut jalur kedinasan atau TNI/Polri. Jalur ini punya seleksi sendiri di luar pilihan jurusan. Cek syarat terbaru di situs resmi penyelenggaranya.";

export function mentionsOfficialService(text: string) {
  return (text ?? "").split(CLAUSE_SPLIT).some((clause) => matchClause(aspirationTokens(clause), OFFICIAL_SERVICE_PHRASES).length > 0);
}

/** Major IDs the matcher can produce, for KB validation. */
export function allAspirationTargetIds() {
  entries ??= buildEntries();
  return [...new Set(entries.flatMap((entry) => entry.tiers.flat()))];
}
