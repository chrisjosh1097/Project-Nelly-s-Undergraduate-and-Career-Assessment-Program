# Project Nelly 101

Project Nelly 101 is a deployable web app for Indonesian SMA/SMK students to receive deterministic major and career recommendations. The MVP is fully heuristic: it does not call Gemini, OpenAI, or any paid AI API.

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
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

ADMIN_EMAILS=admin@example.com,counselor@example.com
ENABLE_GEMINI_ENHANCEMENT=false
```

Only `NEXT_PUBLIC_*` values are exposed to the browser. Firebase Admin credentials are used only in server route handlers.

## Database Setup

1. Create a Firebase project.
2. Enable Firestore.
3. Deploy `firestore.rules`; direct client reads/writes to `submissions` are disabled.
4. Create a Firebase service account and place `project_id`, `client_email`, and `private_key` in `.env.local`.

Submissions are stored under one deterministic document ID per normalized email. The server checks and creates records inside a Firestore transaction, so one verified Google email can submit only once.

## Auth Setup

1. Enable Firebase Authentication.
2. Enable Google provider.
3. Add local and deployed domains to Firebase Auth authorized domains.
4. Set `ADMIN_EMAILS` to a comma-separated list for dashboard access.

## Running Checks

```bash
npm run validate:kb
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run lint` currently runs TypeScript validation as the project-level static check.

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
constraintFitScore * 0.10
```

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

- `data/majors.ts`: 97 major/program records
- `data/careers.ts`: 138 career records
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

## Future Gemini Enhancement

The MVP does not implement Gemini calls.

Architecture is prepared through `RecommendationNarrativeEnhancer`:

- Current: `HeuristicTemplateNarrativeEnhancer`
- Future placeholder: `GeminiNarrativeEnhancer`
- Feature flag: `ENABLE_GEMINI_ENHANCEMENT=false`

Future Gemini usage may only improve explanation text, tone, student-friendly narrative, or summary paragraphs. It must never change ranking, major IDs, scores, AI Future Resilience Score, or scoring breakdown.
