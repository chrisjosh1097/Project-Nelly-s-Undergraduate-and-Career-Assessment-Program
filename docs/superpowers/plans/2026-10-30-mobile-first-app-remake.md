# Mobile-First App Remake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every Project Nelly surface in the approved orange/white/black mobile-first design, with lightly tailored assessments and degree-compatible recommendations.

**Architecture:** Keep existing Next.js routes, Firebase identity/storage, deterministic scoring, narrative queue, and server reporting. Add an optional education-pathway field with legacy-safe reads, constrain candidate selection before scoring/fallbacks, and rebuild UI composition around shared accessible primitives. Separate pure assessment, filtering, and export helpers from network/UI code for focused tests.

**Tech Stack:** Existing Next.js 16, React 18, TypeScript, Tailwind 3, Zod, Firebase/Admin SDK, pdf-lib, Vitest; add Playwright React component testing for real-browser mobile coverage, not a new production UI framework.

**Spec:** `docs/superpowers/specs/2026-10-30-mobile-first-app-remake-design.md` (approved by user: “go”).

## Global Constraints

- Branch: `feat/app-remake-pathway-flows`; preserve the committed aspiration-intent scoring work.
- Keep actual logo; brand orange approximately `#ff3c00`, near-black `#191817`, white, warm off-white backgrounds, pale peach selection surfaces, and muted warm-gray borders/text.
- Touch targets at least 44 by 44 CSS px, preferably 48 px for primary actions; 16 px input text.
- Check 360/390 px phone widths, 320 px stress case, tablet, and desktop; no page-level horizontal overflow.
- Exactly ten unique, deterministic recommendations relevant to the selected education pathway.
- Keep existing six component weights, aspiration-intent boost, AI-resilience calculation, and deterministic tie breaks.
- No Firestore bulk migration, automatic historical rescoring, production deployment, secrets edits, or real student data resets.
- No new cross-device draft backend or persistent browser storage of student profiles in this release.
- PTN/PTS status is not a degree level; preserve institution/location choices in both flows.
- Optional Gemini narration must not change candidate IDs, ranks, scores, or pathway eligibility.
- Keep existing routes, one-verified-email transaction semantics, admin authorization, and all current reporting/admin features.
- Do not commit `.superpowers/` session keys, server-info, or event logs.

## Review Focus

1. Missing legacy pathway/degree/narrative fields must display safely without relabeling history as an explicit preference (Tasks 1, 7, 8, 9).
2. Sparse low-fit vocational matches and global S1 fallbacks must never leak ineligible records into the ten results (Task 2).
3. Changing pathways after answering, review/edit jumps, and rapid repeated submission must preserve answers and prevent duplicate requests (Tasks 5, 6).
4. A missing submission or Gemini failed/skipped/pending state must not leave students in an endless loading screen or hide usable heuristic results (Task 7).
5. Long names, narrow widths, large text, and open filters/confirmations must not hide controls or private detail actions (Tasks 4, 6, 9, 10).

---

## File structure and ownership

Existing files remain the integration points. Create small supporting modules rather than replacing all services:

- `src/lib/assessment/pathways.ts`: pathway definitions, labels, choice copy, and supported-degree helpers.
- `src/lib/assessment/steps.ts`: typed step/section configuration and contextual presentation.
- `src/lib/assessment/formState.ts`: empty answers, step validation, progress, and review warnings.
- `src/lib/recommendation/eligibility.ts`: candidate filtering and degree display metadata; no UI dependencies.
- `src/components/layout/AppShell.tsx`: route-aware public/admin/assessment layout and real navigation.
- `src/components/ui/Panel.tsx`, `StatusMessage.tsx`, `ConfirmDialog.tsx`: shared panels, status, and accessible destructive/submission confirmation.
- `src/components/assessment/AssessmentReview.tsx`: grouped answer summary and edit callbacks.
- `src/components/results/RecommendationCard.tsx`: detailed/disclosed recommendation rendering.
- `src/lib/submissions/filters.ts`: shared filter/query parsing and pure record matching.
- `src/lib/submissions/csv.ts`: CSV schema and serialization used by the protected export route.
- `src/components/admin/SubmissionList.tsx`, `AdminFilters.tsx`: responsive records and filters; keep orchestration in `AdminDashboard.tsx`.
- `playwright-ct.config.ts`, `playwright/index.html`, `playwright/index.tsx`, `tests/browser/*`: test-only real-browser environment and scenarios. No development auth bypass in production routes.

Existing `StudentAnswer`, `NormalizedStudentAnswer`, `RecommendationResult`, and `Submission` remain canonical types in `src/lib/types.ts`. Knowledge-base `Major` is the type exported from `data`, not the separate older UI `Major` interface.

## Task 1: Add the legacy-safe pathway contract

**Files:** Modify `src/lib/types.ts`, `src/lib/validation.ts`, `src/lib/assessment/normalization.ts`; create `src/lib/assessment/pathways.ts`; extend `tests/validation.test.ts`, `tests/profileMapping.test.ts`; create `tests/pathways.test.ts`.

**Interfaces:** Export `EducationPathway = "university" | "vocational" | "exploring"` from types. Add `educationPathway?: EducationPathway` to both answer interfaces. Export `educationPathwayOptions` with value/title/description entries, `educationPathwayLabel(pathway?: EducationPathway): string`, and `eligibleDegreeTypes(degrees: readonly string[], pathway?: EducationPathway): string[]` from pathways. Missing labels return `Belum tercatat`; exploring is a distinct explicit label. New result metadata is `degreeTypes?: string[]` on `RecommendationResult`, storing only route-compatible types for explicit pathways.

- [ ] Write failing tests: schema accepts all three values and absent field; rejects `"SMA"`, null, and empty string; normalization preserves supplied value but does not infer from SMK or Diploma/vokasi checkboxes. `eligibleDegreeTypes(["S1","D3","D4","Sertifikasi"], "vocational")` equals `["D3","D4"]`; university equals `["S1"]`; missing/exploring retains the supplied supported types.
- [ ] Run `npm test -- tests/validation.test.ts tests/profileMapping.test.ts tests/pathways.test.ts`; confirm failures concern the missing contract.
- [ ] Implement the optional Zod enum without a default. Conditionally spread absent optional fields rather than writing `undefined` into persisted objects (Firestore rejects undefined). Keep all existing schema constraints and normalization tags.
- [ ] Run those tests and `npm run typecheck`; all pass, including unchanged historical fixtures.
- [ ] Commit explicit changed files: `feat: add legacy-safe education pathway model`.

## Task 2: Constrain scoring and every fallback by degree eligibility

**Files:** Create `src/lib/recommendation/eligibility.ts`, `tests/pathwayScoring.test.ts`; modify `src/lib/recommendation/scoring.ts`, `scripts/validateKnowledgeBase.ts`, `tests/knowledgeBase.test.ts`; audit `data/majors.ts` without inventing qualifications.

**Interfaces:** `isMajorEligible(major: Pick<KnowledgeMajor,"degreeTypes">, pathway?: EducationPathway): boolean`; `eligibleMajors(majors: readonly KnowledgeMajor[], pathway?: EducationPathway): KnowledgeMajor[]`. University requires S1; vocational D3 or D4; missing/exploring unrestricted. Reuse Task 1 degree helper. `generateRecommendations(answer: StudentAnswer): RecommendationReport` signature is unchanged. Set scoring version `knowledge-base-heuristic-v3.0.0`.

- [ ] Write failing tests for ten unique recommendations for each pathway; every returned ID belongs to the eligible set; repeated runs have identical ID/rank/score arrays (ignore generatedAt); mixed S1/D4 record is eligible for either; certification-only and Vokasi-only records are excluded from explicit paths. Pin unchanged score breakdown weights and aspiration boost using existing tests.
- [ ] Add a sparse/low-fit fixture that reaches fallback selection; assert vocational results still exclude S1-only records. Add validator coverage showing fewer than ten route-compatible records produces a meaningful issue/error. Assert missing and exploring inputs return the same ID/score sequence for identical answers.
- [ ] Run `npm test -- tests/pathwayScoring.test.ts tests/knowledgeBase.test.ts tests/scoring.test.ts`; confirm intended failures.
- [ ] Filter candidates before scoring; route every fallback through the eligible scored pool. Preserve existing breadth logic and tie breaks. For unrestricted inputs retain existing fallback preferences where eligible; never look up and append an unfiltered global record. Store compatible `degreeTypes` on new result records. Throw a clear error for a broken fewer-than-ten invariant.
- [ ] Run those tests plus `npm run validate:kb` and `npm run typecheck`; record audited eligibility counts for both explicit paths. Do not relabel degree metadata merely to satisfy counts.
- [ ] Commit: `feat: produce degree-compatible pathway recommendations`.

## Task 3: Make heuristic and optional AI advice pathway-aware

**Files:** Modify `src/lib/recommendation/advice.ts`, `src/lib/recommendation/narrative.ts`; create `tests/pathwayAdvice.test.ts`; extend `tests/geminiQueue.test.ts` where needed.

**Interfaces:** Preserve `generatePtnPtsVokasiAdvice(answer: StudentAnswer): string[]`, `buildHeuristicNarrativeReport`, and `applyNarrativeToReport` existing signatures. Pass explicit pathway and stored result degree types in the Gemini prompt; keep its builder private.

- [ ] Write failing tests for S1-focused university advice, D3/D4-focused vocational advice, balanced exploring advice, missing-pathway compatibility, location constraints, and certification-as-supplement wording. A university answer with the old Diploma/vokasi checkbox must not receive contradictory advice telling it to pursue vocational instead.
- [ ] Mock the Gemini fetch response through the public enhancer; capture the request to assert pathway is included. Apply a deliberately extraneous narrative payload and assert IDs/ranks/scores/degree metadata remain unchanged; failed generation keeps heuristic content usable.
- [ ] Run `npm test -- tests/pathwayAdvice.test.ts tests/geminiQueue.test.ts`; confirm intended failures.
- [ ] Implement contextual lead advice and pathway-aware fallback career guidance while retaining existing constraint reasoning, sanitization, and licensing cautions. Suppress contradictory older-checkbox guidance when the explicit path takes precedence.
- [ ] Run focused tests and full `npm test`; all pass.
- [ ] Commit: `feat: tailor recommendation advice to education direction`.

## Task 4: Build the branded shell and real-browser test foundation

**Files:** Modify `package.json`, `package-lock.json`, `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/{Button,Input,Badge}.tsx`, `src/components/auth/Header.tsx`, `src/components/layout/SiteFooter.tsx`; create AppShell and shared UI files listed above; create Playwright files and `tests/browser/{brand.spec.tsx,mocks/auth.tsx,mocks/navigation.ts,mocks/link.tsx,mocks/image.tsx,fixtures.ts}`.

**Interfaces:** `AppShell({children}: {children: ReactNode})`; `Panel` forwards standard div props; `StatusMessage({tone,children}: {tone:"info"|"error"|"success";children:ReactNode})`; `ConfirmDialog({open,title,children,confirmLabel,busy,onConfirm,onClose})` with typed callbacks returning void or Promise<void>. Preserve existing UI prop/variant APIs for gradual migration. Define `test:browser` as `playwright test -c playwright-ct.config.ts`.

- [ ] Add only dev dependency `@playwright/experimental-ct-react` compatible with React 18; configure Chromium, CT HTML entry, Tailwind/PostCSS styles, and aliases `@`/test-only auth/navigation/link/image mocks. Test fixtures are synthetic serializable data, not imports of Firestore/Node fixture builders. Browser-only fixture auth/navigation state is reset per test. No auth flags/routes enter production code.
- [ ] Write failing browser tests for actual logo alt/aspect ratio, 44 px controls, selected navigation aria state, no student admin bottom tab, no duplicate bottom bars on assessment, and visible keyboard focus. Confirm dialog traps focus, Escape closes, close restores focus, busy prevents duplicate confirmation.
- [ ] Run `npm run test:browser -- tests/browser/brand.spec.tsx`; install Chromium with `npx playwright install chromium` if needed; confirm intentional assertion failures after harness mounts successfully.
- [ ] Implement semantic palette tokens and branded primitives; measure contrast (4.5:1 normal text, 3:1 large text and essential UI boundaries). Keep optional existing tone names API-compatible while mapping to restrained brand/support colors. Make shell route-aware with real links, safe-area padding, mobile student navigation, compact assessment navigation, and separate admin context. Use native dialog where supported with controlled focus/close lifecycle.
- [ ] Run browser tests at 360/390/1280 px and `npm run typecheck`; all pass. Confirm 16 px input text and no reliance on external font requests.
- [ ] Commit: `feat: establish mobile-first Nelly design system and app shell`.

## Task 5: Model the contextual wizard and review behavior

**Files:** Create `src/lib/assessment/steps.ts`, `src/lib/assessment/formState.ts`, `tests/assessmentFlow.test.ts`; consume existing `options.ts`, `validation.ts`.

**Interfaces:** Export `AssessmentSection = "profile"|"direction"|"interests"|"considerations"|"review"`; `AssessmentStep` discriminated union for existing field input types plus pathway/profile/review; `getAssessmentSteps(pathway?: EducationPathway): AssessmentStep[]`; `emptyAnswer(email?: string): StudentAnswer`; `validateAssessmentStep(step: AssessmentStep, answer: StudentAnswer): string | null`; `assessmentProgress(index: number,total: number): number`; `assessmentReviewWarnings(answer: StudentAnswer): string[]`. Canonical option values stay unchanged; contextual labels/help may differ.

- [ ] Write failing tests: direction immediately follows school major; five sections end in review; every old field remains present; both paths expose the same canonical answer choices and three-selection limits; different contextual guidance does not alter normalization.
- [ ] Assert empty answer has no preselected pathway; all required steps report useful Indonesian errors; other companion text constraints are retained; optional aspiration minima still apply. Progress before completion is below 100. University plus old Diploma checkbox produces a nonblocking warning rather than mutating answers.
- [ ] Run `npm test -- tests/assessmentFlow.test.ts`; confirm failures.
- [ ] Implement declarative configuration and pure helpers. Use the existing Zod contract for field constraints where practical, not a divergent second rulebook. Keep neutral unselected initial pathway, existing answer defaults otherwise, and review progress capped below completion.
- [ ] Run focused tests, validation/profile tests, and typecheck; all pass.
- [ ] Commit: `feat: model pathway-aware assessment steps and review`.

## Task 6: Rebuild landing, sign-in, and the complete assessment journey

**Files:** Modify `src/app/page.tsx`, `src/app/login/page.tsx`, `src/components/auth/LoginPanel.tsx`, `src/app/assessment/page.tsx`, `src/components/assessment/AssessmentForm.tsx`, `src/app/api/submissions/route.ts`; create `src/components/assessment/AssessmentReview.tsx`, `tests/browser/studentJourney.spec.tsx`; create `tests/submissionRoute.test.ts`.

**Interfaces:** Consume Task 5 helpers; `AssessmentReview({answer,onEdit}: {answer:StudentAnswer;onEdit:(key:keyof StudentAnswer)=>void})`. Preserve AuthProvider and all API contracts. Submit includes optional model field only after the new UI has validated explicit selection.

- [ ] Write failing browser tests with test-only auth plus routed mocked APIs: choose pathway after school; required error announced; fourth activity rejected; change pathway after answering and backtrack without loss; review edit links return to correct question and then review; confirmation explains one submission; rapid clicks send one POST; failed POST preserves answers and retry works; `created:false` navigates already-submitted; unconfigured login offers honest feedback. Mock completed status routes to prevent entering a new assessment.
- [ ] Add route tests mocking server auth/store: email mismatch returns 403 without creating; valid path is persisted; invalid path returns 400 before storage; old absent-path payload remains accepted. Translate schema validation failures into the existing `ApiError` (400), rather than exposing a generic 500 from `jsonError`. Keep transactional duplicate behavior unchanged and run existing duplicate tests.
- [ ] Run `npm run test:browser -- tests/browser/studentJourney.spec.tsx` and `npm test -- tests/submissionRoute.test.ts tests/duplicate.test.ts`; confirm intended failures (some preserved-contract tests may already pass).
- [ ] Implement landing/sign-in matching the approved visual intent, labeled illustrative result only, no invented metrics. Replace monolithic step rendering orchestration with Task 5 configuration, accessible choice controls, focus-to-heading/error behavior, preserved in-memory answers, review/edit return state, sticky reachable actions, and shared confirmation. Maintain getToken/verified email/status checks. Use a synchronous submit guard as well as disabled busy controls.
- [ ] Run focused tests at 360/390 px; verify long options and virtual-keyboard-sensitive layout manually. Run typecheck and full unit suite.
- [ ] Commit: `feat: rebuild student onboarding and mobile assessment journey`.

## Task 7: Rebuild results and fix unusable loading/narrative states

**Files:** Modify `src/components/results/{ResultsView,ResultLoader}.tsx`, `src/app/result/page.tsx`, `src/app/already-submitted/page.tsx`; create `RecommendationCard.tsx`, `tests/browser/results.spec.tsx`.

**Interfaces:** Preserve `ResultsView({submission}: {submission:Submission})` and `ResultLoader({alreadySubmitted?:boolean})`; `RecommendationCard({recommendation,expanded?}: {recommendation:RecommendationResult;expanded?:boolean})`. Preserve current PDF and share-image actions (inspect the entire existing ResultsView before editing).

- [ ] Write failing browser tests for top match plus nine disclosures, separate score labels, degree badges only when recorded, missing legacy pathway label, next steps/cautions/aspiration details, existing share/download actions, keyboard disclosure operation, and already-submitted explanation.
- [ ] Route `/api/submissions/me` to `submission:null`: expect an actionable no-result state, not infinite loading. For pending/processing/failed/skipped narrative, expect heuristic results immediately; pending/processing polls, failed/skipped does not. Test retryable fetch failure and cancel polling after unmount. Mock real timers/routes with bounded waits; no live Gemini requests.
- [ ] Run `npm run test:browser -- tests/browser/results.spec.tsx`; confirm failures, specifically the existing ResultLoader hiding heuristic reports and null loading forever.
- [ ] Implement branded cards/disclosures and explicit loading-vs-no-record state. Render available report regardless of narrative readiness with a concise status banner. Retain personalization fields, advice, strengths/gaps, cautions, score limits, PDF auth, share action, and safe fallback for old fields. Never regenerate a stored report on page load.
- [ ] Run browser tests and existing display tests, then typecheck.
- [ ] Commit: `feat: rebuild results with accessible details and resilient narrative states`.

## Task 8: Align PDF branding and preserve old/new report output

**Files:** Modify `src/lib/pdf/report.ts`, `tests/pdf.test.ts`.

**Interfaces:** Preserve `generateSubmissionPdf(submission:Submission):Promise<Uint8Array>` and `buildSubmissionPdfTextSnapshot(submission:Submission):string`.

- [ ] Write failing assertions that vocational output contains pathway and D3/D4 labels, explicit university output contains S1, legacy output does not invent a path, all ten recommendation names remain present, and long descriptions still generate a valid non-empty PDF. Retain existing disclaimer and career/strength content assertions.
- [ ] Run `npm test -- tests/pdf.test.ts`; confirm intended failures.
- [ ] Implement orange/black/white print styling and context lines using stored metadata only. Keep current logo loading and graceful handling if an asset is unavailable. Check page breaks/repeated table headings so long content does not run off a page.
- [ ] Run PDF tests; generate synthetic old/new PDFs to ignored `exports/` and visually inspect first/last pages and long-content page breaks. No real student information in fixtures.
- [ ] Commit: `feat: refresh branded PDF reports with pathway context`.

## Task 9: Add pathway-aware admin data and export without breaking old fields

**Files:** Create `src/lib/submissions/{filters,csv}.ts`, `tests/adminData.test.ts`, `tests/adminRoutes.test.ts`; modify `src/lib/submissions/store.ts`, `src/app/api/admin/{submissions,export}/route.ts`.

**Interfaces:** Move/re-export `SubmissionFilters` with existing fields plus `educationPathway?: EducationPathway|"unrecorded"`; `parseSubmissionFilters(params:URLSearchParams):SubmissionFilters` validates provided pathway; `matchesSubmissionFilters(submission:Submission,filters:SubmissionFilters):boolean`; `serializeSubmissionsCsv(submissions:readonly Submission[]):string`. Keep `listSubmissions(filters?:SubmissionFilters):Promise<Submission[]>` and 500-record limit.

- [ ] Write failing tests for each existing filter, each explicit pathway, missing-as-unrecorded, exploring distinct from missing, invalid pathway query rejection with `ApiError` (400), same filters passed by list/export routes, 401 before data access, and historical submissions safely included in exports.
- [ ] Pin current CSV header names/order and escaping (commas, quotes, newlines); append `educationPathway` and `topDegreeTypes` columns at the end, blank for absent data, preserving original columns and top-ten JSON. Use the existing csvEscape behavior; do not silently redefine old exported values.
- [ ] Run `npm test -- tests/adminData.test.ts tests/adminRoutes.test.ts`; confirm failures.
- [ ] Implement pure matching/parsing/CSV extraction and reuse in protected route handlers; preserve verifyManualAdminRequest as the first operation and existing response/error conventions. No new broad listing API or auth bypass.
- [ ] Run focused tests, duplicate tests, typecheck; all pass.
- [ ] Commit: `feat: support pathway admin filtering and compatible CSV exports`.

## Task 10: Rebuild the entire admin experience for desktop and phones

**Files:** Modify `src/components/admin/AdminDashboard.tsx`, `src/app/admin/page.tsx`; create `src/components/admin/{SubmissionList,AdminFilters}.tsx`, `tests/browser/admin.spec.tsx`.

**Interfaces:** `SubmissionList({submissions,onSelect}: {submissions:Submission[];onSelect:(submission:Submission)=>void})`; `AdminFilters({filters,onChange}: {filters:SubmissionFilters;onChange:(filters:SubmissionFilters)=>void})`. Consume Task 9 query/filter types. Keep manual login/logout and reset API contracts; include reset confirmation using Task 4 dialog.

- [ ] Write failing browser tests: unauthenticated admin login; authorized data fetch; desktop rows/mobile labeled cards carry equivalent report actions; all existing analytics retained; displayed pathway counts sum over loaded records and include unrecorded separately; existing and new filters affect query/export; detail view can close with focus restored; empty/error/retry states; logout clears private UI.
- [ ] Mock reset requests: require confirmation, disable during submission, show success/error, refresh safely; assert cancel sends no destructive request. Test long names at 320 px with open filters and report detail without page overflow or inaccessible close controls.
- [ ] Run `npm run test:browser -- tests/browser/admin.spec.tsx`; confirm intended failures.
- [ ] Implement responsive admin shell, collapsible filters, labeled phone cards, desktop table, existing charts and demographics/constraints analytics, and full-width mobile report view. Label totals as up to 500 loaded/filter-matching records. Do not replace live data with preview statistics. Keep student data out of public navigation.
- [ ] Run focused browser tests at 320/390/1280 px; route tests and typecheck pass.
- [ ] Commit: `feat: remake counselor dashboard for mobile and desktop`.

## Task 11: Cross-route verification, reference notes, and branch review

**Files:** Create `tests/browser/mobileRegression.spec.tsx`, `docs/reference-patterns.md`; modify `README.md`; fix only relevant issues found in implementation files.

**Interfaces:** No new product contracts. Use the existing `test:browser` script and mocks; document exact commands and honest mocked-vs-live boundaries.

- [ ] Add regression assertions across landing/login/assessment/results/admin at 320/360/390/768/1280 px: `document.documentElement.scrollWidth <= window.innerWidth`, no hidden focused action, real logo loaded, at least 44 px primary tap targets, 16 px text inputs, long content wraps. Test reduced motion and larger text; add keyboard-driven confirmation/disclosure flows. Place failing regressions before each corresponding fix.
- [ ] Run `npm run validate:kb`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:browser`, and `npm run build`; capture exit codes and report actual test counts. Lint currently duplicates tsc. Run browser checks against production-style CSS as configured, not the HTML mockup.
- [ ] Perform manual phone-width and keyboard/zoom checks, inspect old/new PDFs, and document any external-service smoke checks not run. Do not claim real Google/Firebase/Gemini works solely from mocked tests. Do not use production student accounts or reset data without explicit permission.
- [ ] Document the three reference repos, exact pattern adopted, no wholesale source reuse, new optional fields, scoring version, missing-vs-exploring behavior, local tests, and the no-persistent-draft limitation. Record browser prerequisites and contrast checks.
- [ ] Review the full branch diff against every spec section, especially existing share image, duplicate auth, CSV fields, narrative queue fallback, all admin analytics, and route links. Obtain whole-branch independent review using the chosen execution workflow; resolve material findings and rerun affected checks.
- [ ] Commit: `test: verify mobile remake and document pathway behavior`. Report remaining limitations and branch status; do not merge, push, or deploy unless asked.

## Dependency and execution order

Tasks 1 → 2 → 3 define the data/report contract; Task 4 establishes UI/test infrastructure; Task 5 → 6 builds the assessment; Task 7 → 8 completes student reporting; Task 9 → 10 completes admin; Task 11 verifies the whole branch. Tasks 4/5 and 8/9 are candidates for independent delegation, but file ownership and contract commits must be stable before parallel work starts.

At execution start, read the approved spec, this plan, and the workspace-isolation skill. The user explicitly selected the existing dedicated branch; keep that branch and working directory unless isolation is needed or they request another workspace. Establish a fresh baseline before implementation, retain red/green evidence per task, and update checkboxes as work completes.

## Self-review notes

Spec coverage maps to all eleven tasks: brand/shell (4), every existing route (6/7/10), canonical questionnaire + routing + review (1/5/6), eligibility/scoring/fallbacks (2), narration (3/7), historical compatibility (1/7/8/9), PDF/CSV (8/9), admin features (9/10), and mobile/accessibility/integration boundaries (4/11). Review Focus inputs each have explicit owner tests above. New signatures and optional fields are defined before consumption. The implementation adds no production auth test seam or database migration.
