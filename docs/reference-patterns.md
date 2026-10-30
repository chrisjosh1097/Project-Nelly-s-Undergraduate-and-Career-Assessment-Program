# Reference patterns used in the mobile remake

Project Nelly remains a Next.js/React application with its existing Firebase, deterministic recommendation engine, and server-generated reports. These repositories informed patterns, not copied application code:

| Repository | Inspected source | Pattern adopted |
| --- | --- | --- |
| [Formbricks](https://github.com/formbricks/formbricks) | `packages/surveys/src/components/general/progress-bar.tsx` | Focused survey progression and explicit progress. Nelly calculates progress from its own actual question/review steps. |
| [SurveyJS](https://github.com/surveyjs/survey-library) | `packages/survey-core/src/question_paneldynamic.ts` | A declarative questionnaire structure. Nelly uses a small typed configuration rather than installing a survey platform. |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | `apps/v4/registry/new-york-v4/blocks/dashboard-01/page.tsx` | Composable dashboard summary cards, contextual navigation, and data records. Nelly adapts records into labeled phone cards. |

No wholesale source or external branding was copied. Formbricks licensing is not assumed MIT; any future code reuse needs a separate license check.

## Brand and accessibility

The actual Project Nelly logo is retained. Orange (`#ff3c00`) is an accent, not a default color for small text. Near-black (`#191817`), darker orange (`#bc340e`), warm off-white, peach, and warm gray support readable content. Text and essential field boundaries are checked for contrast; decorative panel dividers are not used as the sole means of identifying controls.

The live assessment omits the public bottom navigation to avoid competing sticky controls. Inputs use 16 px text; primary controls are at least 48 px high. Choices expose checked state, radio groups support arrow keys, disclosures are keyboard-operable, and confirmation dialogs wrap focus and restore it when closed. Reduced-motion preferences are respected.

## Verification boundaries

Real-browser component tests use Chromium with actual production components and compiled Tailwind CSS. Authentication/navigation are test-only aliases; API responses use synthetic fixtures. There are no production auth bypass routes or test user flags. These tests establish interface behavior, not connectivity to Google/Firebase/Gemini.

The mobile matrix covers 320, 360, 390, 768, and 1280 px widths, long names, open admin filters/report views, loaded logo, input text sizes, control heights, and larger text. Synthetic PDF reports are generated and checked separately; real device virtual keyboards and live external-service integration remain manual release checks.
