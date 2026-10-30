# Tidy Saved-Result Exports Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Steps use checkbox syntax. Coordinator owns private record access, rendering and Git.

**Goal:** Regenerate the user's approved named Instagram and PDF exports with cleaner presentation, never regenerate assessment data.

**Architecture:** Reuse the existing pure PDF generator and browser canvas share generator. Update reusable export layout, then feed one read-only saved submission into them locally. No new services or persisted fields.

**Tech Stack:** Existing TypeScript, pdf-lib, canvas, Vitest, Playwright.

**Spec / approved design:** User confirmed PDF download only (not recalculation) and the proposed Instagram Story 1080×1920, brighter blue/green accents, retained orange identity, concise PDF summary with better spacing/hierarchy and less repetition. Keep name/scores/ranks/order from the saved report. Story keeps important content away from the top/bottom interface regions (250 px top/bottom), with readable dark copy on bright light surfaces. PDF opens with the result/summary, groups details logically and includes answer details once. Existing text is not silently regenerated or rewritten; trimmed/deduplicated display is acceptable. No changes to the website's results palette are included.

## Global Constraints

- Never write Firebase, drain a queue, call Gemini, rescore, or change saved answers/ranking/narrative.
- Only the coordinator may read the authorized named record. Private payload/generated named exports stay under gitignored exports or .superpowers; no identifying test fixtures, logs, docs or commits.
- Preserve existing public generator signatures and export/download functionality. Do not add dependencies or change auth.
- After file generation, verification and re-review, the user explicitly authorized a new push to feat/app-remake-pathway-flows for preview redeployment. Only the coordinator commits/pushes reusable templates/tests/docs; private artifacts stay ignored. No merge to main.

## Review Focus

- Long names, unbroken program names and long career wording fit their bounds without overlap.
- Saved weak/moderate fit and rank values are honest, not hardcoded #1 or strong-fit praise.
- Story content stays within safe areas; email/school/private answers are not exported to the social card.
- Long PDF content paginates without clipping/footer overlap or repeated answer/action sections.
- Input is not mutated and missing optional historic narrative/pathway fields remain safe.

## Task 1: Export templates

**Files:** src/components/results/shareCard.ts; src/lib/pdf/report.ts; focused tests/pdf.test.ts and new tests/shareCard.test.ts (plus a small pure helper if necessary). No other product files.
**Interfaces:** createInstagramCardBlob(submission: Submission): Promise<Blob>; generateSubmissionPdf(submission: Submission): Promise<Uint8Array>; preserve buildSubmissionPdfTextSnapshot.

- [x] Add focused failing tests for 1080×1920 dimensions, safe-area/bounded drawing with long text, saved ranks/scores, fit honesty, input immutability, and PDF organization/unique section content with legacy/long input.
- [x] Run tests and record intended failures.
- [x] Implement brighter orange/blue/green Story layout with restrained information: name, saved top direction/fit, AI resilience explained separately, concise alternatives and reflection disclaimer. Keep actual stored order/ranks and avoid unsupported promises. Use wrapping/ellipsis/spacing robustly.
- [x] Reorganize PDF into clear overview, evidence/steps and alternatives, with profile/answer details once toward the end. Render saved summary where present; remove redundant next-step/answer sections, preserve substantive unique saved content and cautions. Keep readable headings and page breaks.
- [x] Run focused/full unit tests and typecheck; report red/green evidence and file ownership. No live services, private data, browser server, Git or subagents.

## Coordinator: private generation and verification

- [x] Fetch only the authorized existing submission read-only; keep it gitignored and do not log its full data.
- [x] Run full verification, render Story PNG and PDF locally with the saved immutable payload, inspect phone/story and PDF page images/text bounds.
- [x] Obtain independent read-only review and resolve material findings.
- [x] Return local download paths; explicitly state no score/rank/database changes. Commit reviewed reusable template/tests/docs only and push the existing preview branch, as subsequently authorized; never include private generated files.
