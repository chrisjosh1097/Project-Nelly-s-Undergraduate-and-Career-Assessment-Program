# UAT feedback + student understanding package

Branch: `feat/app-remake-pathway-flows` (never merge to main). Raw UAT file lives only in gitignored `.superpowers/sdd/2026-11-03-uat/`. No student names in code, tests, docs or commits.

## Sources
- **UAT document** (one student report + one assessment screenshot):
  - Split the "Masalah apa yang ingin kamu bantu selesaikan?" question into two steps: pick 3, then order them by priority and capacity.
  - Replace the 10 broad options with 8 impact-themed options.
- **Coordinator review of the same screenshots:**
  - Generic summary sentence.
  - Truncated strength line ending in "...".
  - A duplicate fit label.
  - A government-staff aspiration ("staf khusus") that was not recognised.
- **Follow-up proposals** accepted by the user: 1 (glossary), 4 (checklist / collapsible plan), 3 (competition ratio), 2 (compare majors), and 7 later (public major pages).

## Guardrails (unchanged)
- Old reports render exactly as stored. There is no silent rescoring, and old answers with old problem-area labels must still validate, render and export.
- Every scoring or KB change needs user approval and a `SCORING_VERSION` bump (v3.1.0 → v3.2.0).
- Gemini never changes scores, IDs or eligibility.
- Short Indonesian sentences (≤20 words), verb-first actions. No invented salary, visa, licence, price or company claims.
- Never show passing grade or acceptance chance.

---

## Part U — UAT changes

### U1. New problem-area options, pick exactly 3 (scoring change, needs approval)
New options (UAT wording) and their internal tag mapping:

| New option | Old option it replaces | Tags (`data/problemAreas.ts`) |
|---|---|---|
| Pemerataan Pendidikan dan Literasi | Pendidikan | education |
| Industri, Inovasi, dan Infrastruktur | Bisnis & Teknologi | business, technology, infrastructure |
| Lingkungan, Iklim, dan Kehidupan Laut | Lingkungan | environment (+ food for fisheries/agri?) |
| Akses Fasilitas Kesehatan dan Sanitasi Layak | Kesehatan | health |
| Perdamaian, Keadilan, dan Kelembagaan yang Tangguh | Sosial, Hukum | law, social |
| Manajemen dan Transparansi | Administrasi | public_service, finance |
| Kepemudaan dan Kebugaran Jasmani | Olahraga (new) | new tag `youth_sport` |
| Seni Berekspresi, Bahasa, dan Estetika | Komunikasi | creative_media |

- `problemAreas` keeps its field name, and validation accepts **old labels and new labels**. New submissions must use new labels with exactly 3 items.
- The UI enforces "Pilih 3"; the Lanjutkan button is disabled until 3 are chosen.
- KB: add the `youth_sport` tag to `ilmu_keolahragaan`, `pendidikan_jasmani` and `sport_science`. Review the language and communication majors for `creative_media`.
- **Coverage gap (decision needed):** finance majors only map through "Manajemen dan Transparansi", and food/agri majors have no clear option. Choose between:
  - (a) accept the gap;
  - (b) map food to "Lingkungan…";
  - (c) add a 9th option "Ketahanan Pangan dan Pertanian".
- **Tests:**
  - Old submission fixture still validates and renders.
  - New 3-item rule.
  - Mapping table.
  - `validate:kb` checks that every major has at least one tag reachable from the new options.

### U2. Priority order step (scoring change, needs approval)
- A new step after U1, titled "Urutkan sesuai prioritas dan kapasitasmu".
- Show the 3 chosen items as a list.
  - Phone: move up/down buttons (≥44px) as the primary control.
  - Desktop: drag as an optional extra.
  - Keyboard accessible, with a live region announcing the new position.
- Store as `problemAreaPriority: string[]`. The field is optional, so old answers have none.
- **Scoring:** problem-area score is weighted by rank: 1 → 1.0, 2 → 0.8, 3 → 0.6 inside `scoreWeightedTags`. The total weight stays 10%, and there is no change when priority is absent.
- Review step and admin detail show the order; CSV and PDF show "1. … 2. … 3. …".
- **Tests:** reorder by buttons and keyboard; the rank weighting is bounded; old reports are not rescored.

### U3. Result-page fixes seen in the UAT screenshot (display only unless noted)
1. **Duplicate label:** hide "Label laporan tersimpan: X" when X equals the interpretation. Show it only on conflict, same as the cards.
2. **Truncated strength line:** do not cut student-facing sentences with "...". Shorten the list (max 2 items per list) instead of the sentence. Fix in `narrative.ts` (`truncateAtWord` callers) for new reports. For old stored text, show it as stored; it is not regenerated.
3. **Generic summary** ("Rekomendasi utama untuk X adalah Y dengan skor…"): build a deterministic 2-sentence summary from the existing breakdown, for new reports only. It names the strongest component and one concrete next step. Gemini may rephrase but not change facts.
4. **Unrecognised government aspiration** (scoring change, needs approval):
   - Add aspiration signals `staf khusus|stafsus|pemerintah|pns|asn|birokra|kebijakan publik|gubernur|dpr|kementerian` → governance/public-policy theme.
   - This affects the aspiration boost, so it falls under the `SCORING_VERSION` bump.
5. **Low-information aspiration text** (for example random words): keep the student's text, but do not build reflections on it. Add the hint "Tulis cita-cita yang lebih spesifik, misalnya profesi atau masalah yang ingin kamu bantu" in the assessment form when the text is under 2 meaningful words. Display only; no blocking.

---

## Part S — Student understanding package (display only, no scoring change)

### S1. Glossary chips (kecil)
- `data/glossary.ts` defines these terms:
  - Degrees and programme types: D3, D4, S1, Vokasi, Sarjana Terapan.
  - Institutions: PTN, PTS, Kedinasan, LLDikti, PDDikti.
  - Admission routes: SNBP, SNBT, Mandiri.
  - Data label: Daya tampung.
- Each definition is ≤20 words and reviewed by the user before release.
- `Term` component: button + popover. Tap on phone, focusable on desktop.
- Used on the Hasil badges, the campus block and `/kampus`.

### S2. Actionable 4-week plan (C9)
- On phone, collapse the plan into a `<details>` "Rencana 4 minggu (4 langkah)", open by default on desktop.
- Add a checkbox per week, saved in `localStorage` under a key derived from submission id + majorId. Nothing is written to Firebase.
- Show progress: "2 dari 4 selesai".

### S3. Competition ratio (approved data, label carefully)
- On campus rows with quota and applicants: "± 1 kursi : 18 peminat (SNPMB 2024)".
- Tooltip text: "Ini bukan passing grade atau peluang diterima."
- Hidden when quota is 0 or missing.

### S4. Compare 2–3 majors (B6 extended)
- Add a "Bandingkan" toggle on each recommendation card, max 3, in a sticky bottom bar on phone.
- The comparison table shows:
  - Fit score
  - AI resilience score
  - Degree types
  - Top 2 subjects
  - Top 2 skill gaps
  - Two careers
  - Campus count from the catalog (via `/api/campus/major`, `total`)
- On phone: horizontal scroll with a sticky first column.

### S5 (later). Public major pages `/jurusan/[id]`
- Static pages for 115 majors, built from the KB. Each page shows what is studied, skills, subjects, careers, AI resilience and a campus examples block.
- Linked from `/kampus` results and from the cards.

---

## Order of work
1. **U3.1–U3.2, S1, S2:** pure display, quick wins.
2. **U1 + U2 + U3.3–U3.5:** one scoring release v3.2.0, after the user approves the mapping and weights.
3. **S3, S4.**
4. **S5.**

Each step runs `npm test`, typecheck, lint, `validate:kb`, build, and the browser tests at 320/375/1280 px. Push only on request.

## Decisions needed from the user
1. Approve the U1 mapping table and the coverage gap choice (a/b/c).
2. Approve the U2 rank weights (1.0 / 0.8 / 0.6) and the v3.2.0 bump.
3. Approve the U3.4 government-aspiration keywords.
4. Must it be exactly 3, or "maksimal 3"?
5. Approve S3 ratio wording.

## Decisions (user, 2026-11-03)
1. U1 coverage gap: **(b)**, so "Lingkungan, Iklim, dan Kehidupan Laut" also maps to `food`.
2. **Maksimal 3** (1–3 items), not exactly 3. The order step is skipped when only 1 item is chosen.
3. Rank weights 1.0 / 0.8 / 0.6 and `SCORING_VERSION` v3.2.0 approved.
4. Government-aspiration keywords approved.
5. S3 ratio wording approved.

## Progress — Step 2 (v3.2.0)
- [x] U1: 8 new problem-area options, max 3, legacy labels still validate; `problemAreaOptionTags` multi-tag map; new `youth_sport` tag on 3 sport majors; `validate:kb` reachability check.
- [x] U2: ranking step (shown only for 2–3 choices); order = array order of `problemAreas` (no new field); weights 1.0/0.8/0.6 in `scoreRankedProblemAreas`, total weight still 10%; legacy answers use the old scorer.
- [x] Review/CSV/PDF show "1. … 2. … 3. …" for ranked answers; Gemini prompt gets `problemAreasRankedByPriority`.
- [x] U3.4: government keywords → public_service text signal + strong keyword boost for administrasi_publik / ilmu_politik.
- [x] U3.5: non-blocking hint when aspiration text has no meaningful word.
- [x] `SCORING_VERSION` → knowledge-base-heuristic-v3.2.0. Saved reports are not rescored.
