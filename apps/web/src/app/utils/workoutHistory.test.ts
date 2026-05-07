import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Exercise } from '../domain/workout';
import {
  applyProgressiveOverload,
  calculateTotalVolume,
  getAllHistory,
  getAllSessions,
  getRecommendedSets,
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
      muscleGroup: 'upper-body',
      duration: 30,
    });

    expect(session).toMatchObject({
      schemaVersion: 1,
      startedAt,
      goal: 'strength',
      muscleGroup: 'upper-body',
      duration: 30,
      totalSets: 2,
      completedSets: 1,
      totalVolume: 400,
    });
    expect(getAllHistory()).toHaveLength(1);
    expect(getAllSessions()).toHaveLength(1);
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

  it('applies progressive overload and resets completion flags', () => {
    expect(
      applyProgressiveOverload([
        { weight: 50, reps: 8, completed: true },
        { weight: 0, reps: 12, completed: true },
      ]),
    ).toEqual([
      { weight: 51, reps: 8, completed: false },
      { weight: 0, reps: 12, completed: false },
    ]);
  });

  it('recommends progressively overloaded sets from previous matching exercise history', () => {
    saveWorkoutHistory([buildExercise()]);

    expect(getRecommendedSets('Bench Press', 2, 8)).toEqual([
      { weight: 51, reps: 8, completed: false },
    ]);
  });
});
