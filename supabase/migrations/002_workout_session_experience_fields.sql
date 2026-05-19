-- Preserve workout record experience v2 fields in the cloud session row.
-- Safe to run repeatedly; JSONB keeps review/analytics extensible while the app UI stabilizes.

alter table public.workout_sessions
  add column if not exists plan_snapshot jsonb,
  add column if not exists review jsonb,
  add column if not exists exercise_reviews jsonb,
  add column if not exists analytics jsonb;
