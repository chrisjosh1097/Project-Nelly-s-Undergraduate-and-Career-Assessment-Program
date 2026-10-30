# Admin Usability and Result Quality Follow-up Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the three scoped tasks below. Steps use checkbox (`- [ ]`) syntax for tracking. Only one implementer edits at a time; other agents may investigate read-only. The coordinator owns Git commits and the single final push.

**Goal:** Ship admin tables/search and materially better, reliable result explanations together in one push to the existing preview branch.

**Architecture:** Retain the current Next/Firebase/services and account/authorization protections. Admin pagination/search is server-side over projected summary data, with full reports fetched only when opened; result computation and presentation stay separate. New ranking/explanation behavior applies to new reports; stored reports are never silently rewritten or regenerated.

**Tech Stack:** Existing TypeScript, React, Next.js, Firestore Admin SDK, Vitest, and Playwright component tests. No new service, framework, database migration, or dependency is planned.

**Spec:** User's follow-up requests: admin table with 50 rows/pages, non-collapsible controls, general search; fix generic/blank results using their authorized record as reference; combine changes into one push and summon agents. Existing mobile remake spec remains binding for auth, branding, compatibility, and privacy.

## Global Constraints

- Stay on `feat/app-remake-pathway-flows`, starting at `f05b976`; no merge or push until all tasks and verification are complete.
- Exactly one final `git push origin feat/app-remake-pathway-flows`, authorized by the user. No force push, production deployment, or merge to main.
- Preserve admin authentication on every data/detail/export/reset endpoint. No bypass, default password, secrets output, or hardcoded credentials.
- No live database writes, deletion, queue draining, or regeneration. Use synthetic equivalent inputs, not the user's email/name/profile in committed tests or public fixtures.
- Keep orange/white/black identity and mobile usability. Table may scroll inside its own labeled region on phones; page itself must not overflow.
- No stored answers, scores, ranks, or narratives are mutated on page load. Legacy fields remain optional.
- New recommendations retain component weights, aspiration boost and eligibility; Gemini cannot change IDs, scores, ranks, or supported degrees.
- Each implementer owns only its brief's files, does not commit/push, does not spawn agents, and supplies red/green test evidence. Coordinator serializes edits and runs browser suites (one CT server/port).

## Review Focus

1. All-data search must not silently retain the 500-record cap, return only page-local matches, or export a different filter scope.
2. Small/large pages, search changes and deletions must not create empty out-of-range pages or expose stale report details after logout/unauthorized responses.
3. Gemini MAX_TOKENS, malformed JSON, missing fields, network failure and stale queue errors must not fabricate successful enrichment or hide usable heuristic reports.
4. A low-score flexible fallback must not outrank a higher-scoring eligible result or be described as strongly suitable without evidence.
5. Historical reports and mobile readers must benefit from presentation improvements without silently rescoring, revealing private data, or overstating overseas career eligibility.

## Shared design decisions

### Admin

- 50 rows per page, server-side page state with previous/next and page counts/range; filter/search apply resets to page 1.
- Always-visible filters, analytics heading, and reset-by-email tools; confirmation of destructive actions remains a dialog, not removed.
- General case-insensitive search across student name/email/school/class and top major/cluster. Apply with the explicit `Cari` / search submit action and Enter; combine with existing filters using AND. Clear restores unfiltered page 1.
- Search and pagination cover all existing submissions, including records older than the old latest-500 cap. No browser download of all full reports for a 50-row page.
- Use bounded Firestore batches with `.select(...)` projections to scan summary fields for substring search/filtering and matching analytics/counts. This is an intentional no-new-search-service tradeoff: reads grow with record count, but payload size and browser memory remain bounded. Document that a dedicated index is the next step for substantially larger datasets; never silently cap results.
- Return typed summary rows and matching analytics/count/page metadata. Fetch a protected full record only when opening report details. CSV uses the same search/filter semantics but exports all matches, not just the current page.
- Initial access/data checks have bounded fetch deadlines and honest retry states, with stale-response guards. Do not claim to have diagnosed the actual Netlify deployment's delay without its URL/logs.

### Ranking and explanations

- Existing real example showed a generic heuristic narrative after a recorded JSON parse error and a low-fit flexible fallback inserted above better-score alternatives. Use a synthetic non-identifying analogue to reproduce these behaviors.
- Preserve selection breadth/eligible candidates but deterministically sort the final selected ten by the existing score/resilience/job-flex/name order before assigning ranks. Do not change score weights to force a particular top major.
- Check Gemini response finish reasons and validate a strict structured JSON result. A truncated/malformed response must produce an actionable failure/retry, not pretend success. Bound any retry and total runtime; do not increase request cost unboundedly.
- Improve deterministic fallback personalization using the student's actual stated aspiration themes (overseas/Japan engineering and maritime/mining as synthetic test themes), rather than irrelevant stock social-issue copy. Do not promise visas, jobs, licenses or guaranteed outcomes, and do not make unsupported claims about admission or country requirements.
- Fit explanations distinguish moderate/weak matches; a weak fallback is an exploration alternative, not automatically 'cocok'.

### Results presentation

- More information-dense personal overview: direction, strengths supported by answers, where the top match fits, honest fit label, and concrete exploration actions.
- Render the saved narrative summary when meaningful, while preserving sensible legacy/heuristic fallbacks.
- Present score component evidence and concise comparison of stored recommendations. Improve orange accents, hierarchy, contextual icons and mobile spacing rather than adding decorative empty cards or invented metrics.
- Show aspiration and route context, technical/career caveats, and tailored next steps without unsupported overseas promises. Retain PDF/share actions, stored ordering and old-report compatibility.

## Task 1: Admin table, all-record search, pagination and bounded loading

**Files owned:** `src/components/admin/*`; `src/lib/submissions/{store,filters,csv}.ts`; new `src/lib/admin/submissions.ts` or similarly focused admin summary helpers; `src/app/api/admin/submissions/**`; `src/app/api/admin/export/route.ts`; `tests/admin*.test.ts`; `tests/browser/admin*.spec.tsx`; admin-specific assertions in `tests/browser/mobileRegression.spec.tsx` only. No global types, CSS, result or narrative edits.

**Interfaces:** Define/export `AdminSubmissionSummary`, `AdminSubmissionPage`, and summary analytics in the new admin helper, with `pageSize: 50`, `page`, `total`, `totalPages`, summary `submissions`, and matching analytics. Add optional `search` to `SubmissionFilters`. Keep existing `listSubmissions(filters)` signature for full exports, but remove the hard 500 cap by safe batched scanning. Add a protected GET `/api/admin/submissions/[id]` for full reports; URL-encode IDs and validate malformed/absent IDs.

- [ ] Inspect current admin/storage contracts and identify the actual initial-loading state transitions before changing them.
- [ ] Add failing tests: 121 matching rows yield pages 50/50/21; search/filter resets page; matches beyond old position 500 are found; all filters AND with general search; all-match CSV; page validation/clamping; auth before reads; failed/hanging requests exit spinner; stale load/detail cannot leak after logout.
- [ ] Run focused tests, observe the intended failures, implement typed summaries/projections/batched scan, paging/detail routes, and stable query/analytics state. Avoid casting incomplete summary objects to full Submission.
- [ ] Render one table on every viewport inside an accessible local horizontal-scroll region, 50 rows and pager. Keep all old report and reset actions accessible. Remove collapse containers from filters/analytics/reset tools. Include search field/button and explicit submit behavior.
- [ ] Run focused unit tests and typecheck. Write/update browser tests but do not run CT concurrently with another agent. Return files, exact test output, concerns, and a report at the assigned scratch path. No Git changes.

## Task 2: Reliable Gemini and honest, personalized deterministic results

**Files owned:** `src/lib/recommendation/{scoring,narrative,advice,aspirationIntent,geminiQueue}.ts`; new focused helpers in that directory; `tests/{scoring,pathwayScoring,pathwayAdvice,geminiQueue}.test.ts`; new recommendation/narrative tests. No global types, admin, results component, config or environment edits.

**Interfaces:** Preserve `generateRecommendations`, `enhanceRecommendationReport`, and stored report/narrative types. Use existing summary/strengths/reasons/personalization fields. If a type addition is unavoidable, report the exact proposed change to the coordinator rather than editing shared types.

- [ ] Diagnose flexible fallback placement, Gemini parser/finish-reason behavior, and generic aspiration fallback using source and synthetic reproductions. No live credentials or calls.
- [ ] Add failing tests: final ranks sorted by existing deterministic comparator even with sparse matches; top-degree eligibility maintained; weak matches use cautious copy; synthetic Japan/overseas technical maritime/mining ambitions produce relevant heuristic direction without generic social text or unsupported guarantees.
- [ ] Add malformed JSON, MAX_TOKENS, empty/missing fields, Gemini output trying to alter ranked data, and bounded-retry/failure tests. Inspect queue status/error semantics so completed work does not retain misleading old errors.
- [ ] Implement the minimal fixes with strict structured output validation and bounded network behavior, preserving heuristic fallback availability. Do not invent a blanket retry policy or regex-repair arbitrary model text into supposedly valid analysis.
- [ ] Run recommendation and full unit tests as practical, typecheck, and report exact red/green evidence. No environment changes, DB writes, queue drain, commits, pushes or browser server starts.

## Task 3: Richer mobile results with evidence and preserved history

**Files owned:** `src/components/results/{ResultsView,RecommendationCard}.tsx` and new focused result presentation helpers/components; `tests/browser/results.spec.tsx` (retain prior privacy/404/polling regressions); new results presentation tests. Do not edit ResultLoader/account isolation, global CSS, common fixtures, admin or backend narrative.

**Interfaces:** Consume existing `Submission`, `RecommendationResult` and optional `report.narrative`. Keep ResultsView props and compact-admin mode. Render stored values/ranks as-is. No fetching/regeneration for presentation.

- [ ] Inspect current layout and fields not being rendered. Propose a compact personal overview and evidence-driven comparison without changing scores or stored report ordering.
- [ ] Add failing tests for meaningful summary display, explicit moderate/weak fit, aspiration details, component-score evidence, next steps, legacy safe rendering and preserved downloads; authored examples must be synthetic, not a copied real record.
- [ ] Implement the agreed richer orange/white/black design with meaningful, concise sections and mobile-first comparison. Keep accessible keyboard/disclosure behavior, score limits and uncertainty. Avoid generic praise, irrelevant social copy and overseas eligibility promises.
- [ ] Run unit/type checks; leave browser suite execution to the coordinator unless explicitly scheduled. Report owned files, tests, and visual tradeoffs. No commits/pushes or edits outside ownership.

## Integration, review and one push (coordinator)

- [ ] Verify each implementation against its task, read reports, inspect diffs, run existing and new browser tests serially, and resolve material gaps with the owning agent. Keep the existing 54-browser/77-unit baseline as regression coverage, adjusting only expectations intentionally changed by this request.
- [ ] Run KB validation, lint, typecheck, full unit suite, full browser suite, and production build. Inspect representative synthetic desktop/phone screenshots; do not call the live Gemini worker or rewrite the reference report.
- [ ] Obtain independent read-only review of the combined changes. Address critical/important findings with red/green regressions and rerun affected/full checks.
- [ ] Update documentation with search scope/cost, output-validation behavior, historical report limitations, tested counts and any live-integration limits. Commit work in reviewable units, then push this branch exactly once. Do not merge or deploy production.
