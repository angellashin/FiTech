# FiTech

FiTech is a **screenless, voice-first workout web app** for gym users who want to stay focused while training. The product direction comes from the team GA4 ideation and GA5 lo-fi prototype report: reduce phone interaction during workouts, guide users through routines with audio, support low-interaction tap controls, and show post-workout progress analytics.

- Repository: <https://github.com/angellashin/FiTech>
- Web app: `apps/web`
- Product/development brief: [`docs/fitech-development-brief.md`](docs/fitech-development-brief.md)
- PoC / CI/CD roadmap: [`docs/poc-cicd-roadmap.md`](docs/poc-cicd-roadmap.md)
- Reference reports: [`docs/references`](docs/references)

## Core concept

Traditional workout apps force users to look at and touch their phone while training. That breaks flow for experienced lifters using straps or sweaty hands, and it distracts beginners who open their phone during rest periods.

FiTech focuses on:

1. **Real-time audio guidance** — next exercise, target reps/weight, and rest timing.
2. **Low-interaction session control** — single/double/triple tap semantics based on the GA5 report.
3. **Adaptive workout planning** — goal, target muscle group, duration, and previous history shape the plan.
4. **Post-workout analytics** — local session history powers progress and comparison insights.

## Current MVP features

- React/Vite mobile-first web app.
- Name-based local onboarding.
- Rule-based workout plan generation for strength, endurance, flexibility, and weight-loss goals.
- Muscle-group-aware exercise selection.
- Editable plan preview with drag-and-drop ordering.
- Workout session screen with simulated earbud controls:
  - Single tap: complete set / skip rest.
  - Double tap: skip current exercise.
  - Triple tap: mark current equipment occupied and move exercise down.
- Browser speech synthesis for audio guidance when supported.
- localStorage workout session history.
- Post-workout analytics from completed local data.

## Project structure

```txt
.
├── apps/
│   └── web/                 # Vite + React app
├── docs/
│   ├── fitech-development-brief.md
│   └── references/          # GA4/GA5 source PDFs
└── .github/                 # CI, deploy, issue/PR templates
```

## Getting started

```bash
cd apps/web
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verification commands

```bash
cd apps/web
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run preview
```

## Deployment

The repo includes GitHub Actions workflows for CI and GitHub Pages deployment.

Expected GitHub Pages URL after pushing `main` and enabling Pages via Actions:

```txt
https://angellashin.github.io/FiTech/
```

The Vite config uses `GITHUB_PAGES=true` in the Pages workflow to set the `/FiTech/` base path. Local dev and other hosts use `/`.

## Collaboration

- Keep `main` deployable.
- Use short feature branches such as `feature/session-audio` or `refactor/plan-preview`.
- Open PRs with a short product reason, implementation summary, verification output, and screenshots/GIFs for UI changes.
- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the detailed workflow.

## Portfolio notes

When presenting FiTech, emphasize the problem/solution story:

> FiTech turns a workout app from a screen users must manage into an invisible coach that guides, records, and summarizes training while users stay focused on lifting.
