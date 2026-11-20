# Scoring v3.3.0: SMA Subjects and Aspiration Guarantee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision 3.** Applies the second GPT-6.2 Sol review: the text add-on only helps, short catalog names, literal-name precedence, clause-aware negation, and an aggregate-only replay.

**Revision 2.** This revision applies the GPT-6.2 Sol review, which returned "rework". Its blockers are addressed below: (1) a choice-based subject scorer, (2) an explicit alias list plus coverage validation, and (3) a guarantee step that runs after the pool is selected.

**Goal:** Make recommendations respect what students actually told us:
- List the SMA subjects as explicit options.
- Read the free-text "Lainnya" subject.
- Guarantee that up to three majors named in the dream-profession field appear in the top 10, without changing any score.

**Context:**
- Teachers flagged seven reports (referred to below as cases A–G).
- The read-only investigation is private, in `.superpowers/sdd/2026-11-07-expectation-cases/`.
- The stored results reproduce exactly under v3.2.0. The real causes are:
  - The "Lainnya" subject text is ignored. Geografi is the most frequent entry (~35 of 366), followed by PPKn, agama, bahasa inggris, antropologi, seni, informatika, and "matematika tingkat lanjut".
  - The aspiration boost is capped at +6. One student named teknik komputer and still got it at #30.
  - Military and official-service dreams ("TNI AU", "akpol", "akmil") produce no output at all.

**Architecture:**
- Deterministic regex and dictionaries, with no ML (a user decision).
- Scores stay honest. The guarantee only changes which eligible majors are shown, never their scores or breakdowns.
- `SCORING_VERSION` becomes `knowledge-base-heuristic-v3.3.0`.
- Stored reports are never rescored. They render exactly as stored, and nothing is derived for them at render time.
- Gemini still cannot change scores, IDs, ranks, degrees, or eligibility.

**Tech Stack:** Next 16, TypeScript, Zod, Vitest, Playwright CT.

## Decisions

### D1. Subject options (scope: Kurikulum Merdeka SMA, Fase E/F, mata pelajaran umum + pilihan)
The form shows the options in this order:
`Matematika`, `Matematika Tingkat Lanjut`, `Fisika`, `Kimia`, `Biologi`, `Informatika`, `Bahasa Indonesia`, `Bahasa Inggris`, `Bahasa Asing Lain (Jepang, Mandarin, Arab, Jerman, Korea, dll.)`, `Ekonomi`, `Akuntansi`, `Sosiologi`, `Geografi`, `Sejarah`, `Antropologi`, `Pendidikan Pancasila (PPKn)`, `Pendidikan Agama dan Budi Pekerti`, `Seni Rupa/Desain`, `Seni Musik`, `Seni Tari/Teater`, `PJOK (Olahraga)`, `Prakarya dan Kewirausahaan`, `Lainnya`.
- **Intentional groupings:**
  - Advanced versions of Fisika, Kimia, Biologi, Ekonomi, Sosiologi, Geografi, and Sejarah are folded into their base subject.
  - Non-English foreign languages share one option.
  - Seni Teater is grouped with Tari.
  - Bahasa Indonesia/Inggris Tingkat Lanjut fold into their base.
  - The SMK vocational subjects can still use `Lainnya`. The same list is shown to SMK, as it is today.
- The maximum stays at **3** checkboxes.
- The old labels `Bahasa`, `Seni/Desain`, `Komputer/TIK`, and `Olahraga` become `legacyFavoriteSubjectOptions`. They are still valid in the API and in normalization, but they are not shown.
- There is no draft persistence, so there is no form path that renders legacy values. This was confirmed in `AssessmentForm.tsx`.

### D2. Subject dimensions and a choice-based subject scorer (fixes blocker 1)
Each checkbox becomes **one choice**, which has a single `primaryId` and an optional `specificityId`:

| Option | primaryId | specificityId |
|---|---|---|
| Matematika | mathematics | – |
| Matematika Tingkat Lanjut | mathematics | advanced_mathematics |
| Informatika / Komputer/TIK | computer | – |
| Bahasa Indonesia / Bahasa | language | – |
| Bahasa Inggris | language | foreign_language |
| Bahasa Asing Lain | language | foreign_language |
| Akuntansi | accounting | – |
| Geografi | geography (new) | – |
| Antropologi | anthropology (new) | – |
| PPKn | civics (new) | – |
| Agama | religion (new) | – |
| Seni Rupa/Desain / Seni/Desain | arts_design | – |
| Seni Musik, Seni Tari/Teater | performing_arts (new) | – |
| PJOK / Olahraga | sports | – |
| Prakarya dan Kewirausahaan | entrepreneurship | – |
| Others | as v3.2 | – |

`scoreSubjectChoices(choices, major.relatedSubjects)` works as follows:
1. **Deduplicate.** Choices that share a `primaryId` merge into one, keeping the union of their specificity IDs. For example, Matematika + Matematika Tingkat Lanjut becomes one `mathematics` choice with an advanced specificity.
2. **Lainnya.** This step runs only when `Lainnya` is checked and the text is recognized. The `Lainnya` slot becomes **one** choice whose candidate IDs are the recognized IDs that are not already primaries. That choice is worth the *best* matching weight among its candidates. If nothing new is recognized, the slot is dropped, just like `other` today.
3. **Base score (recognized text can only help).** The final base score is `max(base(explicit choices), base(explicit + text slot))`, so recognized `Lainnya` text never lowers a score. Counterexample to test: `["Fisika","Lainnya"]` + "geografi" on teknik_geologi must not drop below `["Fisika"]`. Formula: This is the v3.2 formula applied to choices: `coverage = Σ matchedWeight / (min(choices, tags) × 100) × 100`, plus `breadth = min(matchedChoices × 5, 15)`.
   - With no usable choices, the score is 35.
   - If usable choices exist but none match, the score is 18.
4. **Specificity bonus.** For each choice whose specificity ID is among the major's tags, add **+4**, capped at **+8**. Then clamp the total to 0–100.
- **Invariants (tested):**
  - Any legacy-label answer **without recognized `Lainnya` text** gets the **identical** subject score and overall score as v3.2, across every major, including the 4-tag majors `administrasi_bisnis`, `teknik_industri`, and `administrasi_publik`. Each legacy option is a single choice with one ID, and new tags are only appended.
  - Choosing a specific option never lowers a major's subject score compared with its base option. For example, Matematika Tingkat Lanjut ≥ Matematika for every major.
  - Unmatched or stale `Lainnya` text never changes the score.
- `scoreWeightedTags` stays unchanged for every other component.
- `normalized.favoriteSubjectIds` stays the unique union of all IDs, and is used for display and evidence. The new field is `normalized.favoriteSubjectChoices`.

**KB additions.** New IDs are **appended** to the end of `subjectIds`; existing order and weights don't change.
- `geography`: teknik_geologi, teknik_geomatika_gis, perencanaan_wilayah_kota, teknik_pertambangan, teknik_pertambangan_terapan, ilmu_lingkungan, teknik_lingkungan, kehutanan, perikanan, agroteknologi, pariwisata, travel_management
- `civics`: hukum, ilmu_politik, administrasi_publik, hubungan_internasional, kriminologi, pendidikan_guru_sekolah_dasar
- `religion`: bimbingan_konseling, ilmu_kesejahteraan_sosial, pendidikan_anak_usia_dini, pendidikan_guru_sekolah_dasar
- `anthropology`: sosiologi, pariwisata, hubungan_internasional, kriminologi, ilmu_kesejahteraan_sosial, komunikasi
- `performing_arts`: film_televisi, broadcasting, event_management, animasi, pendidikan_anak_usia_dini
- `advanced_mathematics` (specificity only): matematika_terapan, statistika, aktuaria, data_science, pendidikan_matematika, teknik_industri, informatika, artificial_intelligence
- `foreign_language` (specificity only): sastra_inggris, sastra_jepang, sastra_mandarin, penerjemahan, linguistik, pendidikan_bahasa_inggris, hubungan_internasional, pariwisata, perhotelan

`validateKnowledgeBase` checks:
- every new ID exists in `subjects`;
- every option maps to known IDs.

### D3. Free-text subject regex
- Lives in `src/lib/assessment/subjectText.ts`.
- **Input normalization:** lowercase, strip diacritics, then split into word tokens.
- **Explicit reviewed variants only, with no fuzzy matching.** The variants come from the real texts:
  - geografi / geografis / geo;
  - ppkn / pkn / pancasila / kewarganegaraan;
  - agama / pai / pendidikan agama / fiqih / akidah;
  - antropologi;
  - musik / seni musik / tari / seni tari / teater;
  - bahasa inggris / english / b inggris;
  - jepang / mandarin / arab / jerman / korea / prancis (each maps to foreign_language + language);
  - informatika / tik / komputer / coding;
  - wirausaha / kewirausahaan / prakarya;
  - matematika tingkat lanjut / mtk lanjut / matematika lanjut;
  - akuntansi;
  - sejarah, sosiologi, ekonomi, fisika, kimia, biologi, matematika / mtk.
- Text is used **only if `Lainnya` is checked**.

### D4. Aspiration guarantee (fixes blockers 2 and 3)
- **Source.** Only `dreamProfession` triggers the guarantee. `futureVision` keeps affecting the existing soft boost only.
- **Matcher.** Lives in `src/lib/recommendation/aspirationAliases.ts`.
  - Text is normalized and tokenized on Unicode letters and digits.
  - Phrases are matched as token sequences, longest first, and never overlap.
  - A match is skipped if one of the 3 preceding tokens is a negation: `bukan`, `tidak`, `tdk`, `ga`, `gak`, `nggak`, `enggak`, `jangan`, `selain`, `kecuali`.
  - Context exclusions apply. For example, `hukum` followed by `newton`, `fisika`, `alam`, `kekekalan`, `ohm`, or `archimedes` is not a match.
  - No fuzzy matching.
- **Aliases.**
  - **(a) Catalog names.** Every major `name` and `alternativeNames` entry whose normalized form has 2 or more tokens, or a single token of 4 or more letters. Short canonical names such as `Gizi` are always allowed. The ambiguous list `IT`, `AI`, `SI`, `PR`, `HI`, `BK`, `MI`, `TLM`, `RPL`, `PWK`, `HRM`, `Teknik Terapan`, `Finance` is excluded unless it is re-added as a curated alias.
  - **(b) Curated profession aliases.** These are reviewed. Each maps to a *group* of target IDs, and the highest-scoring **eligible** target in the group is used:
    - arsitek → arsitektur
    - teknik komputer, tekkom, computer engineer → teknik_komputer
    - teknik informatika, programmer → informatika, teknologi_rekayasa_perangkat_lunak
    - software engineer → software_engineering, teknologi_rekayasa_perangkat_lunak
    - dokter, dokter umum, dokter spesialis, dokter bedah, dokter forensik → kedokteran
    - dokter gigi, drg → kedokteran_gigi
    - dokter hewan → kedokteran_hewan
    - psikolog → psikologi
    - apoteker → farmasi
    - akuntan → akuntansi, akuntansi_terapan
    - aktuaris → aktuaria
    - perawat → keperawatan
    - bidan → kebidanan
    - pengacara, lawyer, advokat, hakim, jaksa, notaris → hukum
    - kriminolog → kriminologi
    - ahli gizi → gizi
    - fisioterapis → fisioterapi
    - urban planner → perencanaan_wilayah_kota
    - koki, chef → tata_boga
    - mining engineer, tambang, pertambangan → teknik_pertambangan, teknik_pertambangan_terapan
    - civil engineer, civil engineering → teknik_sipil
    - electrical engineer, electrical engineering → teknik_elektro
    - mechanical engineer, mechanical engineering, teknik mesin → teknik_mesin, teknik_mesin_terapan
    - sains data → data_science
    - statistik → statistika
    - ilmu komunikasi → komunikasi
    - public relation(s) → public_relations
    - desain grafis → desain_komunikasi_visual
    - desain interior → arsitektur (the closest catalog major; the label says so)
    - teknisi pesawat → vokasi_teknik
  - **Deliberately soft only (no guarantee):** teknik, engineer, insinyur, guru, dosen, pengusaha, bisnis, kesehatan, data analyst, diplomat, desainer, pns, bps, polisi, tentara. These still get the existing +4/+6 boost.
- **Precedence.** A literal catalog name always wins over a curated group alias for the same phrase. For example, "teknik mesin" matches `teknik_mesin` when it is eligible; on a vocational pathway it falls back to the group (`teknik_mesin_terapan`). This is tested on the vocational and exploring pathways.
- **Clauses and negation.** Phrases never cross punctuation (`, ; . / ( )`). Conjunctions (`dan atau tapi tetapi namun serta`) end a negation scope but may sit inside a catalog phrase, such as "Perencanaan Wilayah dan Kota" or "Film dan Televisi", so `dokter, gigi` only matches kedokteran. Negation applies only within its own clause, so `bukan dokter, tapi arsitek` matches arsitektur only.
- **Selection.**
  1. Build the baseline pool with the unchanged `selectRecommendationPool`.
  2. Take explicit groups in order of first mention. For each group, pick its highest-scoring target from the already eligible, valid, sorted `ScoredMajor` list. Ineligible or absent targets do not use up a slot.
  3. Keep at most **3 unique protected major IDs**. The cap counts IDs, not phrases.
  4. Protected majors already in the pool keep their place in the pool, although the final sort may move their rank. A missing one replaces the lowest-ranked unprotected pick.
  5. The guarantee may override the ≥58 threshold and the breadth caps, but never pathway eligibility.
  6. Re-sort with `compareScoredMajors`, then assign ranks, then attach guidance.
- **Display.**
  - Protected results get `aspirationMatch: true`.
  - The card and the PDF show **"Disebut dalam cita-citamu"**, and the fit label and score are kept unchanged and honest.
  - If the field is absent (old reports), the badge is not shown.

### D5. Official-service note
- **Trigger.** `dreamProfession` mentions any of: tni, polri, polisi, tentara, militer, akmil, akpol, aal, aau, kowad, kowal, kowau, angkatan darat/laut/udara, kedinasan, stan, stis, ipdn, poltekip, poltekim, bmkg, stmkg.
- **Effect.** One **report-level** line is added in `generateRecommendations`. It is *not* added in `buildAnswerPatternNotes`, which feeds the per-card cautions:
  > "Cita-citamu menyebut jalur kedinasan atau TNI/Polri. Jalur ini punya seleksi sendiri di luar pilihan jurusan. Cek syarat terbaru di situs resmi penyelenggaranya."
- Scores are unchanged, and nothing else is claimed.

## File Structure
- **New:**
  - `src/lib/assessment/subjectText.ts`
  - `src/lib/assessment/subjectChoices.ts` (option → choice table and `buildSubjectChoices`)
  - `src/lib/recommendation/subjectScore.ts`
  - `src/lib/recommendation/aspirationAliases.ts`
- **Modified:**
  - `src/lib/assessment/options.ts`, `src/lib/validation.ts`, `src/lib/assessment/normalization.ts`
  - `src/lib/types.ts` (`favoriteSubjectChoices` and `RecommendationResult.aspirationMatch?`)
  - `data/subjects.ts`, `data/majors.ts`, `scripts/validateKnowledgeBase.ts`
  - `src/lib/recommendation/scoring.ts`
  - `src/components/results/RecommendationCard.tsx`, `src/lib/pdf/report.ts`
- **Tests:**
  - `tests/fixtures/v32-baseline.json` (synthetic and generated **before** any change)
  - `tests/subjectV33.test.ts`
  - `tests/aspirationGuarantee.test.ts`
  - `tests/scoringV33Scenarios.test.ts`
  - updated version assertions
  - `tests/browser/subjectOptions.spec.tsx`
  - badge specs in the existing result/PDF tests

## Tasks

### Task 0: Freeze the v3.2 baseline (before any code change)
- [ ] Write `tests/fixtures/v32-baseline.json` with a temporary script. It holds about 24 synthetic answers that use legacy labels, cover all pathways, and include empty/minimal and maximal answers. For each answer it records:
  - the ordered top-10 IDs;
  - `subjectScore` and `overallFitScore` for **every** eligible major.

  Remove the temporary script afterwards.

### Task A (commit 1): Subjects, normalization, subject scorer, KB, version bump
- [ ] **Red.** Write failing tests covering:
  - The option list and its order. Legacy labels validate, 4 choices are rejected, and an unknown label is rejected.
  - The `subjectIdsFromText` cases, including empty, "--" and "nggak tahu" → [].
  - Text is ignored unless `Lainnya` is checked.
  - `buildSubjectChoices` deduplication.
  - `scoreSubjectChoices`:
    - 35/18 fallbacks;
    - `Lainnya`-only recognized vs. unrecognized;
    - specificity bonus cap;
    - Matematika Tingkat Lanjut ≥ Matematika for every major;
    - multiple text matches count as one slot;
    - saturation at 100.
  - The baseline: every v32 fixture answer has an identical top 10 and identical per-major scores.
  - KB: the new IDs are appended, and the prefix of each major's `subjectIds` is unchanged.
- [ ] **Green.** Implement. Bump `SCORING_VERSION` and update the assertions in `tests/problemAreasV32.test.ts` and `tests/adminLabels.test.ts` where relevant.
- [ ] Run `npm run validate:kb`, `npm test`, and `npm run typecheck`. Then commit.

### Task B (commit 2): Aspiration guarantee, official-service note, display
- [ ] **Red.** All in synthetic tests.
  - Matcher tests:
    - longest match: `dokter gigi` matches only kedokteran_gigi;
    - `dokter umum atau dokter gigi` matches both;
    - `dokter, gigi` matches kedokteran only, because punctuation breaks the phrase (documented behaviour);
    - `drg.` matches kedokteran_gigi;
    - `bukan dokter` matches nothing;
    - `hukum Newton` matches nothing;
    - `sampai`/`ai`/`stan` substrings don't match;
    - `tekkom` matches teknik_komputer;
    - `Sistem Informasi`, `Teknik Geologi`, and `Pendidikan Matematika` catalog names match.
  - Selection tests:
    - a guarantee already in the pool keeps the pool unchanged;
    - a below-58 insertion evicts the exact lowest unprotected ID, and every retained pick keeps identical scores and breakdowns;
    - a breadth collision is allowed;
    - a cap of 3 by mention order;
    - an ineligible S1 match on vocational doesn't use a slot, and its group's applied target is used;
    - exactly 10 unique results, sorted, ranked 1..10.
  - Official-service tests:
    - "TNI AU" produces the note once at report level, not in the cards, and the top 10 is identical to an empty dream;
    - "akpol atau hukum" produces the note and guarantees hukum.
  - Display tests:
    - the badge appears in both card layouts and both PDF paths when the field is `true`;
    - an old fixture without the field shows no badge or note.
    - A mocked Gemini enhancement preserves `aspirationMatch`, IDs, ranks, degrees, and scores (`narrative.ts` merge, `geminiQueue` write-back).
- [ ] **Green.** Implement, then add the alias coverage checks to `validateKnowledgeBase`: every alias target exists, and every major has at least its catalog name.
- [ ] Run the unit tests, typecheck, and validate. Then commit.

### Task C (commit 3): Scenarios and UI
- [ ] `tests/scoringV33Scenarios.test.ts`, synthetic analogues of the 7 reports:
  - **Case A** ("Arsitektur dan Seni desain"): arsitektur is in the top 10 with the badge.
  - **Case B** ("penasaran dengan teknik komputer"): teknik_komputer is in the top 10.
  - **Case C** ("bps dengan jurusan statistika dan sains data"): statistika and data_science are in the top 10.
  - **Case D** (Lainnya "matematika tingkat lanjut"): pendidikan_matematika and statistika subject scores are higher than in v3.2.
  - **Case E** (Lainnya "geografi"): the teknik_geologi, teknik_geomatika_gis, and perencanaan_wilayah_kota subject scores rise from 18 to above 18.
  - **Case F** ("TNI AU"): the note appears, and the top 10 is unchanged.
  - **Case G:** the top 3 is unchanged.
- [ ] New personas:
  - Geografi + field work: a geo/environment major is in the top 5.
  - PPKn + debate/advocacy: hukum or ilmu_politik is in the top 5.
  - Seni Musik/Tari + public speaking: a media/performing major is in the top 10.
- [ ] `tests/browser/subjectOptions.spec.tsx` at 320px:
  - all 23 options are visible, and the longest label wraps without horizontal overflow;
  - targets are at least 44px;
  - keyboard selection works;
  - a 4th choice is blocked with a message;
  - `Lainnya` shows the text field, which clears on deselect.

  Update the existing journey specs if labels changed.
- [ ] Commit.

### Task D: Verification
- [ ] Full gate: `npm test`, browser tests, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run validate:kb`. Then `git checkout -- next-env.d.ts`.
- [ ] **Private aggregate replay.** This reads only the already-downloaded local private JSON, makes no Firestore calls, and writes no student-level output. Rescore in memory and print only:
  - the total count;
  - errors (must be 0);
  - reports with 10 results;
  - how many had their top 10 changed;
  - how many used guarantees;
  - how many got the note.


### Release (separate approval)
- Push the branch, open a draft PR, and smoke-test the preview (subject options and result page).
- Merge to `main` **only** with explicit user approval.

## Out of Scope
- Rescoring stored reports.
- ML or fuzzy classifiers.
- Draft persistence.
- Guidance Tasks 3/5/7.
- Case E's mining interest: the dream field was empty, so no guarantee applies.
