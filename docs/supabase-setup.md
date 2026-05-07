# FiTech Supabase Setup

_Last updated: 2026-05-08_

Supabase project URL:

```txt
https://kqrqrahstuhvosnwbydp.supabase.co
```

## 1. What is already committed

- `supabase/migrations/001_initial_schema.sql`
  - initial tables for profiles, workout sessions, exercises, sets, and screenless session events
  - Row Level Security policies for user-owned data
- `apps/web/.env.example`
  - safe public environment variable template
- `apps/web/src/app/lib/supabaseClient.ts`
  - browser Supabase client factory guarded by env variables
- `@supabase/supabase-js`
  - frontend SDK dependency

## 2. What you need to do in Supabase Dashboard

### Step 1 — Enable Anonymous Sign-Ins

FiTech currently uses anonymous Supabase Auth for the portfolio/demo flow. This creates a real authenticated user without collecting email or password, so RLS can protect each user's workout records.

1. Go to **Authentication → Sign In / Providers** or **Authentication → Settings**.
2. Enable **Allow anonymous sign-ins** / **Anonymous Sign-Ins**.
3. Keep this as demo-only until abuse prevention such as CAPTCHA/Turnstile is added.

If this is not enabled, the app will still work locally, but Supabase cloud sync will stay inactive.

### Step 2 — Apply the SQL migration

1. Open Supabase Dashboard.
2. Go to **SQL Editor**.
3. Open `supabase/migrations/001_initial_schema.sql` from this repo.
4. Copy/paste the full SQL.
5. Run it.

Expected result:

- `profiles`
- `workout_sessions`
- `session_exercises`
- `session_sets`
- `session_events`

All five public tables should exist with RLS enabled.

### Step 3 — Copy the public anon/publishable key

1. Go to **Project Settings → API**.
2. Copy the public `anon` / `publishable` key.
3. Do **not** copy the `service_role` key into the frontend.

### Step 4 — Create local env file

Create `apps/web/.env.local`:

```env
VITE_SUPABASE_URL=https://kqrqrahstuhvosnwbydp.supabase.co
VITE_SUPABASE_ANON_KEY=PASTE_PUBLIC_ANON_OR_PUBLISHABLE_KEY_HERE
```

`.env.local` must stay uncommitted.

### Step 5 — Verify local build still works

```bash
cd apps/web
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run dev
```

### Step 6 — Configure GitHub Pages env variables

The workflows already read Supabase values from GitHub Actions repository variables. To make the deployed portfolio URL use Supabase cloud sync:

1. Open **GitHub → FiTech repository → Settings → Secrets and variables → Actions → Variables**.
2. Add `VITE_SUPABASE_URL` with the Supabase project URL.
3. Add `VITE_SUPABASE_ANON_KEY` with the public anon/publishable key.
4. Push a new commit or manually run **Deploy GitHub Pages** from the Actions tab.

Use repository variables, not committed files. The public key will still be bundled into the browser build, so RLS remains the actual security boundary.

## 3. Current app integration

The app now uses local-first cloud sync:

```txt
Login name submit
→ create/resume anonymous Supabase user when env is configured
→ WorkoutSession complete
→ save localStorage immediately
→ if Supabase session exists, sync workout_sessions/session_exercises/session_sets/session_events
→ if Supabase fails, keep app working locally and record local sync status
```

The GitHub Pages deployment remains local-only until `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are added as GitHub Actions repository variables.

## 4. Security rules

- `VITE_SUPABASE_ANON_KEY` can be used in the browser only because RLS protects data.
- `SUPABASE_SERVICE_ROLE_KEY` must never be committed and must never be bundled into Vite.
- Every user-owned table has `user_id` and policies using `(select auth.uid()) = user_id`.
- Child tables denormalize `user_id` to keep RLS policies simple and indexed.

## 5. Portfolio note

This setup shows a professional backend progression:

1. local-first MVP
2. Postgres schema design
3. RLS-backed browser access
4. anonymous Auth for demo users
5. cloud sync without breaking offline/local behavior

Official references:

- Supabase JavaScript client initialization: <https://supabase.com/docs/reference/javascript/initializing>
- Supabase JavaScript install docs: <https://supabase.com/docs/reference/javascript/installing>
- Supabase Row Level Security docs: <https://supabase.com/docs/guides/database/postgres/row-level-security>
