# Mobile remake verification

Verified locally on 2026-10-30, including regression verification after the independent branch review.

- `npm run validate:kb`: pass; 112 majors, 143 careers. Eligible pools: 89 S1 and 35 D3/D4 programs.
- `npm run lint`: pass (currently the TypeScript check).
- `npm run typecheck`: pass.
- `npm test`: 77 tests pass across 15 files.
- `npm run test:browser`: 54 Chromium component tests pass, using `PLAYWRIGHT_EXECUTABLE_PATH` for an already-installed Chromium after the matching-browser CDN download reset/timed out.
- `npm run build`: pass; all existing application and API routes remain present.

Browser coverage includes 320/360/390/768/1280 px widths, loaded logo, long student/school names, open filters and report details, large text, reduced motion, 44 px control heights, 16 px input text, keyboard radio/disclosure/dialog operation, answer review/edit, retry/duplicate-click protection, admin filter/export/reset/logout, missing historical fields, and usable heuristic results during narrative failures or delays. Polling cancellation is covered. These are actual application components with compiled styles, not the throwaway HTML preview.

The field-boundary contrast check initially measured 2.52:1, failed, and was corrected to a darker border that passes the 3:1 requirement. Dark body copy passes 4.5:1. Contrast and keyboard regression tests are not a claim of complete WCAG certification.

Synthetic old/vocational/university PDF reports each generated successfully (three pages for the standard sample); extracted words stayed inside horizontal page bounds. First and last pages were visually inspected, as were phone screenshots of the landing page, results, and admin report view. Long-text generation is covered by unit tests.

## Independent review and regression fixes

A read-only independent Codex review of `9626ae3..b010b7b` found no critical issues and three important issues. All three were reproduced by failing browser tests, fixed in one pass, and verified with the full green suites and production build:

1. Reports are now scoped to a keyed authenticated UID/email state tree; switching identities cannot retain the previous report, and authorization failures clear private report data.
2. The real `GET /api/submissions/me` HTTP 404 contract now leads to the actionable empty state, rather than an unrecoverable retry loop.
3. Review edits snapshot all answers; cancelling restores the original pathway, name, selections, and companion text. Cancellation also works for the first field.

Seven browser regressions were added. The reviewer raised no minor findings. Fix verification was test-driven, not a second independent approval.

### Decisions and residual risks

- Kept the existing clean dedicated branch/checkout rather than creating another worktree, as agreed in the plan. Tradeoff: no additional filesystem isolation.
- Used a locally installed Chromium through the documented executable override after CDN download failures. Tradeoff: possible version skew; CI should install the matching version.
- Live Google/Firebase/Firestore/Gemini behavior and deployment were outside the read-only review and were not tested against real accounts. Tradeoff: integration failures may still be discovered in an authorized release smoke test.
- Physical virtual keyboards and an independent PDF/share-image visual audit were outside the reviewer’s pass. Synthetic PDFs and phone screenshots were inspected locally, but physical-device differences may remain.

## User-test follow-up: admin entry point

The admin dashboard remained at `/admin`, but the redesign had removed its public navigation entry point. Restored an **Admin / Guru BK** footer link without adding admin controls to the student bottom bar. Regression tests confirm visibility, keyboard focus, a 44 px tap target, and no horizontal overflow at 320, 390, and 1280 px. All 54 browser tests, 77 unit tests, typecheck, and production build pass. Admin authentication remains unchanged.

## Combined admin and result-quality follow-up

Locally verified after commits through `6b13c06`:

- KB validation: 112 majors / 143 careers.
- Lint and typecheck: pass.
- Unit suite: **207 tests across 21 files**, pass.
- Full Chromium component suite: **70 tests**, pass, using the documented executable override.
- Production build: pass, including protected lazy admin detail route.
- Inspected synthetic phone results/admin-detail screenshots and desktop results screenshot. Two additional temporary screenshot checks at 1280 px passed; the temporary test file was removed. Phone evidence and next steps stack vertically, while desktop evidence uses two columns. This is a visual spot-check, not physical-device certification.

Admin now uses 50-row summary pages with protected lazy full reports, always-visible tools and case-insensitive all-record search combined with existing filters. Counts/analytics and CSV cover every match, not just a page or the former latest 500 records. Projected Firestore scans are batched at 200 documents but cost O(N) reads per request; full CSV still materializes matches. Dedicated indexing/aggregates and background exports remain scaling options. A 15-second client deadline bounds waiting but does not cancel server scanning or establish the cause of the reported Netlify delay.

New recommendation generation sorts the final selected ten with the existing comparator before assigning ranks, without changing membership, eligibility or score weights. Narrative-only Gemini enrichment requires a complete strict schema and STOP finish reason; malformed, missing-field and MAX_TOKENS responses fail honestly. Defaults remain one request per attempt, 25 seconds, 5,200 output tokens and three queue attempts. Queue transitions transactionally guard missing/deleted targets and in-flight replacement versions. Saved reports are not regenerated or reordered on read.

Results render saved summaries, actual aspirations, component evidence, practical steps and honest moderate/weak-fit comparisons. Stored ranks/order/scores/labels remain visible and unchanged; compact admin mode and downloads remain. Existing privacy, account-switch, 404 and polling regressions pass.

Independent task reviews and the final combined review approve the agreed scope with no open Critical/Important findings. A queue lifecycle issue found during review was reproduced with failing tests, fixed and re-reviewed. Two nonblocking admin follow-ups remain: generic retry refreshes the last successful table rather than replaying a failed search/detail action, and private GET error responses lack explicit success-style no-store headers. Successful private payloads are no-store and authentication is retained.

Persisted historical queue jobs lack a durable assessment token. Before claim/recovery, an already replaced assessment with an identical/backdated saved creation timestamp cannot be uniquely associated with its old job. After claim, snapshot creation metadata and captured content guard tested in-flight replacements. No cleanup/migration or complete historical identity guarantee is claimed.

Actual Gemini schema acceptance/completion rates, live Firestore transaction retries/performance, deployed latency and physical keyboards remain unverified. Strict narrative structure does not prove factual correctness. Forwarded brighter blue/green palette and 1080×1920 Story-export suggestions await confirmation; this verification covers the existing orange/white/black treatment and unchanged 1080×1350 image export.

## Deliberate limits

- No production deployment, migration, historical rescoring, or real student reset was performed.
- Live Google/Firebase/Firestore/Gemini integration was not exercised. Browser tests use test-only auth/navigation aliases and synthetic API fixtures; server route tests mock external boundaries.
- Phone-width browser tests do not substitute for testing Safari/iOS/Android virtual keyboards on physical devices.
- Assessment drafts remain in memory only; reloads do not restore answers.
- The initial remake used a 500-record admin cap; the follow-up below removes it.
- Browser installation for CI should use `npx playwright install chromium`; the local executable override is optional, not a machine-specific repository setting.
