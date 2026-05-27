import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Exercise } from '../domain/workout';
import {
  applyProgressiveOverload,
  calculateTotalVolume,
  getAllHistory,
  getAllSessions,
  getRecommendedSets,
  getWorkoutSession,
  saveWorkoutHistory,
} from './workoutHistory';

const storage = new Map<string, string>();

const installLocalStorageMock = () => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, String(value))),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
  });
};

const buildExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'bench-press',
  name: 'Bench Press',
  sets: 2,
  reps: 8,
  restTime: 120,
  muscleGroup: 'Chest',
  setDetails: [
    { weight: 50, reps: 8, completed: true },
    { weight: 55, reps: 6, completed: false },
  ],
  ...overrides,
});

describe('workout history utilities', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it('calculates volume from completed sets only', () => {
    expect(calculateTotalVolume([buildExercise()])).toBe(400);
  });

  it('saves completed exercise rows and a session record', () => {
    const startedAt = '2026-05-08T10:00:00.000Z';
    const session = saveWorkoutHistory([buildExercise()], [], startedAt, {
      goal: 'strength',
      muscleGroup: ['chest', 'back'],
      duration: 30,
    });

    expect(session).toMatchObject({
      schemaVersion: 2,
      startedAt,
      goal: 'strength',
      muscleGroup: ['chest', 'back'],
      duration: 30,
      totalSets: 2,
      completedSets: 1,
      totalVolume: 400,
    });
    expect(getAllHistory()).toHaveLength(1);
    expect(getAllSessions()).toHaveLength(1);
  });

  it('normalizes legacy muscle group labels without collapsing to chest', () => {
    storage.set(
      'fitech_workout_sessions',
      JSON.stringify([
        {
          id: 'legacy-upper',
          schemaVersion: 1,
          startedAt: '2026-05-01T10:00:00.000Z',
          completedAt: '2026-05-01T10:30:00.000Z',
          muscleGroup: 'upper-body',
          exercises: [],
          events: [],
          totalSets: 0,
          completedSets: 0,
          totalVolume: 0,
        },
        {
          id: 'legacy-arms-full',
          schemaVersion: 1,
          startedAt: '2026-05-02T10:00:00.000Z',
          completedAt: '2026-05-02T10:30:00.000Z',
          muscleGroup: ['arms', 'full_body'],
          exercises: [],
          events: [],
          totalSets: 0,
          completedSets: 0,
          totalVolume: 0,
        },
      ]),
    );

    expect(getWorkoutSession('legacy-upper')?.muscleGroup).toEqual([
      'chest',
      'back',
      'shoulder',
      'biceps',
      'triceps',
    ]);
    expect(getWorkoutSession('legacy-arms-full')?.muscleGroup).toEqual([
      'biceps',
      'triceps',
      'chest',
      'back',
      'shoulder',
      'core',
      'lower-body',
    ]);
  });

  it('normalizes display-case muscle group labels from exercise records', () => {
    storage.set(
      'fitech_workout_sessions',
      JSON.stringify([
        {
          id: 'display-case-groups',
          schemaVersion: 2,
          startedAt: '2026-05-01T10:00:00.000Z',
          completedAt: '2026-05-01T10:30:00.000Z',
          muscleGroup: ['Back', 'Lower Body'],
          exercises: [],
          events: [],
          totalSets: 0,
          completedSets: 0,
          totalVolume: 0,
        },
      ]),
    );

    expect(getWorkoutSession('display-case-groups')?.muscleGroup).toEqual(['back', 'lower-body']);
  });

  it('keeps a session record even when no set was completed', () => {
    const session = saveWorkoutHistory([
      buildExercise({
        setDetails: [
          { weight: 50, reps: 8, completed: false },
          { weight: 55, reps: 6, completed: false },
        ],
      }),
    ]);

    expect(session?.completedSets).toBe(0);
    expect(getAllHistory()).toHaveLength(0);
    expect(getAllSessions()).toHaveLength(1);
  });

  it('carries forward previous working sets without automatic one-session increases', () => {
    expect(
      applyProgressiveOverload([
        { weight: 50, reps: 8, completed: true },
        { weight: 0, reps: 12, completed: true },
      ]),
    ).toEqual([
      { weight: 50, reps: 8, completed: false },
      { weight: 0, reps: 12, completed: false },
    ]);
  });

  it('recommends carried-forward sets from previous matching exercise history', () => {
    saveWorkoutHistory([buildExercise()]);

    expect(getRecommendedSets('Bench Press', 2, 8)).toEqual([
      { weight: 50, reps: 8, completed: false },
    ]);
  });

  it('uses recent same-muscle strength as the fallback for a different exercise', () => {
    saveWorkoutHistory([buildExercise()]);

    expect(getRecommendedSets('Dumbbell Fly', 3, 12, 'Chest')).toEqual([
      { weight: 17.5, reps: 12, completed: false },
      { weight: 17.5, reps: 12, completed: false },
      { weight: 17.5, reps: 12, completed: false },
    ]);
  });
});
