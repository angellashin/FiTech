# FiTech PoC / CI/CD Execution Roadmap

_Last updated: 2026-05-08_

This document records the technical validation plan and delivery pipeline improvements for FiTech. It is written as a portfolio-friendly engineering log: what we need to prove, how we will prove it, what evidence to collect, and how the CI/CD pipeline should mature over time.

## 1. Goal

FiTech is a screenless, voice-first workout app. The core technical question is not only "Can we build a workout app?" but:

> Can users complete a gym workout with minimal screen interaction while still receiving guidance, controls, and useful post-workout feedback?

The PoC and CI/CD plan should prove that the product concept works, while keeping the repository stable enough for team collaboration and portfolio presentation.

## 2. Current Baseline

### Implemented

- React + Vite web app under `apps/web`.
- GitHub repository connected: <https://github.com/angellashin/FiTech>
- GitHub Pages deployment: <https://angellashin.github.io/FiTech/>
- GitHub Actions CI workflow:
  - install dependencies
  - TypeScript typecheck
  - production build
- GitHub Pages deploy workflow:
  - build app with `/FiTech/` base path
  - upload static artifact
  - deploy through GitHub Pages
- Local MVP features:
  - workout setup
  - rule-based workout plan generation
  - plan preview/editing
  - workout session flow
  - simulated single/double/triple tap controls
  - Web Speech audio guidance
  - localStorage workout history
  - post-workout analytics

### Current gaps

- No automated unit/component tests yet.
- No E2E test covering the full workout flow yet.
- No lint/format CI gate yet.
- Real Bluetooth earbud gesture events are not supported in the browser MVP; tap semantics are currently simulated in-app.
- Audio UX is browser-dependent because Web Speech support differs by environment.
- Analytics are local-only, not backend-synced.

## 3. PoC Plan

The PoC should be split into small proof tracks. Each track should produce visible evidence: screenshots, screen recordings, logs, test results, or short written findings.

### PoC 1 — Screenless workout session flow

**Question**

Can a user start and complete a workout with very little screen attention?

**Scope**

- Start from workout setup.
- Generate a plan.
- Begin session.
- Use simulated tap controls:
  - single tap: complete set / skip rest
  - double tap: skip exercise
  - triple tap: mark equipment occupied and move exercise later
- Complete workout.
- Reach workout summary.

**Success criteria**

- User can complete a full workout session without navigation errors.
- Session state remains correct after tap interactions.
- Completed sets and skipped exercises are represented accurately.
- Workout summary uses real session data, not mock data.

**Evidence to record**

- 1 short screen recording of the full flow.
- Notes on confusing moments or excessive screen interaction.
- Build/typecheck/test result from the same commit.

---

### PoC 2 — Voice coaching feasibility

**Question**

Is browser speech synthesis enough to demonstrate the "screenless coach" concept?

**Scope**

- Announce current exercise.
- Announce set/rest transitions.
- Announce session completion.
- Allow user to toggle audio guidance.

**Success criteria**

- Audio plays in supported browsers.
- App does not crash if speech synthesis is unsupported.
- Audio prompts are short enough to be useful during workouts.
- The app still works silently when audio is disabled.

**Evidence to record**

- Browser/device used for test.
- Whether speech worked.
- Any delay, interruption, or pronunciation issue.
- Suggested prompt text improvements.

---

### PoC 3 — Adaptive planning feasibility

**Question**

Can the app generate a reasonable workout plan from user goal, target muscle group, duration, and local history?

**Scope**

- Inputs:
  - goal
  - muscle group
  - duration
  - previous completed sets from local history
- Output:
  - exercise list
  - sets/reps/rest time
  - basic progression from previous history

**Success criteria**

- Different goals produce meaningfully different plans.
- Different muscle groups produce relevant exercises.
- Previous completed sets can influence recommendations.
- Skipped or incomplete exercises do not pollute progression recommendations.

**Evidence to record**

- Example input/output table.
- Before/after comparison using local history.
- Edge cases found.

---

### PoC 4 — Progress analytics feasibility

**Question**

Can local session data produce useful post-workout progress feedback?

**Scope**

- Store session records in localStorage.
- Calculate:
  - completed sets
  - completed exercises
  - volume score
  - recent history
  - basic profile stats/streaks

**Success criteria**

- Workout complete page reflects the finished session.
- Profile page reflects accumulated local history.
- Metrics do not count skipped/incomplete sets as completed volume.

**Evidence to record**

- Sample local session data shape.
- Screenshot of workout complete page.
- Screenshot of profile/history stats.

---

### PoC 5 — Mobile usability check

**Question**

Does the mobile-first UI work well enough for gym usage?

**Scope**

- Test on phone-sized viewport.
- Test core actions with one hand.
- Check readability during workout.
- Check buttons/tap targets.

**Success criteria**

- Primary workout controls are easy to reach.
- Text is readable while exercising.
- App flow is understandable without long explanations.
- No horizontal overflow or broken layout.

**Evidence to record**

- Mobile screenshots.
- Short usability notes.
- List of top 3 UI improvements.

## 4. CI/CD Plan

The CI/CD pipeline should mature in stages. Each stage adds one safety net without making the team workflow too heavy.

### Stage 0 — Current baseline

**Already done**

- `npm ci`
- `npm run typecheck`
- `npm run build`
- GitHub Pages deployment on `main`

**Purpose**

Prevent code that cannot typecheck or build from silently entering `main`.

---

### Stage 1 — Add lint and format checks

**Why**

Generated Figma code and team edits can easily become inconsistent. Linting catches unused imports, risky patterns, and style drift.

**Tasks**

- Add ESLint for React + TypeScript.
- Add Prettier or use ESLint formatting rules.
- Add scripts:
  - `npm run lint`
  - `npm run format:check`
- Update CI to run lint before build.

**Acceptance criteria**

- CI fails on lint errors.
- Unused imports are caught automatically.
- Team can run the same checks locally.

---

### Stage 2 — Add unit tests

**Why**

Workout planning and history calculations are core product logic. They should be protected before adding more features.

**Recommended test target**

- `workoutPlanner.ts`
- `workoutHistory.ts`

**Tasks**

- Add Vitest.
- Test plan generation by goal/muscle group/duration.
- Test completed vs skipped set calculations.
- Test total volume calculations.
- Add script:
  - `npm run test`

**Acceptance criteria**

- Core domain logic has deterministic tests.
- CI fails when planner/history behavior breaks.

---

### Stage 3 — Add E2E smoke test

**Why**

The most important user journey is the full workout flow. E2E smoke tests prove the deployed app can still be used.

**Recommended tool**

- Playwright

**Tasks**

- Add a smoke test:
  1. Open app.
  2. Enter name / pass onboarding.
  3. Create workout.
  4. Start session.
  5. Complete at least one exercise.
  6. Reach completion screen.
- Run in CI after build.

**Acceptance criteria**

- CI validates at least one happy-path workout flow.
- Failure screenshots/videos are uploaded as artifacts.

---

### Stage 4 — Add deployment verification

**Why**

A build passing does not always mean the public site is reachable. Deployment verification proves the portfolio link works.

**Tasks**

- After deploy, run a URL health check against:
  - <https://angellashin.github.io/FiTech/>
- Optionally run Playwright smoke test against the deployed URL.
- Record deployment URL in workflow output.

**Acceptance criteria**

- Deploy job fails if the site returns a non-200 response.
- Portfolio URL is continuously verified.

---

### Stage 5 — Add release/portfolio evidence workflow

**Why**

For portfolio storytelling, every major milestone should have visible proof.

**Tasks**

- Create milestone tags such as:
  - `poc-screenless-flow-v1`
  - `poc-audio-coach-v1`
  - `mvp-v0.1`
- Attach evidence to GitHub Releases:
  - screenshots
  - short demo GIF/video links
  - test/build status summary
  - known limitations

**Acceptance criteria**

- Portfolio can reference specific releases, not only the latest repo state.
- Each release explains problem, solution, validation, and next step.

## 5. Recommended Branch Strategy

Use `main` as always-deployable.

Recommended branches:

- `poc/screenless-flow`
- `poc/audio-coach`
- `poc/adaptive-planner`
- `ci/lint-format`
- `ci/unit-tests`
- `ci/e2e-smoke`
- `docs/portfolio-evidence`

Every PR should include:

- Product reason
- Implementation summary
- Verification commands/output
- Screenshots or recording for UI changes
- Known limitations

## 6. Portfolio Log Template

Use this format for each improvement entry.

```md
## YYYY-MM-DD — Improvement title

### Problem
What was weak, risky, or missing?

### Decision
What did we change or decide?

### Implementation
Which files/features changed?

### Validation
What commands, CI runs, screenshots, or user tests prove it works?

### Result
What became better for users, developers, or portfolio reviewers?

### Remaining risk
What still needs improvement?
```

## 7. Improvement Backlog

### High priority

- Add ESLint + format check to CI.
- Add Vitest tests for workout planner/history logic.
- Add Playwright smoke test for the workout flow.
- Split large generated components, especially `PlanPreview.tsx`.
- Add mobile screenshots and a short demo recording.

### Medium priority

- Improve audio prompt copy and timing.
- Add graceful browser support messaging for Web Speech.
- Add reset/export controls for local workout history.
- Add a small architecture diagram to README or docs.
- Add PR screenshots/GIF checklist enforcement.

### Later

- Investigate realistic wearable/earbud control integration options.
- Add backend sync if the product needs cross-device history.
- Add real authentication only after data model and privacy requirements are clear.
- Add analytics events only after defining ethical/product metrics.

## 8. Suggested Near-Term Execution Order

1. **Document current PoC baseline**
   - Record current deployed URL, CI status, and MVP screenshots.
2. **Add lint/format CI**
   - Low risk, high collaboration value.
3. **Add unit tests for workout logic**
   - Protects core domain behavior before more features are added.
4. **Add E2E smoke test**
   - Proves the full product journey still works.
5. **Run PoC usability pass**
   - Test the app on mobile and record friction points.
6. **Create first portfolio milestone release**
   - Package problem, demo, validation evidence, and limitations.

## 9. References

- GitHub Pages can publish either from a branch or a custom GitHub Actions workflow: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>
- GitHub Actions workflows define automated jobs and can configure token permissions such as `pages: write` and `id-token: write`: <https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax>
