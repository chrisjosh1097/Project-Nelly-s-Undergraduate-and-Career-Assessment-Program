# Campus & Program Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show real example campuses for each recommended major on the results page, and add a public "Cari kampus & jurusan" menu, using a reviewed static dataset.

**Architecture:** A manual import script merges two public datasets into one committed JSON file (`data/campus/catalog.json`). A server-only module answers "campuses for majorId" and "search programs" from that file. Two read-only API routes expose it. The results page and the new `/kampus` page fetch from those routes. Scoring, ranking, eligibility and saved reports are untouched.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind 3.4, Vitest, Playwright CT, `npx tsx` for scripts.

**Spec:** this plan. The decisions come from the chat on 2026-11-02 (option "file data tersimpan dari dua sumber").

## Global Constraints

- **Sources:**
  - `joearton/perguruan-tinggi` (`program-studi.csv`, `perguruan-tinggi.csv`, 2022). Use was permitted by the author, who is a friend of the owner.
  - SNBTKU dataset by Ibnul Habib (MIT). Use the CSV `perguruan-tinggi-indonesia.csv` and the API `https://api.ibnuhabib.web.id/api/v1/majors`. The API allows `limit` ≤ 100 and 120 requests per minute, so throttle to at most 1 request per second.
- **No runtime calls to third-party APIs.** Only the import script talks to the network. The app reads only `data/campus/catalog.json`.
- **Display only.** Never change `SCORING_VERSION`, scores, ranks, eligibility or saved Firestore data. Legacy reports may show campuses, derived from `majorId` at view time.
- **Never show** `passing_grade`, `min_score`, `max_score` or `classification`.
  - Quota and applicants may be shown only with the label `(SNPMB 2024)`.
- **Source line, verbatim**, wherever campus data appears: `Sumber: kompilasi PDDikti (joearton, 2022) dan data SNPMB 2024 (Ibnul Habib, MIT). Data bisa berubah — cek sumber resmi.`
- **PDDikti check link:** `https://pddikti.kemdiktisaintek.go.id/search/<encodeURIComponent(campus name)>`.
- **Degrees:** keep only `D3`, `D4` and `S1`.
  - Map `D-III` and `Diploma Tiga` to D3.
  - Map `D-IV` and `Sarjana Terapan` to D4.
  - Map `S1` and `Sarjana` to S1.
  - Drop everything else.
- **Maritime route:** major `teknika_permesinan_kapal` always also shows this note: `Sekolah pelayaran/kedinasan resmi mungkin tidak ada di daftar ini — cek situs instansinya.` (The KB has no separate nautika major.)
- **Copy:** Indonesian, short sentences (≤20 words). Touch targets ≥44px. No horizontal overflow at 320px.
- **Server-only data:** `catalog.json` must never be imported by a client component.
- **Branch:** work stays on `feat/app-remake-pathway-flows`. Never merge to main. Push only on request.

## Review Focus

1. **Legacy or removed `majorId`, or a major with no mapped programs:** the campus block hides entirely. There is no empty box and no error. Test in Task 4.
2. **Vocational student whose recommendation is D3/D4:** show D3/D4 campuses first, and show S1 only when `degreeTypes` includes S1. Test in Task 2.
3. **Search input with very long text, regex characters (`(`, `*`, `\`), or only spaces:** return 400 for >60 chars. Treat characters literally. Empty query returns the first page. Test in Task 3.
4. **Campus API fails or is slow on the results page:** the block shows only the "Cari di PDDikti" link and the rest of the page is unaffected. Test in Task 4.
5. **Duplicate rows (same campus, program and degree from both sources, or with different casing):** they appear once, with SNPMB fields kept. Test in Task 1.

---

### Task 1: Import script and committed catalog

**Files:**
- Create: `scripts/importCampusCatalog.ts`
- Create: `src/lib/campus/normalize.ts` (pure helpers, reused by Task 2)
- Create (generated): `data/campus/catalog.json`
- Create: `data/campus/README.md` (sources, licence and permission note, how to re-run)
- Test: `tests/campusNormalize.test.ts`
- Modify: `package.json`, adding the script `"import:campus": "tsx scripts/importCampusCatalog.ts"`

**Interfaces:**
- Produces in `src/lib/campus/normalize.ts`:
  - `type Degree = "D3" | "D4" | "S1"`
  - `normalizeDegree(raw: string): Degree | null`
  - `normalizeName(raw: string): string`:
    - trims and collapses spaces;
    - removes a trailing parenthetical code such as `(NK)` or `(PSDKU …)`;
    - converts ALL CAPS to Title Case and leaves mixed case unchanged;
    - keeps acronyms of 2–5 uppercase letters (ITB, UPN, IPB).
  - `nameKey(raw: string): string`, which applies `normalizeName`, lowercases, removes punctuation and collapses spaces.
  - `CampusCatalog` type:

```ts
interface CatalogCampus { id: number; name: string; type: "Negeri" | "Swasta/Lainnya"; province?: string; lldikti?: number }
interface CatalogProgram { campus: number; name: string; degree: Degree; quota2024?: number; applicants2024?: number }
interface CampusCatalog { generatedAt: string; campuses: CatalogCampus[]; programs: CatalogProgram[] }
```

- [ ] **Step 1: Write failing tests** in `tests/campusNormalize.test.ts`:
  - `normalizeDegree`: `"D-III"` and `"Diploma Tiga"` give `"D3"`. `"Sarjana Terapan"` gives `"D4"`. `"Sarjana"` gives `"S1"`. `"S2"`, `""` and `"Profesi"` give `null`.
  - `normalizeName("TEKNIK PERTAMBANGAN (NK)")` gives `"Teknik Pertambangan"`.
  - `normalizeName("INSTITUT TEKNOLOGI BANDUNG (ITB)")` gives `"Institut Teknologi Bandung"`.
  - `nameKey("Teknika ")` equals `nameKey("TEKNIKA")`.
  - `mergeRows` (exported from the script module as a pure function) receives two rows with the same campus, program and degree, one from each source. It returns one program, with `quota2024` taken from the SNPMB row.
- [ ] **Step 2: Run** `npx vitest run tests/campusNormalize.test.ts`. Expect FAIL, because the module is missing.
- [ ] **Step 3: Implement** `normalize.ts`, then the script.
  - The script reads joearton CSVs from `--raw <dir>` (default `.superpowers/sdd/2026-11-02-campus-data/`, which is gitignored). Download them there if they are absent.
  - Page the SNBTKU majors API (`limit=100`, sleeping 1s between pages) until `offset >= total`. Read the SNPMB CSV for `region` (province) and `type`.
  - Campus type: `Negeri` if the campus is in SNPMB or its name starts with "Universitas Negeri", "Politeknik Negeri" or "Institut Teknologi … Negeri". Otherwise `Swasta/Lainnya`.
  - `province` comes from SNPMB `region` when the campus is in SNPMB. Otherwise leave it unset and keep `lldikti` from the joearton column 5 when it is non-empty.
  - Dedupe programs by `campusKey|nameKey(program)|degree`.
  - Sort campuses by name, then programs by campus and name.
  - Write minified JSON. Print counts: campuses, programs, programs per degree, dropped rows by reason.
- [ ] **Step 4: Run the tests.** Expect PASS. Then run `npm run import:campus`. Expect the counts to print, at least 10,000 programs, and `catalog.json` to be ≤ 2.5 MB.
- [ ] **Step 5: Commit** the script, `normalize.ts`, the test, `catalog.json`, `README.md` and `package.json`, with the message `feat(campus): import reviewed campus/program catalog`.

### Task 2: Major-to-program mapping and catalog queries

**Files:**
- Create: `data/campusMajorMap.ts`
- Create: `src/lib/campus/catalog.ts` (the `server-only` package is not installed: add the comment `// server-only` at the top and never import it from a client component)
- Modify: `scripts/validateKnowledgeBase.ts` to add the mapping check
- Test: `tests/campusCatalog.test.ts`

**Interfaces:**
- Consumes: `CampusCatalog`, `Degree`, `nameKey` from Task 1, and `majorsById` from `data/majors.ts`.
- Produces in `data/campusMajorMap.ts`:
  - `campusMajorMap: Record<string, { include: string[]; exclude?: string[] } | { none: string }>`, keyed by every majorId.
  - `include` and `exclude` are lowercase phrases matched as whole words inside `nameKey(program.name)`.
  - `none` explains why there is no mapping, for example a non-degree route.
- Produces in `src/lib/campus/catalog.ts`:
  - `interface CampusMatch { campus: string; type: "Negeri" | "Swasta/Lainnya"; province?: string; program: string; degree: Degree; quota2024?: number; applicants2024?: number; pddiktiUrl: string }`
  - `campusesForMajor(majorId: string, opts: { degreeTypes?: string[]; preferences?: string[]; limit?: number }): { items: CampusMatch[]; total: number; maritimeNote: boolean }`, where `limit` defaults to 6 and is capped at 12.
  - `searchPrograms(q: { text?: string; province?: string; degree?: Degree; type?: "Negeri" | "Swasta/Lainnya"; page?: number }): { items: CampusMatch[]; total: number; page: number; pageSize: 20 }`
  - `listProvinces(): string[]`

- [ ] **Step 1: Write failing tests** in `tests/campusCatalog.test.ts`, using the real `catalog.json`:
  - Every `Object.keys(majorsById)` id has an entry in `campusMajorMap`.
  - Every `include` entry yields `total > 0`.
  - `campusesForMajor("teknika_permesinan_kapal", { degreeTypes: ["D3","D4"] })`:
    - `items.length > 0`;
    - every degree is in `["D3","D4"]`;
    - `maritimeNote === true`.
  - With `degreeTypes: ["D3","D4","S1"]`, the first item's degree is D3 or D4 (vocational first).
  - With `preferences: ["PTN di Jawa"]`, the first item has `type: "Negeri"` and a province in the Java set (DKI Jakarta, Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur, Banten).
  - `campusesForMajor("unknown_major", {})` returns `{ items: [], total: 0, maritimeNote: false }`.
  - `searchPrograms({ text: "teknik (pertambangan" })` does not throw.
  - `searchPrograms({ text: "pertambangan", degree: "D3" })` returns only D3 items, and `pageSize` is 20.
  - No `CampusMatch` key contains `passing`, `min_score` or `classification`.
- [ ] **Step 2: Run** `npx vitest run tests/campusCatalog.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.**
  - Load `catalog.json` once at module level. Build an index of `nameKey`, then match with a plain `includes` on space-padded strings (no RegExp built from user input).
  - Degree filter: intersect the program degree with `degreeTypes` (treat `"Vokasi"` as D3+D4). If none are given, allow all three.
  - Ordering: preference matches first, then D3/D4 before S1 when the list includes D3/D4, then `Negeri` before others, then `applicants2024` descending, then name.
  - Preference rules:
    - `"PTN di Jawa"`: Negeri and Java province.
    - `"PTN luar Jawa"`: Negeri and a non-Java province.
    - `"PTS bagus di kota besar"`: Swasta/Lainnya.
    - Ignore the others.
  - Fill the mapping for all 115 majors, using `none` only for majors with no Indonesian program equivalent.
  - In `validateKnowledgeBase.ts`, fail if any major is missing from the map or any `include` entry matches 0 programs. Print `campus map: N mapped, M none`.
- [ ] **Step 4: Run** the tests and `npm run validate:kb`. Expect PASS and the campus map line.
- [ ] **Step 5: Commit** with the message `feat(campus): map majors to catalog programs with ranked queries`.

### Task 3: Read-only API routes

**Files:**
- Create: `src/app/api/campus/major/[majorId]/route.ts`
- Create: `src/app/api/campus/search/route.ts`
- Test: `tests/campusRoutes.test.ts` (follow the style of `tests/adminRoutes.test.ts`)

**Interfaces:**
- Consumes: `campusesForMajor`, `searchPrograms`, `listProvinces` from Task 2.
- Produces:
  - `GET /api/campus/major/:majorId?degree=D3&degree=D4&pref=PTN%20di%20Jawa` returns `{ items, total, maritimeNote, source }`.
  - `GET /api/campus/search?q=&province=&degree=&type=&page=` returns `{ items, total, page, pageSize, provinces, source }`.
  - `source` is the verbatim source line from Global Constraints.
  - Both are public (the data is public) and set `Cache-Control: public, max-age=3600`.

- [ ] **Step 1: Write failing tests:**
  - Major route returns 200 for a known id and 200 with `items: []` for an unknown id that matches `^[a-z0-9_]{1,64}$`. It returns 400 for `majorId` with other characters.
  - Search route returns 400 for `q` longer than 60 characters, `page` < 1 or > 500, a `degree` outside D3/D4/S1, or an unknown `type`. Whitespace-only `q` is treated as empty and returns 200 with page 1.
  - Both responses include `source` and the `Cache-Control` header.
- [ ] **Step 2: Run** `npx vitest run tests/campusRoutes.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement** the routes with the validation above. Return `{ error: "Permintaan tidak valid." }` on 400.
- [ ] **Step 4: Run** the tests. Expect PASS.
- [ ] **Step 5: Commit** with the message `feat(campus): public read-only campus API routes`.

### Task 4: "Contoh kampus" on the results page

**Files:**
- Create: `src/components/results/CampusExamples.tsx` (client component; fetches only)
- Modify: `src/components/results/RecommendationCard.tsx` to render it in the top card's right column under `WeekPlan`, and inside alternatives only when `expanded`
- Modify: `src/components/results/ResultsView.tsx`, adding a "Cari kampus & jurusan lain" link to `/kampus?q=<top majorName>` in the "Kampus dan jalur belajarmu" panel
- Test: `tests/browser/campusExamples.spec.tsx`, which stubs `fetch` via `page.route("**/api/campus/**")`

**Interfaces:**
- Consumes: `GET /api/campus/major/:majorId` from Task 3.
- Produces: `CampusExamples({ majorId, majorName, degreeTypes, preferences }: { majorId: string; majorName: string; degreeTypes?: string[]; preferences?: string[] })`.

- [ ] **Step 1: Write failing browser tests:**
  - **Success with 3 items:**
    - The heading `Contoh kampus yang membuka jurusan ini` is visible.
    - Each item shows the campus, program, a degree badge and the province when present.
    - Quota renders as `Daya tampung 70 (SNPMB 2024)`.
    - Each "Cek di PDDikti" link has an `href` starting with `https://pddikti.kemdiktisaintek.go.id/search/`, `target="_blank"` and `rel="noopener noreferrer"`.
    - The source line is visible verbatim.
  - **`maritimeNote: true`:** the maritime note text is visible.
  - **`items: []`:** no heading and no empty container (the component renders null).
  - **500 or network abort:** only the link `Cari di PDDikti` is shown, and the rest of `ResultsView` still renders (the top major name is visible).
  - **At 320px:** `scrollWidth <= innerWidth`, and the links are ≥44px tall.
  - **Results with a closed alternative:** no request is made for that alternative's majorId until it is opened (assert on the route call count).
- [ ] **Step 2: Run** `bash`'s Playwright command on the spec. Expect FAIL.
- [ ] **Step 3: Implement** with `useEffect` + `AbortController`.
  - Show a skeleton for at most 1 line while loading.
  - Pass `preferences` from `submission.answers.collegePathPreferences` and `degreeTypes` from the recommendation.
- [ ] **Step 4: Run** the spec, then the full `tests/browser/results.spec.tsx`. Expect all to pass, with existing tests unchanged.
- [ ] **Step 5: Commit** with the message `feat(results): show example campuses per recommended major`.

### Task 5: "Cari kampus & jurusan" menu

**Files:**
- Create: `src/app/kampus/page.tsx` (public; no auth)
- Create: `src/components/campus/CampusSearch.tsx` (client)
- Modify: `src/components/auth/Header.tsx`, adding a link `{ href: "/kampus", label: "Kampus", icon: School }` after "Hasilmu"
- Test: `tests/browser/campusSearch.spec.tsx`

**Interfaces:**
- Consumes: `GET /api/campus/search` from Task 3.
- Produces: the page `/kampus`. It reads the initial `q` from `?q=`, and the URL updates with `q`, `province`, `degree`, `type` and `page` via `router.replace`.

- [ ] **Step 1: Write failing browser tests (stubbed route):**
  - Typing `teknika` and submitting renders result cards. Each shows the campus, program, a degree badge, the type, the province or `Wilayah LLDikti N`, and a PDDikti link.
  - Filters: a degree select (Semua/D3/D4/S1), a province select filled from `provinces`, and a type select. Changing one triggers a request with that param.
  - Pagination: "Berikutnya" is disabled on the last page.
  - Text `Menampilkan 21–40 dari 57`.
  - Empty result shows `Belum ada yang cocok. Coba kata lain, misalnya "teknik mesin".`
  - A 500 error shows an error message and a "Coba lagi" button.
  - The source line is visible.
  - At 320px there is no horizontal overflow, and controls are ≥44px tall.
  - The header shows the "Kampus" link with `aria-current="page"` on `/kampus`.
- [ ] **Step 2: Run** the spec. Expect FAIL.
- [ ] **Step 3: Implement.** Debounce typing by 300ms; submitting searches immediately. The page title is `Cari kampus & jurusan`.
- [ ] **Step 4: Run** the spec plus `tests/browser/mobileRegression.spec.tsx` and `brand.spec.tsx`. Expect PASS.
- [ ] **Step 5: Commit** with the message `feat(campus): public campus and program search page`.

### Task 6: Verification and handoff

- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run validate:kb`, `npm run build`, and the full browser suite. Expect all to pass.
- [ ] Bundle check: after the build, run `grep -rl "Akademi Maritim" .next/static`. Expect no output, which shows the catalog is not shipped to the client.
- [ ] Visual check: take screenshots of the results page (desktop and 360px) and `/kampus` (360px) into `.superpowers/sdd/2026-11-02-campus-data/`.
- [ ] Update `progress.md` and report to the user. Do not push.
