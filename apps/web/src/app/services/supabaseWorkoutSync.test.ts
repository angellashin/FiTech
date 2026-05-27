import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutSessionRecord } from '../utils/workoutHistory';

const mocks = vi.hoisted(() => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
  rememberWorkoutSyncStatus: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: mocks.supabase,
}));

vi.mock('./cloudSyncStatus', () => ({
  rememberWorkoutSyncStatus: mocks.rememberWorkoutSyncStatus,
}));

import { syncWorkoutSessionToSupabase } from './supabaseWorkoutSync';

const sampleSession: WorkoutSessionRecord = {
  id: 'session-test',
  schemaVersion: 2,
  startedAt: '2026-05-08T10:00:00.000Z',
  completedAt: '2026-05-08T10:30:00.000Z',
  goal: 'strength',
  muscleGroup: ['lower-body'],
  duration: 30,
  totalSets: 2,
  completedSets: 1,
  totalVolume: 400,
  planSnapshot: { goal: 'strength', muscleGroup: ['lower-body'], duration: 30, exercises: [] },
  exercises: [
    {
      id: 'squat',
      name: 'Squats',
      sets: 2,
      reps: 8,
      restTime: 120,
      muscleGroup: 'Legs',
      setDetails: [
        { weight: 50, reps: 8, completed: true },
        { weight: 50, reps: 8, completed: false },
      ],
    },
  ],
  events: [
    {
      id: 'event-set-completed',
      type: 'set_completed',
      timestamp: '2026-05-08T10:10:00.000Z',
      exerciseId: 'squat',
      exerciseName: 'Squats',
      setNumber: 1,
      message: 'Set 1 completed.',
    },
    {
      id: 'event-session-completed',
      type: 'session_completed',
      timestamp: '2026-05-08T10:30:00.000Z',
      message: 'Workout complete.',
    },
  ],
};

describe('syncWorkoutSessionToSupabase', () => {
  const tableClients = new Map<string, { upsert: ReturnType<typeof vi.fn> }>();

  beforeEach(() => {
    vi.clearAllMocks();
    tableClients.clear();
    mocks.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mocks.supabase.from.mockImplementation((table: string) => {
      const client = {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
      tableClients.set(table, client);
      return client;
    });
  });

  it('skips sync when no session payload is available', async () => {
    await expect(syncWorkoutSessionToSupabase(null)).resolves.toMatchObject({
      ok: false,
      skipped: true,
      message: 'No session payload to sync.',
    });

    expect(mocks.supabase.from).not.toHaveBeenCalled();
    expect(mocks.rememberWorkoutSyncStatus).toHaveBeenCalledWith(
      expect.objectContaining({ skipped: true }),
    );
  });

  it('skips sync when there is no authenticated Supabase user', async () => {
    mocks.supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(syncWorkoutSessionToSupabase(sampleSession)).resolves.toMatchObject({
      ok: false,
      skipped: true,
    });

    expect(mocks.supabase.from).not.toHaveBeenCalled();
  });

  it('upserts session, exercise, set, and event rows for the authenticated user', async () => {
    await expect(syncWorkoutSessionToSupabase(sampleSession)).resolves.toMatchObject({
      ok: true,
      message: 'Workout session synced to Supabase.',
    });

    expect(tableClients.get('workout_sessions')?.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'session-test',
        user_id: 'user-1',
        completed_sets: 1,
        total_volume: 400,
        muscle_group: 'lower-body',
        plan_snapshot: sampleSession.planSnapshot,
        analytics: expect.objectContaining({ adherenceRate: 50 }),
      }),
    );
    expect(tableClients.get('session_exercises')?.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          session_id: 'session-test',
          user_id: 'user-1',
          exercise_id: 'squat',
          target_sets: 2,
          total_volume: 400,
        }),
      ],
      { onConflict: 'session_id,exercise_id' },
    );
    expect(tableClients.get('session_sets')?.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ set_number: 1, completed: true }),
        expect.objectContaining({ set_number: 2, completed: false }),
      ]),
      { onConflict: 'session_id,exercise_id,set_number' },
    );
    expect(tableClients.get('session_events')?.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ event_type: 'set_completed', set_number: 1 }),
        expect.objectContaining({ event_type: 'session_completed', set_number: null }),
      ]),
    );
  });

  it('returns a failed status when any Supabase upsert fails', async () => {
    mocks.supabase.from.mockImplementation((table: string) => {
      const client = {
        upsert: vi.fn().mockResolvedValue({
          error: table === 'session_sets' ? new Error('RLS denied') : null,
        }),
      };
      tableClients.set(table, client);
      return client;
    });

    await expect(syncWorkoutSessionToSupabase(sampleSession)).resolves.toMatchObject({
      ok: false,
      message: 'RLS denied',
    });
    expect(mocks.rememberWorkoutSyncStatus).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, message: 'RLS denied' }),
    );
  });
});
