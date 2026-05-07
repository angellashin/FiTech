-- FiTech initial Supabase schema
-- Apply this in Supabase Dashboard > SQL Editor, or with the Supabase CLI.
-- Security model: browser clients use the anon/publishable key, and all user data is protected by RLS.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'FiTech Athlete',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  schema_version integer not null default 1,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  goal text,
  muscle_group text,
  duration_minutes integer,
  total_sets integer not null default 0,
  completed_sets integer not null default 0,
  total_volume numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  muscle_group text not null,
  order_index integer not null,
  target_sets integer not null,
  target_reps integer not null,
  rest_seconds integer not null default 60,
  total_volume numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, exercise_id)
);

create table if not exists public.session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  set_number integer not null,
  reps integer not null default 0,
  weight numeric not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, exercise_id, set_number)
);

create table if not exists public.session_events (
  id text primary key,
  session_id text not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  exercise_id text,
  exercise_name text,
  set_number integer,
  message text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on public.profiles(created_at desc);
create index if not exists workout_sessions_user_completed_idx on public.workout_sessions(user_id, completed_at desc);
create index if not exists session_exercises_user_session_idx on public.session_exercises(user_id, session_id);
create index if not exists session_sets_user_session_idx on public.session_sets(user_id, session_id);
create index if not exists session_events_user_session_idx on public.session_events(user_id, session_id);

alter table public.profiles enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.session_sets enable row level security;
alter table public.session_events enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_workout_sessions_updated_at on public.workout_sessions;
create trigger set_workout_sessions_updated_at
before update on public.workout_sessions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'FiTech Athlete')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Profiles: users can only read/update themselves. Inserts are normally handled by the auth trigger.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Workout sessions: users can CRUD only their own rows.
drop policy if exists "workout_sessions_select_own" on public.workout_sessions;
create policy "workout_sessions_select_own"
on public.workout_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "workout_sessions_insert_own" on public.workout_sessions;
create policy "workout_sessions_insert_own"
on public.workout_sessions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "workout_sessions_update_own" on public.workout_sessions;
create policy "workout_sessions_update_own"
on public.workout_sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "workout_sessions_delete_own" on public.workout_sessions;
create policy "workout_sessions_delete_own"
on public.workout_sessions
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Child tables: denormalized user_id makes RLS simple, explicit, and indexed.
drop policy if exists "session_exercises_select_own" on public.session_exercises;
create policy "session_exercises_select_own"
on public.session_exercises
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "session_exercises_insert_own" on public.session_exercises;
create policy "session_exercises_insert_own"
on public.session_exercises
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "session_exercises_update_own" on public.session_exercises;
create policy "session_exercises_update_own"
on public.session_exercises
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "session_exercises_delete_own" on public.session_exercises;
create policy "session_exercises_delete_own"
on public.session_exercises
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "session_sets_select_own" on public.session_sets;
create policy "session_sets_select_own"
on public.session_sets
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "session_sets_insert_own" on public.session_sets;
create policy "session_sets_insert_own"
on public.session_sets
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "session_sets_update_own" on public.session_sets;
create policy "session_sets_update_own"
on public.session_sets
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "session_sets_delete_own" on public.session_sets;
create policy "session_sets_delete_own"
on public.session_sets
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "session_events_select_own" on public.session_events;
create policy "session_events_select_own"
on public.session_events
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "session_events_insert_own" on public.session_events;
create policy "session_events_insert_own"
on public.session_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "session_events_update_own" on public.session_events;
create policy "session_events_update_own"
on public.session_events
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "session_events_delete_own" on public.session_events;
create policy "session_events_delete_own"
on public.session_events
for delete
to authenticated
using ((select auth.uid()) = user_id);
