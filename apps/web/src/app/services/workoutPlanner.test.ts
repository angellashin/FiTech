import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateWorkoutPlan } from './workoutPlanner';
import { saveWorkoutHistory } from '../utils/workoutHistory';

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
    const plan = generateWorkoutPlan('strength', ['chest'], duration);

    expect(plan.muscleGroup).toEqual(['chest']);
    expect(plan.exercises).toHaveLength(expectedCount);
  });

  it('adapts lower-body templates for strength work', () => {
    const plan = generateWorkoutPlan('strength', ['lower-body'], 15);

    expect(plan.exercises[0]).toMatchObject({
      name: 'Back Squat',
      sets: 4,
      reps: 8,
      restTime: 120,
      muscleGroup: 'Lower Body',
    });
  });

  it('adapts chest templates for endurance work', () => {
    const plan = generateWorkoutPlan('endurance', ['chest'], 15);

    expect(plan.exercises[0]).toMatchObject({
      name: 'Barbell Bench Press',
      sets: 3,
      reps: 12,
      restTime: 60,
      muscleGroup: 'Chest',
    });
  });

  it('prioritizes controlled machine and cable work for light local plans', () => {
    const plan = generateWorkoutPlan('strength', ['chest'], 15, 'light');

    expect(plan.exercises.map((exercise) => exercise.name)).toEqual([
      'Pec Deck Machine',
      'Cable Fly',
      'Incline Cable Fly',
    ]);
    expect(plan.rationale).toEqual(
      expect.arrayContaining([expect.stringMatching(/light intensity/i)]),
    );
  });

  it('prioritizes heavier compound choices for hard local plans', () => {
    const plan = generateWorkoutPlan('strength', ['chest'], 15, 'hard');

    expect(plan.exercises.map((exercise) => exercise.name)).toEqual([
      'Barbell Bench Press',
      'Decline Bench Press',
      'Landmine Press',
    ]);
    expect(plan.rationale).toEqual(
      expect.arrayContaining([expect.stringMatching(/high intensity/i)]),
    );
  });

  it('distributes exercises across multiple requested muscle groups', () => {
    const plan = generateWorkoutPlan('strength', ['chest', 'back'], 30);

    expect(plan.muscleGroup).toEqual(['chest', 'back']);
    expect(plan.exercises).toHaveLength(4);
    expect(plan.exercises.map((exercise) => exercise.muscleGroup)).toEqual([
      'Chest',
      'Chest',
      'Back',
      'Back',
    ]);
  });

  it('creates stable exercise ids from group, goal, group index, and exercise index', () => {
    const plan = generateWorkoutPlan('weight-loss', ['biceps', 'triceps'], 30);

    expect(plan.exercises.map((exercise) => exercise.id)).toEqual([
      'biceps-weight-loss-0-1',
      'biceps-weight-loss-0-2',
      'triceps-weight-loss-1-1',
      'triceps-weight-loss-1-2',
    ]);
  });

  it('hydrates default set details when there is no previous workout history', () => {
    const plan = generateWorkoutPlan('strength', ['lower-body'], 15);
    const squat = plan.exercises[0];

    expect(squat.setDetails).toHaveLength(squat.sets);
    expect(squat.setDetails?.[0]).toEqual({
      weight: 20,
      reps: 8,
      completed: false,
    });
  });

  it('keeps every in-session target aligned with the initially generated set plan', () => {
    const plan = generateWorkoutPlan('strength', ['chest', 'back', 'lower-body'], 60);

    plan.exercises.forEach((exercise) => {
      expect(exercise.setDetails).toHaveLength(exercise.sets);
      exercise.setDetails?.forEach((set) => {
        expect(Number.isFinite(set.weight)).toBe(true);
        expect(set.weight).toBeGreaterThanOrEqual(0);
        expect(set.reps).toBeGreaterThan(0);
        expect(set.completed).toBe(false);
      });
    });
  });

  it('reduces recommended weights when training context marks the muscle group as fatigued', () => {
    const normalPlan = generateWorkoutPlan('strength', ['lower-body'], 15, 'normal');
    const adjustedPlan = generateWorkoutPlan('strength', ['lower-body'], 15, 'normal', {
      muscleFatigue: {
        'lower-body': {
          level: 'high',
          score: 5,
          recentSets: 18,
          recentVolume: 1000,
          daysSinceLastTrained: 1,
          recommendedIntensityMultiplier: 0.85,
          reasons: ['recent training'],
          averageAdherence: 60,
          decision: {
            type: 'deload',
            multiplier: 0.85,
            reasons: ['recent completion rate was 60%'],
          },
        },
      },
      exercisePreferences: { avoid: [] },
      recentReviewAverage: 2,
      summary: [],
    });

    expect(adjustedPlan.exercises[0].setDetails?.[0].weight).toBeLessThan(
      normalPlan.exercises[0].setDetails?.[0].weight ?? Infinity,
    );
    expect(adjustedPlan.rationale).toEqual(
      expect.arrayContaining([expect.stringMatching(/lower body: deload recommendation/i)]),
    );
  });

  it('keeps hard plans conservative when recovery signals are poor', () => {
    const plan = generateWorkoutPlan('strength', ['chest'], 15, 'hard', {
      muscleFatigue: {
        chest: {
          level: 'high',
          score: 6,
          recentSets: 18,
          recentVolume: 2400,
          daysSinceLastTrained: 1,
          recommendedIntensityMultiplier: 0.85,
          reasons: ['Recent completion rate was 50%.'],
          averageAdherence: 50,
          decision: {
            type: 'deload',
            multiplier: 0.85,
            reasons: ['recent completion rate was 50%'],
          },
        },
      },
      exercisePreferences: { avoid: [] },
      recentReviewAverage: 1,
      summary: [],
    });

    expect(plan.exercises.map((exercise) => exercise.name)).toEqual([
      'Pec Deck Machine',
      'Cable Fly',
      'Incline Cable Fly',
    ]);
    expect(plan.rationale).toEqual(
      expect.arrayContaining([expect.stringMatching(/kept exercise selection conservative/i)]),
    );
  });

  it('carries previous working weight forward instead of automatically increasing it', () => {
    saveWorkoutHistory([
      {
        id: 'bench-press',
        name: 'Barbell Bench Press',
        sets: 1,
        reps: 8,
        restTime: 120,
        muscleGroup: 'Chest',
        setDetails: [{ weight: 50, reps: 8, completed: true }],
      },
    ]);

    const plan = generateWorkoutPlan('strength', ['chest'], 15, 'normal');

    expect(plan.exercises[0].setDetails?.[0]).toEqual({
      weight: 50,
      reps: 8,
      completed: false,
    });
    expect(plan.rationale).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/carried forward/i)]),
    );
  });

  it('avoids exercises flagged by training context when alternatives exist', () => {
    const plan = generateWorkoutPlan('strength', ['chest'], 60, 'normal', {
      muscleFatigue: {},
      exercisePreferences: { avoid: ['Cable Fly'] },
      recentReviewAverage: null,
      summary: [],
    });

    expect(plan.exercises.map((exercise) => exercise.name)).not.toContain('Cable Fly');
  });
});
