import type { Exercise } from '../domain/workout';
import { supabase } from '../lib/supabaseClient';
import type { WorkoutSessionRecord } from '../utils/workoutHistory';
import { buildSessionAnalytics } from './workoutAnalytics';
import { rememberWorkoutSyncStatus, type WorkoutSyncResult } from './cloudSyncStatus';

const getExerciseVolume = (exercise: Exercise): number => {
  return (exercise.setDetails ?? []).reduce((sum, set) => {
    const effort = set.weight > 0 ? set.weight * set.reps : set.reps;
    return sum + (set.completed ? effort : 0);
  }, 0);
};

export const syncWorkoutSessionToSupabase = async (
  session: WorkoutSessionRecord | null,
): Promise<WorkoutSyncResult> => {
  if (!session) {
    const result = { ok: false, skipped: true, message: 'No session payload to sync.' };
    rememberWorkoutSyncStatus(result);
    return result;
  }

  if (!supabase) {
    const result = { ok: false, skipped: true, message: 'Supabase env is not configured.' };
    rememberWorkoutSyncStatus(result);
    return result;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;

  if (authError || !user) {
    const result = {
      ok: false,
      skipped: true,
      message: 'No authenticated Supabase user; session stayed local-only.',
    };
    rememberWorkoutSyncStatus(result);
    return result;
  }

  const analytics = session.analytics ?? buildSessionAnalytics(session);

  const sessionRow = {
    id: session.id,
    user_id: user.id,
    schema_version: session.schemaVersion,
    started_at: session.startedAt,
    completed_at: session.completedAt,
    goal: session.goal ?? null,
    muscle_group: session.muscleGroup?.join(',') ?? null,
    duration_minutes: session.duration ?? null,
    total_sets: session.totalSets,
    completed_sets: session.completedSets,
    total_volume: session.totalVolume,
    plan_snapshot: session.planSnapshot ?? null,
    review: session.review ?? null,
    exercise_reviews: session.exerciseReviews ?? [],
    analytics,
  };

  const exerciseRows = session.exercises.map((exercise, index) => ({
    session_id: session.id,
    user_id: user.id,
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    muscle_group: exercise.muscleGroup,
    order_index: index,
    target_sets: exercise.sets,
    target_reps: exercise.reps,
    rest_seconds: exercise.restTime,
    total_volume: getExerciseVolume(exercise),
  }));

  const setRows = session.exercises.flatMap((exercise) =>
    (exercise.setDetails ?? []).map((set, index) => ({
      session_id: session.id,
      user_id: user.id,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      set_number: index + 1,
      reps: set.reps,
      weight: set.weight,
      completed: set.completed,
    })),
  );

  const eventRows = session.events.map((event) => ({
    id: event.id,
    session_id: session.id,
    user_id: user.id,
    event_type: event.type,
    exercise_id: event.exerciseId ?? null,
    exercise_name: event.exerciseName ?? null,
    set_number: event.setNumber ?? null,
    message: event.message,
    occurred_at: event.timestamp,
  }));

  try {
    const { error: sessionError } = await supabase.from('workout_sessions').upsert(sessionRow);
    if (sessionError) throw sessionError;

    if (exerciseRows.length > 0) {
      const { error } = await supabase
        .from('session_exercises')
        .upsert(exerciseRows, { onConflict: 'session_id,exercise_id' });
      if (error) throw error;
    }

    if (setRows.length > 0) {
      const { error } = await supabase
        .from('session_sets')
        .upsert(setRows, { onConflict: 'session_id,exercise_id,set_number' });
      if (error) throw error;
    }

    if (eventRows.length > 0) {
      const { error } = await supabase.from('session_events').upsert(eventRows);
      if (error) throw error;
    }

    const result = { ok: true, message: 'Workout session synced to Supabase.' };
    rememberWorkoutSyncStatus(result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Supabase sync failure.';
    console.warn('Supabase workout sync failed:', message);
    const result = { ok: false, message };
    rememberWorkoutSyncStatus(result);
    return result;
  }
};
