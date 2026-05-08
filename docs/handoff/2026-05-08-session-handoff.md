# FiTech Session Handoff — 2026-05-08

## Current Objective

FiTech is being developed as a **screenless workout web app PoC** for Product Engineer / APM portfolio use. The project now has a deployed MVP, Supabase-backed local-first sync, CI/CD, unit-test coverage, and portfolio narrative documentation.

## Repository and Deployment

- GitHub repo: <https://github.com/angellashin/FiTech>
- Deployed app: <https://angellashin.github.io/FiTech/>
- Current app/browser title: `FiTech Screenless Workout App`
- Latest confirmed local HEAD at handoff: `9508ba3`
- Latest successful GitHub Actions at handoff:
  - CI: `success` for `9508ba3`
  - Deploy GitHub Pages: `success` for `9508ba3`

## What Was Implemented Today

### 1. Supabase backend PoC

Implemented and validated a local-first cloud sync path.

Key decisions:

- Use Supabase for backend/database.
- Use Anonymous Auth for low-friction portfolio/demo users.
- Use Row Level Security as the real security boundary.
- Keep workout completion local-first so network/backend failures do not block the core workout experience.

Key files:

- `supabase/migrations/001_initial_schema.sql`
- `apps/web/.env.example`
- `apps/web/src/app/lib/supabaseClient.ts`
- `apps/web/src/app/services/supabaseAuth.ts`
- `apps/web/src/app/services/supabaseWorkoutSync.ts`
- `apps/web/src/app/services/cloudSyncStatus.ts`
- `apps/web/src/app/components/Login.tsx`
- `apps/web/src/app/components/WorkoutSession.tsx`
- `apps/web/src/app/components/Profile.tsx`
- `apps/web/src/app/utils/workoutHistory.ts`
- `docs/supabase-setup.md`

Supabase project URL:

```txt
https://kqrqrahstuhvosnwbydp.supabase.co
```

Do not commit keys. Local key is in ignored `apps/web/.env.local`. GitHub Pages uses repository variables:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Never put a `service_role` key into Vite, GitHub Pages, or committed files.

### 2. Live Supabase smoke test

A live anonymous Auth + RLS smoke test passed.

Smoke result:

```txt
Smoke session ID: smoke_1778183348281
profiles: 1 row
workout_sessions: 1 row
session_exercises: 1 row
session_sets: 1 row
session_events: 2 rows
```

Meaning:

- Anonymous Sign-Ins are working.
- Browser publishable key can create an authenticated anonymous user.
- RLS-protected inserts/selects work for user-owned workout records.
- Backend PoC is validated at API/data level.

### 3. CI/CD pipeline

CI now runs on push to `main` and pull requests.

Current CI sequence:

```txt
npm ci
npm run lint
npm run format:check
npm run test
npm run typecheck
npm run build
```

CD deploys to GitHub Pages on push to `main`.

Key files:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-pages.yml`

Deployment details:

- `GITHUB_PAGES=true` sets Vite base path to `/FiTech/`.
- Supabase public env values are injected from GitHub Actions repository variables.

Known warning:

- GitHub Actions currently warns that some actions run on Node.js 20 and will need future Node 24-compatible updates. It is a warning, not a failure.

### 4. Unit test foundation

Added Vitest and 17 passing unit tests.

Test files:

- `apps/web/src/app/services/workoutPlanner.test.ts`
- `apps/web/src/app/utils/workoutHistory.test.ts`
- `apps/web/src/app/services/supabaseWorkoutSync.test.ts`

Coverage focus:

- workout plan generation
- duration-to-exercise count behavior
- goal-based plan adjustments
- completed-set volume calculation
- local workout history persistence
- progressive overload recommendations
- Supabase sync success/failure/skip behavior

Current test command:

```bash
cd apps/web
npm run test
```

Latest local result:

```txt
3 test files passed
17 tests passed
```

### 5. Product / portfolio documentation

Created narrative documentation for Product Engineer / APM use.

Key files:

- `docs/portfolio/product-engineer-apm-summary.md`
- `docs/poc-cicd-roadmap.md`
- `docs/handoff/2026-05-08-session-handoff.md`
- `.omx/plans/fitech-next-phase-plan-2026-05-08.md`

Narrative framing:

- Problem: workout apps require too much phone interaction during gym sessions.
- HCI/UX angle: reduce visual attention and manual input during exercise.
- Product hypothesis: screenless/tap-based interaction can preserve workout flow while still recording progress.
- Engineering validation: CI/CD, Supabase smoke test, and unit tests make the PoC measurable and repeatable.

## Important Commits From Today

```txt
9508ba3 Turn FiTech delivery work into an APM-ready narrative
2ceaf0b Prove FiTech workout logic before the next feature wave
f83fad8 Present FiTech with its portfolio-ready app title
b781c3b Redeploy FiTech with Supabase repository variables available
4046484 Let deployed FiTech builds opt into Supabase sync safely
2c73443 Sync FiTech workout sessions without breaking local-first flow
3a74cf3 Prepare FiTech for Supabase-backed workout history
29e76cd Prevent style drift before FiTech changes reach main
bc5646b Record how FiTech will validate PoC and delivery maturity
9e6e515 Establish FiTech as a collaboration-ready MVP
```

Note: remote commit `ace6f45 remove portfolio part` was integrated via rebase. Avoid force push unless explicitly required.

## How To Run Locally Next Time

```bash
cd /Users/shinminseo/Desktop/FiTech/apps/web
npm_config_cache=/tmp/fitech-npm-cache npm ci --no-audit --no-fund
npm run dev
```

Then open the Vite local URL, usually:

```txt
http://localhost:5173/
```

Run full local verification:

```bash
cd apps/web
npm run lint
npm run format:check
npm run test
npm run typecheck
npm run build
```

## Next Recommended Work

### Priority 1 — Add Playwright E2E smoke test

Goal: prove the full browser journey works.

Target flow:

```txt
login
→ workout setup
→ plan generation
→ session start
→ set complete
→ workout complete
```

Acceptance criteria:

- `npm run e2e` exists.
- One smoke test passes locally.
- CI runs the E2E smoke test or has a separate E2E workflow.
- Supabase network behavior is mocked or allowed to fail without breaking the local-first flow.

### Priority 2 — Portfolio README polish

Add or improve:

- live demo link
- product problem statement
- CI/CD badges
- Supabase/local-first architecture explanation
- screenshots/GIF
- test commands
- HCI/Product Engineer framing

Important: the user previously removed a “portfolio part” from README, so keep README edits concise and ask only if the direction is ambiguous.

### Priority 3 — Cloud sync UX hardening

Potential improvements:

- clearer sync states: `pending`, `syncing`, `synced`, `failed`
- Profile `Retry sync` button
- export local history
- reset demo data
- better failure messages for Anonymous Auth / RLS issues

### Priority 4 — HCI/UX validation

Potential next research/validation work:

- define usability test scenario for screenless workout flow
- test whether single/double/triple tap mappings are intuitive
- evaluate audio prompt timing and clarity
- compare beginner vs experienced lifter needs
- record issues in `docs/poc-cicd-roadmap.md`

### Priority 5 — Maintenance

- Track GitHub Actions Node 20 deprecation warning.
- Keep `.env.local` ignored.
- Do not expose Supabase service role key.
- Do not refactor large generated components until E2E smoke test is in place.

## Current Known Gaps

- No Playwright E2E test yet.
- No automated browser-level proof of the deployed full user journey yet.
- No screenshots/GIF assets for portfolio yet.
- Cloud sync status is basic; retry/export/reset UX is not implemented yet.
- The current workout planner is deterministic/rule-based; AI API is not needed yet.

## Stop / Safety Notes For Future Sessions

- Do not commit `apps/web/.env.local`.
- Do not print or store full Supabase publishable key in repo docs.
- Do not use Supabase service role key in frontend or GitHub Pages.
- Do not force push over teammate changes; fetch/rebase first.
- Keep main deployable.
- Run local verification before claiming completion.
