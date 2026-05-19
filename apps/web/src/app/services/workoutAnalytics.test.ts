import { describe, expect, it } from 'vitest';
import type { WorkoutSessionRecord } from '../utils/workoutHistory';
import {
  buildSessionAnalytics,
  calculateExerciseProgressionTrend,
  calculateWeeklyVolumeTrend,
  estimateOneRepMax,
} from './workoutAnalytics';

const buildSession = (overrides: Partial<WorkoutSessionRecord> = {}): WorkoutSessionRecord => ({
  id: 'session-1',
  schemaVersion: 2,
  startedAt: '2026-05-18T10:00:00.000Z',
  completedAt: '2026-05-18T11:00:00.000Z',
  goal: 'strength',
  muscleGroup: ['chest'],
  duration: 60,
  totalSets: 2,
  completedSets: 1,
  totalVolume: 400,
  events: [],
  exercises: [
    {
      id: 'bench',
      name: 'Bench Press',
      muscleGroup: 'Chest',
      sets: 2,
      reps: 8,
      restTime: 120,
      setDetails: [
        { weight: 50, reps: 8, completed: true },
        { weight: 50, reps: 8, completed: false },
      ],
    },
  ],
  exerciseReviews: [],
  ...overrides,
});

describe('workoutAnalytics', () => {
  it('calculates estimated 1RM with the Epley formula', () => {
    expect(estimateOneRepMax(50, 8)).toBe(63);
  });

  it('calculates adherence, volume by muscle group, and one rep max', () => {
    const analytics = buildSessionAnalytics(buildSession());

    expect(analytics.adherenceRate).toBe(50);
    expect(analytics.volumeByMuscleGroup).toEqual({ Chest: 400 });
    expect(analytics.estimatedOneRepMaxByExercise['Bench Press']).toBe(63);
    expect(analytics.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'completion-caution',
          title: 'Keep the next session conservative',
        }),
      ]),
    );
  });

  it('uses reps as volume score for completed bodyweight sets', () => {
    const analytics = buildSessionAnalytics(
      buildSession({
        totalSets: 1,
        completedSets: 1,
        totalVolume: 45,
        exercises: [
          {
            id: 'plank',
            name: 'Plank',
            muscleGroup: 'Core',
            sets: 1,
            reps: 45,
            restTime: 45,
            setDetails: [{ weight: 0, reps: 45, completed: true }],
          },
        ],
      }),
    );

    expect(analytics.volumeByMuscleGroup.Core).toBe(45);
  });

  it('reports PRs when current metrics exceed previous sessions', () => {
    const previous = buildSession({
      id: 'previous',
      completedAt: '2026-05-10T10:00:00.000Z',
      exercises: [
        {
          id: 'bench',
          name: 'Bench Press',
          muscleGroup: 'Chest',
          sets: 1,
          reps: 8,
          restTime: 120,
          setDetails: [{ weight: 45, reps: 8, completed: true }],
        },
      ],
    });
    const analytics = buildSessionAnalytics(buildSession(), [previous]);

    expect(analytics.prs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exerciseName: 'Bench Press',
          type: 'weight',
          value: 50,
          previousValue: 45,
        }),
        expect.objectContaining({ exerciseName: 'Bench Press', type: 'estimated-1rm' }),
      ]),
    );
  });

  it('does not count first-time exercises as new records', () => {
    const analytics = buildSessionAnalytics(buildSession(), []);

    expect(analytics.prs).toHaveLength(0);
  });

  it('calculates comparable volume trend from recent sessions', () => {
    const trend = calculateWeeklyVolumeTrend(buildSession({ totalVolume: 600 }), [
      buildSession({ id: 'previous-1', completedAt: '2026-05-10T10:00:00.000Z', totalVolume: 400 }),
      buildSession({ id: 'previous-2', completedAt: '2026-05-08T10:00:00.000Z', totalVolume: 500 }),
    ]);

    expect(trend).toMatchObject({
      previousAverageVolume: 450,
      changePercent: 33,
      direction: 'up',
    });
  });

  it('calculates exercise progression trend without assuming every session is progress', () => {
    const trend = calculateExerciseProgressionTrend('Bench Press', [
      buildSession({
        id: 'latest',
        completedAt: '2026-05-18T10:00:00.000Z',
        exercises: [
          {
            id: 'bench',
            name: 'Bench Press',
            muscleGroup: 'Chest',
            sets: 1,
            reps: 8,
            restTime: 120,
            setDetails: [{ weight: 50, reps: 8, completed: true }],
          },
        ],
      }),
      buildSession({
        id: 'previous',
        completedAt: '2026-05-10T10:00:00.000Z',
        exercises: [
          {
            id: 'bench',
            name: 'Bench Press',
            muscleGroup: 'Chest',
            sets: 1,
            reps: 8,
            restTime: 120,
            setDetails: [{ weight: 50, reps: 8, completed: true }],
          },
        ],
      }),
    ]);

    expect(trend).toMatchObject({
      samples: 2,
      direction: 'stable',
    });
  });
});
