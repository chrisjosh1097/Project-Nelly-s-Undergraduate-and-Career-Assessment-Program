# Project Nelly: mobile-first app remake and education pathways

Date: 2026-10-30
Branch: `feat/app-remake-pathway-flows`
Status: Approved by the user (“go”); implementation plan prepared separately.

## Intent

Remake the complete Project Nelly web experience for Indonesian SMA/SMK students, most of whom use phones. Keep the actual Project Nelly logo and its orange, white, and black identity. Improve recommendation relevance through a small amount of pathway-specific presentation, rather than two substantially different assessments.

The user selected a full interface rebuild on the existing foundation, not an application rewrite. They approved the revised mobile-first visual direction in `nelly-mobile-brand-v2.html`. This document makes the behavioral and technical scope explicit; visual approval alone does not approve all implementation choices below.

## Decisions from the conversation

- Redesign all existing app surfaces, not just the assessment: landing, authentication, assessment, results, already-submitted flow, and admin.
- Place education-pathway selection immediately after school background.
- Keep university and vocational assessments substantially alike, but tailor them to yield more relevant results.
- Preserve the existing project context, using similar open-source repositories as best-practice references.
- Use the logo's orange, white, and black palette, with complementary supporting colors.
- Prioritize phone usability. The user confirmed the revised preview looks right on their phone.
- Work on the separate remake branch.

## Approaches considered

1. **Complete experience rebuild on existing services — selected.** Replace page composition and interaction patterns; extend the existing assessment and deterministic engine. Keep Next.js, TypeScript, Tailwind, Firebase authentication/Firestore, server APIs, PDF generation, and optional Gemini narrative processing. Lower migration risk while allowing a substantial redesign.
2. **Full application rewrite — not selected.** Greater architectural freedom, but unnecessary migration effort and regression risk given working scoring, authentication, and reporting.

The existing aspiration-intent scoring work is already committed on the branch ancestry and must remain intact.

## Goals and success criteria

- A coherent branded system across every route, with no remaining old-style page islands.
- Complete core student journeys at 360 px viewport width without horizontal scrolling or obscured controls; check 320 px as a stress case and tablet/desktop layouts as well.
- Clear, usable choices and progression on phones; touch targets at least 44 by 44 CSS px, preferably 48 px for primary actions.
- Exactly ten unique, deterministic recommendations relevant to the selected education pathway.
- Transparent explanations, separate fit and AI-resilience scores, practical next steps, and honest uncertainty.
- Existing submissions remain readable in results, PDFs, and admin without migration or rescoring.
- Existing duplicate prevention, access boundaries, admin workflows, and optional narrative queue continue to work.

## Non-goals and anti-goals

- No framework rewrite, new database, new auth provider, or broad dependency upgrade.
- No institution admissions predictions, accredited-program directory, salary promises, new psychometric claims, or job guarantees.
- No automatic assumption that SMK means vocational or SMA means university.
- No fundamentally different core scoring weights for vocational students without evidence to justify recalibration.
- No destructive migration, regeneration of historical reports, or client access to private submissions.
- No copied proprietary survey code, whole external survey platform, or analytics/tracking addition.
- No new cross-device draft backend or persistent browser storage of student profiles in this release. Answers survive back/forward movement inside the active wizard, not a browser restart.

## Reference repositories

Use structural patterns, not copied branding or wholesale code:

- [Formbricks](https://github.com/formbricks/formbricks): focused survey presentation and explicit progress. Inspected `packages/surveys/src/components/general/progress-bar.tsx`. Its licensing is not assumed MIT; no source reuse is proposed.
- [SurveyJS](https://github.com/surveyjs/survey-library): declarative, conditional questionnaire modeling. Inspected `packages/survey-core/src/question_paneldynamic.ts`; adopt a much smaller typed configuration suited to Nelly, not the full engine.
- [shadcn/ui](https://github.com/shadcn-ui/ui): accessible composable controls and the dashboard-01 sidebar / summary / table composition. Inspected `apps/v4/registry/new-york-v4/blocks/dashboard-01/page.tsx`.

Retain source links and brief pattern notes in project documentation. If later copying any code, check its license and preserve required attribution first.

## Design system and app shell

- Use `public/brand/project-nelly-logo-cropped.png` or the existing appropriate full logo asset; preserve aspect ratio and provide meaningful alt text. Do not replace it with the preview's provisional lettermark.
- Shared semantic colors: brand orange approximately `#ff3c00`, near-black `#191817`, white, warm off-white backgrounds, pale peach selection surfaces, and muted warm-gray borders/text. Measure actual final text and component contrast; use darker orange for small text where necessary. Orange must not be the only state indicator.
- Shared buttons, fields, badges, panels, focus states, spacing, radii, loading, error, and empty states. Maintain a clear heading hierarchy and readable Indonesian copy.
- Mobile defaults: one column, comfortable line lengths, 16 px input text, full-width primary calls to action, and safe-area-aware bottom spacing. Enlarge into grids and optional sidebars on wider screens.
- Use real route navigation, not mockup tabs. Student navigation exposes appropriate public/assessment/results destinations; admin navigation belongs to the admin context, not the student's primary bottom bar. Show sign-in/account actions according to authentication state.
- Avoid fixed navigation competing with wizard controls or the virtual keyboard. Prefer a compact assessment shell with progress and its own sticky action area; do not stack two bottom control bars in the live wizard.
- Sticky elements must not cover focused controls, errors, final content, or confirmation dialogs. Honor reduced motion. Do not rely on remote fonts to make the app usable.

## Page inventory

### Landing

An accessible branded introduction, primary assessment CTA, explanation of the three-stage journey, pathway coverage, transparent scoring/PDF benefits, and the existing reflection disclaimer. Any sample result must be explicitly marked illustrative. No invented testimonials, completion counts, or unsupported assessment-duration claims.

### Login and account/header states

Redesign Google sign-in and configuration/error/loading states; retain existing redirect handling and identity verification. Explain why sign-in is needed and that one verified email can submit once. Do not expose admin credentials or imply that authentication configuration is working when absent.

### Assessment

Organize the wizard into five visible sections while retaining short question-level steps:

1. Profile and school background: verified email, name, gender/age, school, class, and current school major.
2. Education direction: explicit pathway question immediately following `currentSchoolMajor`.
3. Interests and strengths: favorite subjects, activities, skills, work style, and problem areas.
4. Personal considerations: institution/location preferences, constraints, technology comfort, and optional aspirations/future vision.
5. Review and submit: readable grouped summary, edit links that retain answers, validation, explicit one-submission confirmation, then submit.

Use a typed step/configuration layer to define field, section, validation guidance, and pathway-specific labels/help. Maintain server-side Zod validation as the authority; client checks provide immediate feedback. Update the progress denominator for actual steps, including review. Do not show 100% before submission/review is complete.

### Results and already-submitted

Show identity/pathway context, top match, distinct fit and AI-resilience scores, why it fits, cautions, relevant degree types, and actionable next steps. Render all ten recommendations with progressive disclosure for details rather than ten fully expanded walls of text. Existing career personalization, aspirations, strengths/gaps, answer notes, and pathway advice remain available. Include PDF access and a clear explanation of score limits.

Handle loading, missing submission, unauthorized, processing, failed fetch, and narrative pending/failed/skipped states. Heuristic results remain usable while optional Gemini processing is unavailable. The already-submitted page directs the student to their report rather than a dead end.

### Admin

Preserve manual admin login/logout, school/class/date/top-major/cluster/status filters, search behavior, all existing analytics, CSV export, detail-report viewing, and the existing attempt-reset workflow. A reset remains explicit and destructive, with confirmation and clear success/failure feedback.

Add education-pathway filtering and counts. On desktop use readable tables and summary panels; on phones use labeled student cards with accessible equivalent actions, collapsible filters, and a full-width detail view rather than a squeezed desktop modal. Historical records appear as 'Belum tercatat', separately from students who explicitly chose to explore both pathways.

The existing listing returns up to 500 submissions. Label counts as based on loaded/filter-matching records, not an unbounded organization-wide total. Pagination/database querying improvements are not part of this remake.

### PDF and CSV

Bring the PDF's branding and section hierarchy into the same visual system while preserving content and server-side generation. Add pathway and supported degree labels when recorded, with safe fallbacks for historical reports. PDF output is a print layout, not the phone screen copied verbatim. CSV retains existing columns/meanings and adds explicit pathway information without losing historical fields.

## Education-pathway model (proposed implementation choice)

Add an optional stored field `educationPathway` to student and normalized answer types:

- `university`: Universitas / Akademik (S1)
- `vocational`: Vokasi / Terapan (D3 / D4)
- `exploring`: Masih menjelajahi keduanya

Require an explicit choice in the new UI. Permit absent values at the API/read compatibility boundary for old clients and historical records; missing means unrestricted scoring, not an inferred preference. Reject unknown values. For display distinguish missing ('Belum tercatat') from explicit `exploring`.

Pathway is independent of current school major and of institution/location preference. PTN/PTS status is not a degree level: either may offer vocational study. Do not hide PTN/PTS or location choices merely because a student selects vocational.

Retain existing canonical subject/activity/skill values and normalization IDs. Tailor question titles, descriptions, example activities, and option ordering, not the meaning of stored values. All canonical answer choices remain available in both flows. This avoids falsely measuring different interests or breaking historical normalization. Examples for vocational study emphasize practice, projects, tools, internships, and applied learning; university examples emphasize exploring concepts, analysis, and discipline depth without implying university study lacks practice.

Keep existing multi-select limits (three favorite subjects and three activities). Preserve 'other' companion fields and their validation. Switching pathways retains shared answers and changes only relevant presentation and downstream candidate eligibility. Existing college-path choices such as Diploma/vokasi and Sertifikasi/bootcamp remain supported; treat certifications as supplementary, not a substitute for a requested degree. If an older checkbox conflicts with the new explicit direction, show a review note and let explicit `educationPathway` control eligibility; never silently switch the chosen direction.

## Recommendation behavior (proposed implementation choice)

### Candidate eligibility

Use degree metadata in `data/majors.ts`, not cluster labels or the student's school type:

- University: candidates explicitly supporting `S1`.
- Vocational: candidates explicitly supporting `D3` or `D4`.
- Exploring or missing: the full existing candidate set.

A candidate supporting both paths can appear in either. A certification-only candidate does not satisfy D3/D4 eligibility. Audit records marked only `Vokasi` before implementation: add D3/D4 only with a defensible existing basis, otherwise leave them out of the explicit degree-restricted pool. Do not invent qualifications or institution availability. Display degree types as supported routes in the knowledge base, not promises that any named campus offers them.

### Scoring and selection

Preserve the six component weights, aspiration-intent boost, AI-resilience calculation, deterministic tie breaks, and breadth-selection intent. Eligibility is applied before ranking and must also constrain every fallback. The current global S1 fallback list must never reintroduce an ineligible record into vocational results. Select fallbacks from the already eligible, deterministically scored candidates; keep ten unique recommendations and stable ranks.

Validate that each explicit pathway has at least ten eligible records in knowledge-base checks. If this invariant is broken, fail clearly rather than mixing in wrong-degree programs or silently producing fewer results. Add a new scoring-version identifier for the changed pipeline. Do not rescore stored reports automatically.

Store/display eligible degree labels with newly generated recommendation results, so future PDF/UI output can explain the route without pretending historical reports used the new filtering. Older results lacking these additions still render safely. Keep fit scores distinct from admissions probability and AI resilience distinct from employment guarantees.

### Narrative and advice

Pass explicit pathway context into heuristic advice and optional Gemini narration. Explanations should focus on the selected route; exploring students receive balanced comparison guidance. Keep the existing constraint reasoning and practical next steps. Gemini may rewrite narrative but must not change candidate IDs, ranks, scores, or pathway eligibility. Preserve deterministic heuristic content when the queue fails or is disabled.

## Compatibility, security, and operational constraints

- Keep current routes, auth tokens/session handling, verified-email enforcement, deterministic document IDs, and transactional duplicate prevention.
- No Firestore bulk migration. New fields are additive; historical optional fields must not crash JSX, exports, PDF generation, or admin filters.
- Preserve existing stored report versions. Do not backfill a pathway inferred from school type or old preference checkboxes.
- Validate and normalize new inputs on the server; persist the chosen pathway within `answers`. Propagate it through admin filtering and exports.
- No production deployment, data reset, auth configuration changes, or secrets edits as part of design/implementation approval.
- Local brainstorm files contain session access information. Ignore `.superpowers/` in Git; retain only a sanitized mockup snapshot if useful for durable design reference. Never commit session keys, server-info, or event logs.

## Acceptance and verification

Automated checks:

- Existing tests remain green; extend normalization/validation tests for explicit, invalid, and absent pathways.
- Pathway tests cover eligibility for both directions, mixed-degree records, certification-only exclusion, all fallback paths, ten unique recommendations, deterministic output, and unrestricted historical/exploring inputs.
- Preserve aspiration-intent and AI-resilience regression tests. Test that scoring weights themselves are not arbitrarily changed by pathway.
- Test pathway advice/narration, admin filter/count semantics, CSV inclusion, and old/new PDF/report rendering.
- Browser-level tests for school-to-pathway order, validation, preserving answers when switching/backtracking, review/edit/confirm, and safe submission retries/duplicate handling. Use mocked API/auth boundaries for deterministic local coverage without real student accounts.
- Run `npm run validate:kb`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Note that lint currently duplicates the TypeScript check.

Visual/manual checks:

- Check 360/390 px phone widths, 320 px stress case, tablet, and desktop; no page-level horizontal overflow.
- Check landscape, long Indonesian labels, large text/zoom, keyboard navigation, visible focus, reduced motion, touch target sizes, and text/component contrast.
- Confirm sticky controls do not overlap keyboard/focused fields or safe-area navigation; confirm modal focus, escape handling, and return focus.
- Review every page state, mobile admin cards, all ten results, report disclosure, and old/new PDF files.
- Real Firebase/Google sign-in, Firestore writes, queued Gemini integration, and authorized admin actions need a separately controlled integration smoke test when credentials/services are available; mocked tests are not proof these external services work.

## Work organization and builder discretion

This is a full project-sized change, delivered in reviewable slices on the selected branch: shared brand/shell; additive pathway model and scoring; student pages and wizard; results/PDF; admin/export; regression and mobile verification. The implementation plan will specify exact file changes and test sequence.

Builder choices: component names, precise spacing/type scale, breakpoint values, icon selection, internal step configuration shape, and whether a small accessible headless UI/testing dependency is warranted. Build on the installed stack; justify additions. Do not install a full survey platform. Match the approved mobile preview's visual intent rather than duplicating its placeholder data or mockup-only controls.

Implementation choices requiring approval through this document: explicit `exploring` option, degree-based candidate filtering rather than a soft preference boost, unchanged component weights, additive legacy compatibility, context-appropriate navigation, no new persistent draft storage, and adding the pathway to PDF/admin/CSV.
