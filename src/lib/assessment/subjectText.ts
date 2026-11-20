// v3.3.0: deterministic, reviewed variants for the free-text "Lainnya" subject.
// Phrases are matched as whole token sequences; no fuzzy matching.

type SubjectTextRule = { phrases: string[]; ids: string[] };

export const subjectTextRules: SubjectTextRule[] = [
  { phrases: ["matematika tingkat lanjut", "matematika lanjut", "mtk lanjut", "mtk tingkat lanjut", "matematika peminatan", "mtk peminatan"], ids: ["mathematics", "advanced_mathematics"] },
  { phrases: ["matematika", "mtk", "math"], ids: ["mathematics"] },
  { phrases: ["fisika"], ids: ["physics"] },
  { phrases: ["kimia"], ids: ["chemistry"] },
  { phrases: ["biologi"], ids: ["biology"] },
  { phrases: ["informatika", "tik", "komputer", "coding", "pemrograman"], ids: ["computer"] },
  { phrases: ["bahasa inggris", "b inggris", "english", "inggris"], ids: ["language", "foreign_language"] },
  { phrases: ["bahasa jepang", "jepang", "bahasa mandarin", "mandarin", "bahasa arab", "arab", "bahasa jerman", "jerman", "bahasa korea", "korea", "bahasa prancis", "prancis", "perancis", "bahasa asing"], ids: ["language", "foreign_language"] },
  { phrases: ["bahasa indonesia", "b indonesia", "b indo", "bahasa indo", "sastra", "bahasa"], ids: ["language"] },
  { phrases: ["ekonomi"], ids: ["economics"] },
  { phrases: ["akuntansi", "akutansi"], ids: ["accounting"] },
  { phrases: ["sosiologi"], ids: ["sociology"] },
  { phrases: ["geografi", "geografis", "geo"], ids: ["geography"] },
  { phrases: ["sejarah"], ids: ["history"] },
  { phrases: ["antropologi"], ids: ["anthropology"] },
  { phrases: ["ppkn", "pkn", "pancasila", "pendidikan pancasila", "kewarganegaraan", "civic", "civics"], ids: ["civics"] },
  { phrases: ["agama", "pai", "pendidikan agama", "fiqih", "fikih", "akidah", "aqidah", "akhlak"], ids: ["religion"] },
  { phrases: ["seni musik", "musik", "seni tari", "tari", "menari", "teater", "drama", "paduan suara"], ids: ["performing_arts"] },
  { phrases: ["seni rupa", "menggambar", "desain", "seni budaya", "seni"], ids: ["arts_design"] },
  { phrases: ["pjok", "penjas", "olahraga", "penjaskes"], ids: ["sports"] },
  { phrases: ["prakarya", "kewirausahaan", "wirausaha", "pkwu"], ids: ["entrepreneurship"] },
];

export function subjectTextTokens(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

const compiled = subjectTextRules
  .flatMap((rule) => rule.phrases.map((phrase) => ({ tokens: subjectTextTokens(phrase), ids: rule.ids })))
  .sort((a, b) => b.tokens.length - a.tokens.length);

/** Subject IDs recognized in free text, in first-mention order. Unknown text yields []. */
export function subjectIdsFromText(value: string): string[] {
  const tokens = subjectTextTokens(value ?? "");
  const used = new Array<boolean>(tokens.length).fill(false);
  const hits: Array<{ at: number; ids: string[] }> = [];
  for (const entry of compiled) {
    const n = entry.tokens.length;
    for (let i = 0; i + n <= tokens.length; i++) {
      if (used.slice(i, i + n).some(Boolean)) continue;
      if (entry.tokens.every((token, k) => tokens[i + k] === token)) {
        for (let k = i; k < i + n; k++) used[k] = true;
        hits.push({ at: i, ids: entry.ids });
      }
    }
  }
  return [...new Set(hits.sort((a, b) => a.at - b.at).flatMap((hit) => hit.ids))];
}
