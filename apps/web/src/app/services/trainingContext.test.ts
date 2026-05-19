import { describe, expect, it } from 'vitest';
import type { WorkoutSessionRecord } from '../utils/workoutHistory';
import { buildTrainingContext } from './trainingContext';

const buildSession = (overrides: Partial<WorkoutSessionRecord> = {}): WorkoutSessionRecord => ({
  id: 'session-1',
  schemaVersion: 2,
  startedAt: '2026-05-18T10:00:00.000Z',
  completedAt: '2026-05-18T11:00:00.000Z',
  goal: 'strength',
  muscleGroup: ['lower-body'],
  duration: 60,
  totalSets: 10,
  completedSets: 10,
  totalVolume: 1200,
  events: [],
  exercises: [],
  exerciseReviews: [],
  ...overrides,
});

describe('trainingContext', () => {
  it('marks a muscle group as high fatigue after repeated recent high-volume sessions', () => {
    const context = buildTrainingContext({
      sessions: [
        buildSession(),
        buildSession({ id: 'session-2', completedAt: '2026-05-16T11:00:00.000Z' }),
      ],
      now: new Date('2026-05-18T12:00:00.000Z'),
    });

    expect(context.muscleFatigue['lower-body']?.level).toBe('high');
    expect(context.muscleFatigue['lower-body']?.recommendedIntensityMultiplier).toBeLessThan(1);
  });

  it('uses low face-scale reviews as negative training feedback', () => {
    const context = buildTrainingContext({
      sessions: [
        buildSession({
          muscleGroup: ['chest'],
          completedSets: 4,
          review: { rating: 1, notes: 'rough', reviewedAt: '2026-05-18T12:00:00.000Z' },
        }),
      ],
      now: new Date('2026-05-18T12:00:00.000Z'),
    });

    expect(context.muscleFatigue.chest?.level).toBe('high');
    expect(context.muscleFatigue.chest?.decision.type).toBe('deload');
  });

  it('does not create an automatic increase after one positive session', () => {
    const context = buildTrainingContext({
      sessions: [
        buildSession({
          muscleGroup: ['chest'],
          totalSets: 4,
          completedSets: 4,
          totalVolume: 800,
          review: { rating: 5, reviewedAt: '2026-05-18T12:00:00.000Z' },
        }),
      ],
      now: new Date('2026-05-20T12:00:00.000Z'),
    });

    expect(context.muscleFatigue.chest?.decision.type).toBe('maintain');
    expect(context.muscleFatigue.chest?.recommendedIntensityMultiplier).toBe(1);
  });

  it('marks repeatedly occupied equipment exercises as avoid candidates', () => {
    const context = buildTrainingContext({
      sessions: [
        buildSession({
          events: [
            {
              id: '1',
              type: 'equipment_occupied',
              timestamp: '2026-05-18T10:00:00.000Z',
              exerciseName: 'Cable Fly',
              message: 'occupied',
            },
            {
              id: '2',
              type: 'equipment_occupied',
              timestamp: '2026-05-18T10:01:00.000Z',
              exerciseName: 'Cable Fly',
              message: 'occupied',
            },
          ],
        }),
      ],
      now: new Date('2026-05-18T12:00:00.000Z'),
    });

    expect(context.exercisePreferences.avoid).toContain('Cable Fly');
  });
});
