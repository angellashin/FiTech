import { describe, expect, it } from 'vitest';
import type { WorkoutSessionRecord } from '../utils/workoutHistory';
import { buildProgressReport } from './progressReport';

const buildSession = (overrides: Partial<WorkoutSessionRecord> = {}): WorkoutSessionRecord => ({
  id: 'session-1',
  schemaVersion: 2,
  startedAt: '2026-05-18T10:00:00.000Z',
  completedAt: '2026-05-18T11:00:00.000Z',
  goal: 'strength',
  muscleGroup: ['chest'],
  duration: 60,
  totalSets: 2,
  completedSets: 2,
  totalVolume: 800,
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
        { weight: 50, reps: 8, completed: true },
      ],
    },
  ],
  ...overrides,
});

describe('buildProgressReport', () => {
  it('returns a useful empty-state recommendation', () => {
    const report = buildProgressReport({ sessions: [], now: new Date('2026-05-19T12:00:00.000Z') });

    expect(report.totalSessions).toBe(0);
    expect(report.recommendations).toContain(
      'Complete your first workout to unlock progress analysis.',
    );
  });

  it('summarizes sessions, completion, weekly work, and muscle group share', () => {
    const report = buildProgressReport({
      now: new Date('2026-05-19T12:00:00.000Z'),
      sessions: [
        buildSession({ id: 'current', completedAt: '2026-05-18T11:00:00.000Z' }),
        buildSession({
          id: 'previous-week',
          completedAt: '2026-05-10T11:00:00.000Z',
          totalSets: 4,
          completedSets: 2,
          totalVolume: 400,
        }),
      ],
    });

    expect(report.totalSessions).toBe(2);
    expect(report.trainingDays).toBe(2);
    expect(report.averageCompletionRate).toBe(67);
    expect(report.weeklyWork).toMatchObject({
      current: 800,
      previous: 400,
      changePercent: 100,
      direction: 'up',
    });
    expect(report.muscleGroups[0]).toMatchObject({ group: 'chest', totalWork: 1600, share: 100 });
    expect(report.dailyWork).toHaveLength(7);
    expect(report.dailyWork.find((day) => day.date === '2026-05-18')).toMatchObject({
      work: 800,
      sessions: 1,
    });
    expect(report.exerciseTrends[0]).toMatchObject({
      exercise: 'Bench Press',
      sessions: 2,
      topWeight: 50,
      topEstimatedOneRepMax: 63,
    });
    expect(report.recommendations).toEqual(
      expect.arrayContaining([expect.stringMatching(/lighter or shorter/i)]),
    );
  });

  it('computes a streak ending at the most recent training day', () => {
    const report = buildProgressReport({
      now: new Date('2026-05-19T12:00:00.000Z'),
      sessions: [
        buildSession({ id: 'day-1', completedAt: '2026-05-18T11:00:00.000Z' }),
        buildSession({ id: 'day-2', completedAt: '2026-05-17T11:00:00.000Z' }),
        buildSession({ id: 'gap', completedAt: '2026-05-14T11:00:00.000Z' }),
      ],
    });

    expect(report.currentStreak).toBe(2);
  });
});
