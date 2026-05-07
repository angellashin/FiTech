import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateWorkoutPlan } from './workoutPlanner';

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

describe('generateWorkoutPlan', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it.each([
    [15, 3],
    [30, 4],
    [45, 5],
    [60, 6],
  ])('selects %i minute plans with %i exercises', (duration, expectedCount) => {
    const plan = generateWorkoutPlan('strength', 'full-body', duration);

    expect(plan.exercises).toHaveLength(expectedCount);
  });

  it('adapts lower-body templates for strength work', () => {
    const plan = generateWorkoutPlan('strength', 'lower-body', 15);

    expect(plan.exercises[0]).toMatchObject({
      name: 'Squats',
      sets: 4,
      reps: 8,
      restTime: 120,
    });
  });

  it('adapts upper-body templates for endurance work', () => {
    const plan = generateWorkoutPlan('endurance', 'upper-body', 15);

    expect(plan.exercises[0]).toMatchObject({
      name: 'Bench Press',
      sets: 3,
      reps: 12,
      restTime: 60,
    });
  });

  it('creates stable exercise ids from the requested muscle group and goal', () => {
    const plan = generateWorkoutPlan('weight-loss', 'arms', 30);

    expect(plan.exercises.map((exercise) => exercise.id)).toEqual([
      'arms-weight-loss-1',
      'arms-weight-loss-2',
      'arms-weight-loss-3',
      'arms-weight-loss-4',
    ]);
  });

  it('hydrates default set details when there is no previous workout history', () => {
    const plan = generateWorkoutPlan('strength', 'lower-body', 15);
    const squat = plan.exercises[0];

    expect(squat.setDetails).toHaveLength(squat.sets);
    expect(squat.setDetails?.[0]).toEqual({
      weight: 60,
      reps: 8,
      completed: false,
    });
  });
});
