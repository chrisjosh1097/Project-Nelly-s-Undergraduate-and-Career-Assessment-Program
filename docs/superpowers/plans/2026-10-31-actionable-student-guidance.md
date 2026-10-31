# Actionable Student Guidance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (or executing-plans) to implement task by task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make new reports concrete and understandable for high-school students: specific evidence, measurable skill targets, a 4-week try-out plan, honest aspiration routes, plain-language terms, non-repetitive AI notes, and clear labels for comparison alternatives.

**Architecture:** Add one deterministic, human-curated guidance layer used by the heuristic report, the Gemini prompt/sanitizer and the presentation (web + PDF). Scores and ranking remain owned by `scoring.ts`; the guidance layer only explains them. New fields are optional, so old saved reports render unchanged via fallbacks.

**Tech Stack:** Next.js, TypeScript, Vitest, Playwright CT, pdf-lib. No new dependencies.

**Basis:** A read-only review of one authorized saved report (vocational pathway; top result automation at 65 "Cukup Cocok"; aspirations to work in Japan, on ships or in mining). Problems found: a generic summary; one-word skill gaps ("Teknologi", "Ketelitian"); next steps without what/where/how-long/proof; generic "global industry" aspiration text; six near-duplicate AI caution lines; unexplained contradictions (people-facing choices vs skill score 29, "Belum tahu minat"); a 39-scored creative alternative ranked #3 with no explanation; unexplained jargon (PLC, K3, HVAC, D3/D4). No identifying data from that record may appear in code, tests, fixtures, docs or commits.

---

## Global constraints

- **No silent historical change.** Never rescore, reorder or regenerate saved submissions. New fields are optional; old reports keep displaying their stored text.
- **Scoring is untouched** except Task 6, which only *investigates* and may propose a separately approved change. Do not change weights, thresholds or comparators within Tasks 1–5.
- **Gemini** may rewrite wording only. It may not change IDs, scores, ranks, eligibility, or invent requirements (visa, licence, salary, admission). Validate output; on violation use the deterministic fallback.
- **Honesty:** fit ≠ admission chance; AI resilience ≠ job guarantee; overseas routes are "check the official source" steps, not promises. Do not name specific companies, prices or deadlines unless curated and dated.
- **Language:** Indonesian for students, short sentences (target ≤ 20 words), each action starts with a verb, and every jargon term is glossed on first use.
- **Privacy:** synthetic fixtures only.
- Work stays on `feat/app-remake-pathway-flows`; never merge to `main`. One product editor at a time; the coordinator owns commits, browser tests and push.

## Acceptance checklist (applies to every new report)

1. The summary cites at least two concrete answer signals (a subject, activity, skill or aspiration) and links them to the top result.
2. Every skill gap is phrased as an observable target: "Bisa …" plus how to prove it.
3. The top result has a 4-week plan: one action per week with a time box (e.g. "2–3 jam") and an expected proof (photo, note, simple project, conversation).
4. If the aspiration text matches a curated route (abroad/Japan, maritime, mining, …), show route steps plus "cek sumber resmi". If there's no match, use an honest generic line, not invented specifics.
5. AI notes: at most 2 lines, field-specific, no duplicates (normalized comparison).
6. Detected tensions get one plain explanation each: a selected skill that doesn't match the top result, "Belum tahu minat" / "Takut salah jurusan", work-style mismatch.
7. Any alternative placed above a higher-scored one, or scored below 50, gets a "Pilihan pembanding" label plus a one-line reason.
8. A glossary with only the terms that actually appear (max 6).
9. Old saved reports render without errors and without new sections claiming data they don't have.

---

## Task 1 — Curated guidance content (data only)

**Files:**
- Create: `data/studentGuidance.ts` (types + content)
- Create: `tests/studentGuidance.test.ts`
- Modify: `scripts/validateKnowledgeBase.ts` (validate the new data)

- [ ] **Step 1: Write failing validation tests.** These are data-shape tests: every entry has non-empty Indonesian text; skill targets start with "Bisa"; week actions have a `durationLabel` and `proof`; glossary terms are unique; and route IDs are referenced by at least one keyword rule.
- [ ] **Step 2: Add the types:**
  ```ts
  export interface SkillTarget { gap: string; target: string; proof: string } // gap matches the KB skillGaps label
  export interface WeekAction { week: 1|2|3|4; action: string; durationLabel: string; proof: string }
  export interface AspirationRoute { id: string; keywords: string[]; title: string; steps: string[]; verify: string }
  export interface GlossaryTerm { term: string; plain: string; aliases?: string[] }
  export interface FieldAiNote { cluster: string; note: string }
  ```
- [ ] **Step 3: Write the content.**
  - **Skill targets:** cover the most frequent `skillGaps` across `data/majors.ts`. Generate the frequency list with a one-off script, then cover at least the top 40, including generic ones like "Teknologi", "Problem solving", "Ketelitian", "Komunikasi" and "K3 dasar".
  - **Week plans:** one per subCluster (fallback: per cluster, then generic). Week 1 = learn the basics with a free tool; week 2 = a small project; week 3 = talk to or observe a real practitioner; week 4 = a written reflection ("apa yang aku suka/tidak suka").
  - **Aspiration routes:** abroad general, Japan, maritime/ship, mining, plus existing themes from `aspirationThemes.ts`. Steps must stay general and verifiable (e.g. "Cari program kerja resmi pemerintah", "Belajar bahasa Jepang sampai level dasar (JLPT N4) sebagai target awal", "Untuk kerja di kapal biasanya perlu pendidikan pelayaran/teknika dan sertifikat pelaut — cek lembaga resmi"). The `verify` line is mandatory.
  - **Glossary:** PLC, K3, HVAC, D3, D4, S1, instrumentasi, GIS, portofolio, magang, sertifikasi, CAD, etc.
  - **Field AI notes:** one per cluster.
- [ ] **Step 4:** Run `npx vitest run tests/studentGuidance.test.ts` and `npm run validate:kb`, then report.
- [ ] **Step 5:** Human content review by the coordinator/user before Task 2 depends on wording. Flag any factual claim about overseas or licensing routes for user confirmation.

## Task 2 — Deterministic guidance builder

**Files:**
- Create: `src/lib/recommendation/guidance.ts`
- Modify: `src/lib/types.ts` (optional fields)
- Create: `tests/guidance.test.ts`

- [ ] **Step 1: Add optional types.** `RecommendationResult.actionGuidance?` and `RecommendationReport.studentGuidance?`:
  ```ts
  interface ActionGuidance { skillTargets: SkillTarget[]; weekPlan: WeekAction[]; aiNote?: string; comparisonNote?: string }
  interface StudentGuidance { evidenceSummary: string; tensions: string[]; aspirationRoutes: {title:string;steps:string[];verify:string}[]; glossary: GlossaryTerm[] }
  ```
- [ ] **Step 2: Write failing tests with synthetic answers.**
  - The evidence summary names actual matched subjects/interests from `scoringBreakdown`.
  - A skill gap with no curated target falls back to the template `Bisa menunjukkan dasar ${gap} lewat satu contoh kecil` and is never left as the raw one-word label.
  - "Belum tahu minat" yields a tension line pointing to the week plan.
  - A people-facing work style or skills absent from `matchedSkills` yield a tension naming those skills plus a role idea from the KB `careerDirections`. No invented roles.
  - Maritime + mining + Japan text yields three routes, each with a `verify` line. Unrelated text yields none.
  - The comparison note appears exactly when rank order disagrees with score order, or the score is below 50.
  - The glossary includes only terms found in the final rendered strings.
  - Field AI notes have at most 2 lines with no near-duplicates.
  - The builder is pure: input is deep-frozen and the output is deterministic.
- [ ] **Step 3: Implement `buildStudentGuidance(answers, report)`**, pure and with no network access. Return a new object only.
- [ ] **Step 4: Remove the three generic AI lines.** Replace the ones appended in `buildCautionNotes` (`scoring.ts`) with the single field note for **new** reports.
  - Do this inside the guidance attachment step, not the scoring function, so scores are unaffected.
  - Keep `cautionNotes` shape. Assert with tests that `overallFitScore`, `rank` and `scoringBreakdown` are identical before and after.
- [ ] **Step 5: Wire it in.** Call the builder in `generateRecommendations` after ranking (attach only), and bump `HEURISTIC_NARRATIVE_VERSION`.
- [ ] **Step 6:** Run the full unit suite and typecheck, then report.

## Task 3 — Gemini prompt and sanitizer alignment

**Files:**
- Modify: `src/lib/recommendation/narrative.ts`
- Modify: `src/lib/recommendation/geminiResponse.ts` (only if the schema changes)
- Tests: existing narrative/Gemini tests

- [ ] **Step 1: Write failing tests** (mocked Gemini only):
  - A generic summary lacking any answer signal is rejected and the fallback is used.
  - `pathwayAdvice` items without a verb start, or longer than 15 words, are dropped or replaced by curated week actions.
  - Invented numbers or requirements (e.g. "gaji", "visa pasti", or digits for prices) in aspiration text cause the deterministic route text to be used.
  - IDs, scores and order are unchanged.
- [ ] **Step 2: Update the prompt.** Pass the curated guidance (skill targets, week plan titles, routes, tensions) as *facts to paraphrase*. Require the summary to mention ≥2 provided signals; forbid one-word skills; require verb-first actions; and forbid adding requirements not in the provided routes.
- [ ] **Step 3: Tighten the sanitizer** per Step 1. Keep the strict schema plus the `STOP` finish reason, and add no regex JSON repair.
- [ ] **Step 4:** Run the full suite and report. Live Gemini is not called.

## Task 4 — Presentation: web results and PDF

**Files:**
- Modify: `src/components/results/resultPresentation.ts`, `ResultsView.tsx`, `RecommendationCard.tsx`, `src/lib/pdf/report.ts`
- Tests: `tests/resultsPresentation.test.ts`, `tests/pdf.test.ts`, `tests/browser/results.spec.tsx`

- [ ] **Step 1: Write failing tests:**
  - When `studentGuidance` exists, show sections in this order: "Kenapa ini muncul" (evidence summary), "Coba dalam 4 minggu", "Target skill", "Jalur menuju cita-citamu", "Hal yang perlu kamu tahu" (tensions), "Istilah".
  - "Pilihan pembanding" badges and notes appear on the affected alternatives.
  - Old saved fixtures without these fields render the current layout with no empty headings.
  - PDF bounds and pagination tests still pass.
- [ ] **Step 2: Implement.** Keep the phone-first layout. Show the week plan as a checklist (no persistence required), keep the glossary collapsible on web and as a short list at the end of the PDF. Keep the existing palette rules.
- [ ] **Step 3:** Run unit tests; the coordinator runs browser tests and inspects one synthetic PDF and phone screenshot.

## Task 5 — Readability guard

**Files:**
- Create: `src/lib/recommendation/readability.ts`
- Create: `tests/readability.test.ts`

- [ ] **Step 1: Test first.** Flag sentences over 25 words, unglossed jargon from the glossary list, banned vague phrases ("sangat dibutuhkan di industri global", "terus belajar teknologi baru", one-word skill items), and duplicate lines.
- [ ] **Step 2:** Apply the guard to the builder output and the sanitized Gemini output (drop or replace with curated text). Add a test that runs it over the generated reports for all `data/scoringExamples.ts` sample profiles and requires zero flags.

## Task 6 — Investigation only: aspiration-relevant majors absent from the top 10

Mining and mechanical programs offer D4 (so they're vocational-eligible) and the mining keyword rule exists, yet a synthetic profile with "tambang / kapal / engineer di Jepang" can receive `aspirationMajorBoost: 0`.

- [ ] **Step 1:** Write a synthetic reproduction test that prints each candidate's score and boost. Determine why the aspiration boost is 0 (keyword normalization? the boost only applying to certain fields? eligibility?).
- [ ] **Step 2:** Write the findings to `.superpowers/sdd/<date>-actionable-guidance/task-6-investigation.md`, with options and impact on the sample profiles.
- [ ] **Step 3:** **Stop.** Any scoring change requires explicit user approval, a `SCORING_VERSION` bump, and applies to new reports only.

## Task 7 — Verification and handoff

- [ ] Run the full unit suite, browser tests, KB validation, lint/typecheck and build.
- [ ] Do a synthetic before/after comparison for 3 profiles (vocational technical, university social, exploring/unsure) and check every item of the acceptance checklist.
- [ ] Get an independent review (spec + quality), then fix any material findings.
- [ ] Update `README.md` and `docs/verification-mobile-remake.md` with the limits:
  - curated route content needs periodic human review
  - no live Gemini verification
- [ ] Commit; push to the preview branch only when the user requests it.

## Out of scope

- Regenerating existing saved reports. An optional future admin "regenerate as new version" flow needs a separate approval.
- Scoring changes (only investigated in Task 6).
- Live job-market data, prices, deadlines or company names.
