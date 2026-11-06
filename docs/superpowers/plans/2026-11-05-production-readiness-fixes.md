# Campus Filters and Aspiration Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Respect explicit campus preferences and remove unused aspiration-route columns before production release.

**Architecture:** Filter the existing catalog before sorting, deduplication and limiting. Keep recommendation scores and stored reports untouched. Render route columns according to the saved route count; explain active campus filters and empty results in the existing client component.

**Tech Stack:** Next.js 16, React 18, TypeScript, Tailwind, Vitest, Playwright CT.

**Spec:** Decisions and acceptance criteria in this plan, based on the five final simulations and user-approved repair-planning request.

## Global Constraints
- Work on `feat/app-remake-pathway-flows`; implementation must not write Firestore or rescore historical reports.
- No scoring, knowledge-base, PDF, authentication, or unrelated paused-guidance changes.
- Use only `data/campus/catalog.json`; preserve `CAMPUS_CACHE_HEADERS`, source attribution, PDDikti links and maritime note.
- Never display passing grades, score ranges or admission probabilities.
- Keep student-identifying artifacts ignored; tracked regression fixtures must be synthetic.
- Touch targets at least 44px; no nested summary buttons; no horizontal overflow at 320px.
- Production merge is conditional on clean final verification and no remaining material findings. Report findings before releasing if that condition fails.

## Review Focus
- Several selected campus categories mean a union, not an impossible intersection (Task 1).
- Missing province cannot prove Java/outside Java; exclude unknown locations when a regional category is active (Task 1).
- Unsupported preferences such as near home must not masquerade as enforced location filters (Tasks 1–2).
- An empty catalog result is not an API failure or proof no suitable institution exists (Task 2).
- Zero, one, two, three and more saved routes must remain readable without truncating historical content (Task 3).

## Agreed Behavior Proposed for Approval
- Recognized categories: `PTN di Jawa`, `PTN luar Jawa`, `PTS bagus di kota besar`.
- Selected recognized categories are OR-ed. No recognized selection retains the existing unrestricted behavior.
- PTN categories require `Negeri` and a known matching province. Java includes DKI Jakarta, Banten, Jawa Barat, Jawa Tengah, DI Yogyakarta and Jawa Timur.
- The PTS category can enforce only `Swasta/Lainnya`: the catalog cannot verify campus quality or big-city status. Explicitly disclose that limitation, rather than claiming the whole preference was verified.
- Existing supported degree restrictions stay mandatory. Never fill a short list with a different degree, region or institution category.
- Unsupported preferences do not exclude everything and are not shown as active filters. Explain that location near home requires manual search when that preference is selected; no new address collection.
- One route uses one desktop column; two use two; three or more use three, wrapping extra cards. Phone layout stays one column.

### Task 1: Strict category filtering in campus catalog
**Files:** `src/lib/campus/catalog.ts`, `tests/campusCatalog.test.ts`, `tests/campusRoutes.test.ts`.
**Interfaces:** Preserve `campusesForMajor(majorId, opts)` and its response shape. Define/export a small shared preference helper in `src/lib/campus/preferences.ts` for recognized category keys and UI labels; it must not import the catalog into client code.
- [ ] Add failing tests covering S1+PTN Java across every mapped major: every returned item is S1, Negeri and in Java; empty results are allowed.
- [ ] Add tests for vocational+PTN outside Java, two PTN categories together, PTN+PTS union, PTS only, unrecognized-only preferences, and missing province. Use a pure exported matcher `matchesCampusPreferences(item: {type: string; province?: string}, preferences: readonly string[]): boolean` for synthetic missing-province tests.
- [ ] Run `npx vitest run --config vitest.config.mjs tests/campusCatalog.test.ts tests/campusRoutes.test.ts`; confirm the new strict-filter tests fail before implementation.
- [ ] Implement the matcher in the shared helper; apply it before existing sorting, deduplication and limiting. Retain valid degree filtering, ordering and a maximum six examples by default. `total` counts only filtered distinct campuses.
- [ ] Re-run targeted tests; verify API passes preferences correctly and preserves cache headers. Commit only task files after review.

### Task 2: Visible filters and honest empty state
**Files:** `src/components/results/CampusExamples.tsx`, `src/lib/campus/preferences.ts`, `tests/browser/campusExamples.spec.tsx`.
**Interfaces:** Keep existing CampusExamples props and API response unchanged; use the shared category keys/labels from Task 1.
- [ ] Add failing browser tests for active `S1 · PTN di Jawa` labels, mixed-category labels, no fabricated filter on unspecified legacy degrees, zero matches, and API failure.
- [ ] Add tests that PTS preference does not claim verified quality/city and near-home preference gets a manual-search explanation.
- [ ] Run the targeted CT suite and observe intended failures.
- [ ] Show recognized degree/category constraints above the list, wrapping at 320px. PTS label: `Swasta/Lainnya`; caveat: `Kualitas kampus dan lokasi kota besar belum diverifikasi.` Near-home caveat: `Lokasi dekat rumah belum difilter. Cek lokasi kampus melalui pencarian.`
- [ ] Replace the zero-result null return with a visible heading, active filters, `Belum ada contoh kampus sesuai filter di katalog ini.`, and `Cari kampus lain` linking to `/kampus`. Keep source attribution and applicable maritime note. Do not imply suitable campuses do not exist.
- [ ] Preserve the existing API-error PDDikti fallback. No automatic filter widening or new network request on empty results.
- [ ] Run targeted browser tests at 320px and desktop; update the prior empty-result expectation intentionally. Commit after review.

### Task 3: Adaptive aspiration-route layout
**Files:** `src/components/results/StudentGuidancePanel.tsx`, `tests/browser/results.spec.tsx`.
**Interfaces:** Preserve `AspirationRoutesPanel({guidance})`; no guidance generation/data changes.
- [ ] Add failing desktop tests for 1, 2, 3 and 4 synthetic routes. One fills usable width; two share a row; three fill three columns; fourth wraps. All steps and verification notes remain present.
- [ ] Add tests for zero routes with glossary, zero routes without glossary, and 320px overflow. Preserve glossary accessibility.
- [ ] Run targeted tests; confirm the one-route and two-route width assertions fail.
- [ ] Choose explicit static Tailwind classes from route count: no desktop column class for one, `lg:grid-cols-2` for two, `lg:grid-cols-3` for three or more. Do not dynamically construct unscannable class names.
- [ ] Re-run tests, inspect one-route and three-route desktop views and phone views, then commit after review.

### Task 4: Release gate and conditional production promotion
**Files:** synthetic test fixtures only if needed; verification report under ignored `.superpowers/`.
- [ ] Repeat five scenarios: S1/PTN Java; vocational/PTN outside Java; exploring/multiple aspirations; legacy optional fields absent; campus API failure plus Prompt Bank/clipboard fallback.
- [ ] Assert selected categories/degrees across all ten recommendation campus lists, not only the top card. Inspect 320px, 375px and 1440px; verify one/two/three-route layouts.
- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, full Playwright CT and `npm run build`; restore generated `next-env.d.ts` only if changed by build.
- [ ] Review diff for private data, unintended scoring/auth/PDF changes and stale tests. Confirm clean working tree after commits.
- [ ] Push feature branch to preview with user approval; wait for successful deployment and smoke-test S1 versus D3/D4 query separation and Java/outside-Java filtering. Do not claim a mocked CT run verifies live login/Gemini submission.
- [ ] Report the five results and remaining limitations. If material findings remain, stop before production.
- [ ] If release conditions and user approval are satisfied, inspect PR/base status and merge via normal repository workflow; never overwrite `main` or force-push. Wait for production deploy success, verify the actual production URL from deployment configuration, smoke-test public routes and campus filters, then report SHA and URL.

## Out of Scope
Resolving the unproven historical screenshot/cache cause, changing institution classifications in source data, verifying campus quality/city boundaries, adding home addresses, altering guidance text generation, or expanding the paused guidance tasks.
