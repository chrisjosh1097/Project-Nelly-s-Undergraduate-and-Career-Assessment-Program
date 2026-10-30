# Project Nelly 101

Project Nelly 101 is a deployable web app for Indonesian SMA/SMK students to receive deterministic major and career recommendations. Ranking and scores remain fully heuristic. Gemini can optionally be enabled as a server-side narrative layer that rewrites the explanation only.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Firebase Authentication with Google Sign-In
- Firestore via Firebase Admin SDK
- Server-side PDF generation with `pdf-lib`
- Vitest tests
- Netlify deployment target

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL shown by Next.js, usually `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=PASTE_ESCAPED_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_HERE

ADMIN_EMAILS=admin@example.com,counselor@example.com
ADMIN_LOGIN_EMAIL=admin@example.com
ADMIN_LOGIN_PASSWORD=change-this-password
ADMIN_SESSION_SECRET=change-this-random-session-secret
ENABLE_GEMINI_ENHANCEMENT=false
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_TIMEOUT_MS=25000
GEMINI_MAX_OUTPUT_TOKENS=5200
GEMINI_QUEUE_ENABLED=true
GEMINI_QUEUE_BATCH_SIZE=10
GEMINI_QUEUE_DELAY_MS=500
GEMINI_QUEUE_MAX_ATTEMPTS=3
GEMINI_QUEUE_LOCK_MS=120000
GEMINI_WORKER_SECRET=change-this-random-worker-secret
```

Only `NEXT_PUBLIC_*` values are exposed to the browser. Firebase Admin credentials and `GEMINI_API_KEY` are used only in server route handlers.

## Database Setup

1. Create a Firebase project.
2. Enable Firestore.
3. Deploy `firestore.rules`; direct client reads/writes to `submissions` are disabled.
4. Create a Firebase service account and place `project_id`, `client_email`, and the escaped `private_key` value in `.env.local`. Keep the key out of Git.

Submissions are stored under one deterministic document ID per normalized email. The server checks and creates records inside a Firestore transaction, so one verified Google email can submit only once.

## Auth Setup

1. Enable Firebase Authentication.
2. Enable Google provider.
3. Add local and deployed domains to Firebase Auth authorized domains.
4. Set `ADMIN_LOGIN_EMAIL`, `ADMIN_LOGIN_PASSWORD`, and `ADMIN_SESSION_SECRET` for the manual admin dashboard login.

## Running Checks

```bash
npm run validate:kb
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run lint` currently runs TypeScript validation as the project-level static check.

## Mobile-First Experience and Education Pathways

The app uses the actual Project Nelly logo and orange/white/black identity, with phone-first navigation, a short-step assessment, review/edit before submission, disclosed recommendation details, and a counselor table that scrolls within its own region on phones.

The new assessment asks for `educationPathway` immediately after school background:
- `university`: programs supporting S1.
- `vocational`: programs supporting D3 or D4.
- `exploring`: unrestricted candidate pool.

Pathway is independent of SMA/SMK background and PTN/PTS preferences. Shared questions retain their canonical values; guidance changes lightly by route. All fallbacks honor degree eligibility; certifications alone do not satisfy a requested degree. Current metadata provides 89 S1-compatible and 35 D3/D4-compatible programs.

The field is optional at the API/legacy-read boundary. Missing historical values display **Belum tercatat**, not an inferred preference. Existing reports are not rescored or migrated. New recommendations add optional `degreeTypes` metadata, and scoring version is `knowledge-base-heuristic-v3.0.0`. PDF/admin/CSV expose the recorded pathway. CSV preserves old columns and appends `educationPathway` and `topDegreeTypes`.

Answers are kept in memory during the wizard, not persisted across reloads or devices. The counselor dashboard uses 50-row summary pages, always-visible filters/tools, and case-insensitive general search across name, email, school, class, top major, and cluster. Search combines with existing filters and covers all submissions, including those older than the former 500-record limit. Matching counts and analytics cover all matches; CSV exports all matches rather than the current page. Full reports load only when opened.

Without an external search index, exact substring search/counts require bounded 200-document Firestore projection batches across the collection on each request. Browser payload and retained page rows are bounded, but database reads still grow with record count. Large datasets may require a dedicated search index, maintained aggregates, and streaming/background CSV exports. Admin requests time out after 15 seconds with a retry state; that deadline does not cancel an already-running server scan.

See [reference patterns](docs/reference-patterns.md), the [approved design](docs/superpowers/specs/2026-10-30-mobile-first-app-remake-design.md), and the [implementation plan](docs/superpowers/plans/2026-10-30-mobile-first-app-remake.md).

### Browser checks

```bash
npx playwright install chromium
npm run test:browser
```

Component tests compile production styles and use synthetic fixtures with test-only auth/navigation aliases and mocked network responses. They cover phone widths (320/360/390 px), tablet/desktop, keyboard interactions, review/retry, admin actions, and legacy/narrative result states. They do not prove live Google sign-in, Firestore access, or Gemini connectivity.

If a browser download is unavailable, `PLAYWRIGHT_EXECUTABLE_PATH` can point to an already-installed compatible Chromium executable. Standard CI should install the browser matching the lockfile. No production auth bypass is added.

## Heuristic Scoring

Assessment labels are normalized into stable IDs in `src/lib/assessment/normalization.ts`. Example:

- `Komputer/TIK` -> `computer`
- `Coding/teknologi` -> `coding`, `tech_ai`
- `Banyak bertemu orang` -> `people_facing`

The runtime scorer in `src/lib/recommendation/scoring.ts` uses the structured knowledge base in `data/`.

Overall fit score:

```text
interestScore * 0.30 +
skillScore * 0.25 +
subjectScore * 0.15 +
workStyleScore * 0.10 +
problemAreaScore * 0.10 +
constraintFitScore * 0.10 +
aspirationMajorBoost
```

The optional aspiration boost is a small deterministic adjustment, not a replacement for profile fit; the final score is rounded and bounded to 0–100.

The engine returns exactly 10 unique recommendations. Sorting is deterministic:

1. Overall fit score descending
2. AI Future Resilience Score descending
3. Job market flexibility descending
4. Major name alphabetically

Flexible fallback majors are used if needed: Sistem Informasi, Manajemen, Komunikasi, Psikologi, Pendidikan, Bisnis Digital, Administrasi Bisnis, Data Science, Akuntansi, and DKV.

## AI Future Resilience

AI Future Resilience Score is calculated separately from fit score:

```text
humanInteraction * 0.15 +
creativity * 0.12 +
physicalPractical * 0.10 +
ethicalJudgment * 0.12 +
complexProblemSolving * 0.15 +
professionalAccountability * 0.10 +
aiAugmentationPotential * 0.12 +
industryGrowth * 0.09 +
nonRoutineWork * 0.05
```

Labels:

- `80-100`: Tinggi
- `60-79`: Sedang
- `<60`: Perlu Adaptasi Tinggi

The copy is intentionally constructive: AI can become a productivity tool, while human skills such as communication, empathy, creativity, judgement, and complex problem solving remain important.

## Knowledge Base

The scalable database lives in `data/`:

- `data/majors.ts`: 112 major/program records
- `data/careers.ts`: 143 career records
- `data/skills.ts`, `data/interests.ts`, `data/subjects.ts`, `data/workStyles.ts`, `data/problemAreas.ts`
- `data/constraintRules.ts`
- `data/aiResilienceProfiles.ts`
- `data/recommendationTemplates.ts`
- `data/scoringExamples.ts`

Validate it with:

```bash
npm run validate:kb
```

When adding a major, include at least 3 subjects, 3 interests, 3 skills, 2 work styles, 2 problem areas, 3 careers, portfolio/certification/internship suggestions, and an AI resilience profile.

When adding a career, link it to at least one existing major and use skill IDs from `data/skills.ts`.

## PDF Report

PDF reports are generated server-side in `src/lib/pdf/report.ts` and include:

- Cover section
- Student profile
- Answer summary
- Highlighted top recommendation
- #2-#10 recommendation table
- AI Future Resilience explanation
- PTN/PTS/Vokasi advice
- Disclaimer
- Project Nelly 101 Series footer

## Admin Dashboard

Admins can:

- View total submissions and unique schools
- See top 10 majors and clusters
- See average fit and AI resilience score
- See most common constraints, activities, and strengths
- Filter by school, class, date range, top major, cluster, and status
- Export CSV with profile fields, all assessment answers, top result, top 10 JSON, scores, and timestamps
- View individual reports

## Deploy to Netlify

1. Push the repo to GitHub.
2. Create a new Netlify project from the repo.
3. Use the default Next.js build command:

```bash
npm run build
```

4. Set environment variables in Netlify Site configuration.
5. Add the Netlify domain to Firebase Auth authorized domains.
6. Ensure server functions are enabled by Netlify’s Next.js runtime.

The app also remains compatible with Vercel if you later choose that route.

## Gemini Narrative Enhancement

Gemini is optional and disabled by default. Set `ENABLE_GEMINI_ENHANCEMENT=true` and provide `GEMINI_API_KEY` in Netlify environment variables to enable personalized narrative analysis.

Submissions are saved with heuristic results immediately, and students can read them while optional Gemini narration is pending, disabled, or unavailable. When Gemini is enabled, the app creates a Firestore-backed job in `geminiNarrativeJobs`; a protected worker route processes jobs later and updates the stored report. This keeps webinar submissions fast even when many students submit at the same time.

Worker route:

```bash
POST /api/internal/gemini-jobs/drain
Authorization: Bearer <GEMINI_WORKER_SECRET>
```

Use a Netlify scheduled function or external cron to call the route every few seconds/minutes during a webinar. With `GEMINI_QUEUE_BATCH_SIZE=10` and a 1-minute cron, the worker attempts up to 10 Gemini narratives per minute. The worker uses `GEMINI_QUEUE_DELAY_MS` as a distributed Firestore rate limiter so concurrent invocations do not start Gemini requests too quickly.

Architecture is prepared through `RecommendationNarrativeEnhancer`:

- Default fallback: `HeuristicTemplateNarrativeEnhancer`
- Optional: `GeminiNarrativeEnhancer`
- Feature flag: `ENABLE_GEMINI_ENHANCEMENT=false`

Gemini may only improve explanation text, tone, student-friendly narrative, or summary paragraphs. It must never change ranking, major IDs, scores, AI Future Resilience Score, or scoring breakdown. Generated narrative is stored with the submission so it is not regenerated every time a student opens the result.

Enrichment now requires a `STOP` finish reason and complete structured JSON with the exact recommended major IDs, summary, strengths, reasons, and required career-personalization fields. Missing fields, unknown mutation fields, malformed JSON and `MAX_TOKENS` are failures, not successful partial enrichment. The parser does not repair arbitrary model output. Defaults remain one provider request per attempt, a 25-second fetch/body deadline and 5,200 output tokens; configuration cannot exceed those budgets. Retries use the existing bounded queue policy (three attempts by default). Stale workers cannot replace a newer job outcome; failed enrichment leaves the saved report available.

Final deterministic sorting now also applies after fallback selection for **new reports**. Existing saved ranks, scores and narratives are not reordered, rescored or regenerated automatically. Narrative structure is validated, but that does not prove factual correctness or overseas admission, employment, licensing or visa eligibility. Provider schema acceptance and deployed completion rates still need an authorized live integration check.
