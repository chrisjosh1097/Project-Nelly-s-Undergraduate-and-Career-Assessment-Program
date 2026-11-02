/**
 * Manual import: builds data/campus/catalog.json from
 *  - joearton/perguruan-tinggi program-studi.csv (2022, used with the author's permission)
 *  - SNBTKU dataset by Ibnul Habib (MIT): https://api.ibnuhabib.web.id/api/v1/majors
 * Run: npm run import:campus [-- --raw <dir>]
 * The app never calls these sources at runtime.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { mergeRows, normalizeDegree, type RawProgramRow } from "../src/lib/campus/normalize";

const JOEARTON_URL = "https://raw.githubusercontent.com/joearton/perguruan-tinggi/main/program-studi.csv";
const SNBTKU_URL = "https://api.ibnuhabib.web.id/api/v1/majors";
const OUT = join("data", "campus", "catalog.json");

const rawArg = process.argv.indexOf("--raw");
const RAW_DIR = rawArg > 0 ? process.argv[rawArg + 1] : join(".superpowers", "sdd", "2026-11-02-campus-data");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dropped: Record<string, number> = {};
const drop = (reason: string) => (dropped[reason] = (dropped[reason] ?? 0) + 1);

async function joeartonRows(): Promise<RawProgramRow[]> {
  mkdirSync(RAW_DIR, { recursive: true });
  const file = join(RAW_DIR, "prodi.csv");
  if (!existsSync(file)) {
    const res = await fetch(JOEARTON_URL);
    if (!res.ok) throw new Error(`joearton download failed: ${res.status}`);
    writeFileSync(file, await res.text());
  }
  const rows: RawProgramRow[] = [];
  for (const line of readFileSync(file, "utf8").split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(",");
    if (cols.length !== 6) { drop("joearton: malformed line"); continue; }
    const [, program, campus, rawDegree, rawLldikti] = cols;
    const degree = normalizeDegree(rawDegree);
    if (!degree) { drop(`joearton: degree ${rawDegree || "(kosong)"}`); continue; }
    const lldikti = Number.parseInt(rawLldikti, 10);
    rows.push({ source: "joearton", campus, program, degree, ...(Number.isFinite(lldikti) ? { lldikti } : {}) });
  }
  return rows;
}

interface SnbtkuMajor {
  university_name: string;
  university_region?: string;
  name: string;
  degree: string;
  quota?: number | null;
  applicants?: number | null;
}

async function snbtkuRows(): Promise<RawProgramRow[]> {
  const rows: RawProgramRow[] = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const res = await fetch(`${SNBTKU_URL}?limit=100&offset=${offset}`);
    if (!res.ok) throw new Error(`SNBTKU page ${offset} failed: ${res.status}`);
    const page = (await res.json()) as { items: SnbtkuMajor[]; total: number };
    total = page.total;
    for (const item of page.items) {
      const degree = normalizeDegree(item.degree);
      if (!degree) { drop(`snpmb: degree ${item.degree}`); continue; }
      rows.push({
        source: "snpmb",
        campus: item.university_name,
        program: item.name,
        degree,
        ...(item.university_region ? { province: item.university_region } : {}),
        ...(typeof item.quota === "number" ? { quota2024: item.quota } : {}),
        ...(typeof item.applicants === "number" ? { applicants2024: item.applicants } : {}),
      });
    }
    offset += page.items.length || 100;
    process.stdout.write(`\rSNBTKU ${Math.min(offset, total)}/${total}`);
    await sleep(1000);
  }
  process.stdout.write("\n");
  return rows;
}

async function main() {
  const joe = await joeartonRows();
  const snpmb = await snbtkuRows();
  const catalog = mergeRows([...snpmb, ...joe], new Date().toISOString().slice(0, 10));
  mkdirSync(join("data", "campus"), { recursive: true });
  writeFileSync(OUT, JSON.stringify(catalog));
  const perDegree: Record<string, number> = {};
  for (const p of catalog.programs) perDegree[p.degree] = (perDegree[p.degree] ?? 0) + 1;
  console.log(`input rows: joearton ${joe.length}, snpmb ${snpmb.length}`);
  console.log(`campuses ${catalog.campuses.length} (negeri ${catalog.campuses.filter((c) => c.type === "Negeri").length})`);
  console.log(`programs ${catalog.programs.length}`, perDegree);
  console.log("dropped", dropped);
  console.log(`${OUT}: ${(statSync(OUT).size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
