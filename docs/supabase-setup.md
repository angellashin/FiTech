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

### Step 1 — Apply the SQL migration

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

### Step 2 — Copy the public anon/publishable key

1. Go to **Project Settings → API**.
2. Copy the public `anon` / `publishable` key.
3. Do **not** copy the `service_role` key into the frontend.

### Step 3 — Create local env file

Create `apps/web/.env.local`:

```env
VITE_SUPABASE_URL=https://kqrqrahstuhvosnwbydp.supabase.co
VITE_SUPABASE_ANON_KEY=PASTE_PUBLIC_ANON_OR_PUBLISHABLE_KEY_HERE
```

`.env.local` must stay uncommitted.

### Step 4 — Verify local build still works

```bash
cd apps/web
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run dev
```

## 3. Next implementation commit

After the migration is applied and `.env.local` is available, the next code change should connect the local workout history repository to Supabase.

Recommended behavior:

```txt
WorkoutSession complete
→ save localStorage immediately
→ if Supabase session exists, sync workout_sessions/session_exercises/session_sets/session_events
→ if Supabase fails, keep app working locally and show no blocking error
```

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
4. future cloud sync without breaking offline/local behavior

Official references:

- Supabase JavaScript client initialization: <https://supabase.com/docs/reference/javascript/initializing>
- Supabase JavaScript install docs: <https://supabase.com/docs/reference/javascript/installing>
- Supabase Row Level Security docs: <https://supabase.com/docs/guides/database/postgres/row-level-security>
