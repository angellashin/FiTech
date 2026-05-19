import { describe, expect, it } from 'vitest';
import { exerciseLibrary } from './workoutPlanner';
import { getExerciseGuide } from './exerciseGuide';

describe('getExerciseGuide', () => {
  it('returns beginner guide metadata for every exercise template', () => {
    const guides = Object.values(exerciseLibrary)
      .flat()
      .map((exercise) => getExerciseGuide(exercise));

    expect(guides.length).toBeGreaterThan(60);
    guides.forEach((guide) => {
      expect(guide.equipment.length).toBeGreaterThan(0);
      expect(guide.type.length).toBeGreaterThan(0);
      expect(guide.primaryFocus.length).toBeGreaterThan(0);
      expect(guide.instructions.length).toBeGreaterThanOrEqual(3);
      expect(guide.safetyCues.length).toBeGreaterThanOrEqual(3);
      expect(guide.beginnerTip.length).toBeGreaterThan(0);
      expect(guide.imageSrc).toMatch(/^\/exercise-guides\/.+\.webp$/);
    });
  });

  it('maps common beginner-critical exercises to specific visuals and equipment', () => {
    expect(getExerciseGuide({ name: 'Back Squat', muscleGroup: 'Lower Body' })).toMatchObject({
      equipment: 'Barbell',
      type: 'Weight / Reps',
      variant: 'squat',
    });

    expect(getExerciseGuide({ name: 'Lat Pulldown', muscleGroup: 'Back' })).toMatchObject({
      equipment: 'Cable machine',
      variant: 'pulldown',
    });

    expect(getExerciseGuide({ name: 'Plank', muscleGroup: 'Core' })).toMatchObject({
      equipment: 'Bodyweight',
      type: 'Hold / Time',
      variant: 'plank',
    });
  });
});
