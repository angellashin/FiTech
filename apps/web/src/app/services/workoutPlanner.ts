import type {
  MuscleGroup,
  WorkoutGoal,
  WorkoutPlan,
  Exercise,
  WorkoutIntensity,
} from '../domain/workout';
import type { TrainingContext } from './trainingContext';
import { INTENSITY_MULTIPLIER } from '../domain/workout';
import { getRecommendedSets } from '../utils/workoutHistory';

export type ExerciseTemplate = Omit<Exercise, 'id' | 'setDetails'>;

export const exerciseLibrary: Record<MuscleGroup, ExerciseTemplate[]> = {
  chest: [
    { name: 'Barbell Bench Press', sets: 4, reps: 8, restTime: 120, muscleGroup: 'Chest' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 10, restTime: 90, muscleGroup: 'Chest' },
    { name: 'Decline Bench Press', sets: 3, reps: 10, restTime: 90, muscleGroup: 'Chest' },
    { name: 'Dumbbell Fly', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Chest' },
    { name: 'Cable Fly', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Chest' },
    { name: 'Push Up', sets: 3, reps: 15, restTime: 45, muscleGroup: 'Chest' },
    { name: 'Incline Cable Fly', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Chest' },
    { name: 'Dips', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Chest' },
    { name: 'Pec Deck Machine', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Chest' },
    { name: 'Landmine Press', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Chest' },
  ],
  back: [
    { name: 'Deadlift', sets: 3, reps: 6, restTime: 150, muscleGroup: 'Back' },
    { name: 'Pull Up', sets: 3, reps: 8, restTime: 90, muscleGroup: 'Back' },
    { name: 'Barbell Row', sets: 4, reps: 8, restTime: 90, muscleGroup: 'Back' },
    { name: 'Lat Pulldown', sets: 4, reps: 10, restTime: 75, muscleGroup: 'Back' },
    { name: 'Seated Cable Row', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Back' },
    { name: 'Dumbbell Row', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Back' },
    { name: 'T-Bar Row', sets: 3, reps: 10, restTime: 90, muscleGroup: 'Back' },
    { name: 'Face Pull', sets: 3, reps: 15, restTime: 45, muscleGroup: 'Back' },
    { name: 'Straight Arm Pulldown', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Back' },
    { name: 'Hyperextension', sets: 3, reps: 15, restTime: 45, muscleGroup: 'Back' },
  ],
  shoulder: [
    { name: 'Overhead Press', sets: 4, reps: 8, restTime: 90, muscleGroup: 'Shoulder' },
    { name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Shoulder' },
    { name: 'Lateral Raise', sets: 3, reps: 15, restTime: 45, muscleGroup: 'Shoulder' },
    { name: 'Front Raise', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Shoulder' },
    { name: 'Reverse Fly', sets: 3, reps: 15, restTime: 45, muscleGroup: 'Shoulder' },
    { name: 'Arnold Press', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Shoulder' },
    { name: 'Upright Row', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Shoulder' },
    { name: 'Cable Lateral Raise', sets: 3, reps: 15, restTime: 45, muscleGroup: 'Shoulder' },
    { name: 'Machine Shoulder Press', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Shoulder' },
    { name: 'Shrugs', sets: 3, reps: 15, restTime: 45, muscleGroup: 'Shoulder' },
  ],
  triceps: [
    { name: 'Close Grip Bench Press', sets: 4, reps: 8, restTime: 90, muscleGroup: 'Triceps' },
    { name: 'Tricep Pushdown', sets: 4, reps: 12, restTime: 45, muscleGroup: 'Triceps' },
    { name: 'Skull Crusher', sets: 3, reps: 10, restTime: 60, muscleGroup: 'Triceps' },
    { name: 'Overhead Tricep Extension', sets: 3, reps: 10, restTime: 60, muscleGroup: 'Triceps' },
    { name: 'Tricep Dips', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Triceps' },
    { name: 'Cable Kickback', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Triceps' },
    { name: 'Diamond Push Up', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Triceps' },
    { name: 'JM Press', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Triceps' },
    { name: 'Tate Press', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Triceps' },
    { name: 'Single Arm Pushdown', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Triceps' },
  ],
  biceps: [
    { name: 'Barbell Curl', sets: 4, reps: 10, restTime: 60, muscleGroup: 'Biceps' },
    { name: 'Dumbbell Curl', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Biceps' },
    { name: 'Hammer Curl', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Biceps' },
    { name: 'Incline Dumbbell Curl', sets: 3, reps: 10, restTime: 60, muscleGroup: 'Biceps' },
    { name: 'Concentration Curl', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Biceps' },
    { name: 'Cable Curl', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Biceps' },
    { name: 'Preacher Curl', sets: 3, reps: 10, restTime: 60, muscleGroup: 'Biceps' },
    { name: 'Spider Curl', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Biceps' },
    { name: 'Reverse Curl', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Biceps' },
    { name: 'Chin Up', sets: 3, reps: 8, restTime: 90, muscleGroup: 'Biceps' },
  ],
  core: [
    { name: 'Plank', sets: 3, reps: 45, restTime: 45, muscleGroup: 'Core' },
    { name: 'Crunch', sets: 3, reps: 20, restTime: 30, muscleGroup: 'Core' },
    { name: 'Leg Raise', sets: 3, reps: 15, restTime: 30, muscleGroup: 'Core' },
    { name: 'Russian Twist', sets: 3, reps: 20, restTime: 30, muscleGroup: 'Core' },
    { name: 'Ab Wheel Rollout', sets: 3, reps: 10, restTime: 45, muscleGroup: 'Core' },
    { name: 'Hanging Knee Raise', sets: 3, reps: 15, restTime: 30, muscleGroup: 'Core' },
    { name: 'Cable Crunch', sets: 3, reps: 15, restTime: 30, muscleGroup: 'Core' },
    { name: 'Dead Bug', sets: 3, reps: 12, restTime: 30, muscleGroup: 'Core' },
    { name: 'Bicycle Crunch', sets: 3, reps: 20, restTime: 30, muscleGroup: 'Core' },
    { name: 'Mountain Climber', sets: 3, reps: 20, restTime: 30, muscleGroup: 'Core' },
  ],
  'lower-body': [
    { name: 'Back Squat', sets: 4, reps: 8, restTime: 120, muscleGroup: 'Lower Body' },
    { name: 'Romanian Deadlift', sets: 3, reps: 10, restTime: 90, muscleGroup: 'Lower Body' },
    { name: 'Leg Press', sets: 4, reps: 10, restTime: 90, muscleGroup: 'Lower Body' },
    { name: 'Lunges', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Lower Body' },
    { name: 'Hip Thrust', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Lower Body' },
    { name: 'Leg Extension', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Lower Body' },
    { name: 'Leg Curl', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Lower Body' },
    { name: 'Sumo Deadlift', sets: 3, reps: 8, restTime: 120, muscleGroup: 'Lower Body' },
    { name: 'Step Up', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Lower Body' },
    { name: 'Calf Raise', sets: 4, reps: 15, restTime: 45, muscleGroup: 'Lower Body' },
  ],
};

const durationToExerciseCount = (duration: number) => {
  if (duration <= 15) return 3;
  if (duration <= 30) return 4;
  if (duration <= 45) return 5;
  return 6;
};

type ExerciseLoadCategory =
  | 'compound'
  | 'machine'
  | 'cable'
  | 'dumbbell'
  | 'isolation'
  | 'bodyweight';

const getExerciseLoadCategory = (template: ExerciseTemplate): ExerciseLoadCategory => {
  const name = template.name.toLowerCase();
  if (
    name.includes('pull up') ||
    name.includes('chin up') ||
    name.includes('push up') ||
    name.includes('dip') ||
    name.includes('plank') ||
    name.includes('crunch') ||
    name.includes('dead bug') ||
    name.includes('mountain climber') ||
    name.includes('leg raise')
  ) {
    return 'bodyweight';
  }
  if (name.includes('machine') || name.includes('pec deck') || name.includes('leg press')) {
    return 'machine';
  }
  if (name.includes('cable') || name.includes('pulldown') || name.includes('pushdown')) {
    return 'cable';
  }
  if (
    name.includes('fly') ||
    name.includes('raise') ||
    name.includes('curl') ||
    name.includes('extension') ||
    name.includes('kickback') ||
    name.includes('face pull') ||
    name.includes('calf')
  ) {
    return 'isolation';
  }
  if (name.includes('dumbbell') || name.includes('arnold') || name.includes('lunge')) {
    return 'dumbbell';
  }
  return 'compound';
};

const RECOVERY_CATEGORY_SCORE: Record<ExerciseLoadCategory, number> = {
  machine: 0,
  cable: 1,
  isolation: 2,
  bodyweight: 3,
  dumbbell: 4,
  compound: 5,
};

const HIGH_INTENSITY_CATEGORY_SCORE: Record<ExerciseLoadCategory, number> = {
  compound: 0,
  dumbbell: 1,
  machine: 2,
  cable: 3,
  bodyweight: 4,
  isolation: 5,
};

const orderTemplatesForIntensity = (
  templates: ExerciseTemplate[],
  intensity: WorkoutIntensity,
  fatigueSignal?: TrainingContext['muscleFatigue'][MuscleGroup],
) => {
  const shouldProtectRecovery =
    intensity === 'very-light' ||
    intensity === 'light' ||
    fatigueSignal?.decision?.type === 'deload' ||
    fatigueSignal?.decision?.type === 'reduce' ||
    fatigueSignal?.level === 'high';

  const shouldPrioritizeLoad =
    !shouldProtectRecovery && (intensity === 'hard' || intensity === 'very-hard');

  if (!shouldProtectRecovery && !shouldPrioritizeLoad) return templates;

  const scoreMap = shouldProtectRecovery ? RECOVERY_CATEGORY_SCORE : HIGH_INTENSITY_CATEGORY_SCORE;
  return [...templates].sort((a, b) => {
    const diff = scoreMap[getExerciseLoadCategory(a)] - scoreMap[getExerciseLoadCategory(b)];
    return diff !== 0 ? diff : templates.indexOf(a) - templates.indexOf(b);
  });
};

export const adaptForGoal = (template: ExerciseTemplate, goal: WorkoutGoal): ExerciseTemplate => {
  switch (goal) {
    case 'strength':
      return {
        ...template,
        sets: Math.max(template.sets, 4),
        reps: Math.min(template.reps, template.muscleGroup === 'Core' ? template.reps : 8),
        restTime: Math.max(template.restTime, 90),
      };
    case 'endurance':
    case 'weight-loss':
      return {
        ...template,
        sets: Math.max(3, template.sets - 1),
        reps: template.muscleGroup === 'Core' ? template.reps : Math.max(template.reps, 12),
        restTime: Math.min(template.restTime, 60),
      };
    case 'flexibility':
      return {
        ...template,
        sets: Math.min(template.sets, 3),
        reps: template.muscleGroup === 'Core' ? template.reps : Math.max(10, template.reps),
        restTime: Math.min(template.restTime, 45),
      };
    default:
      return template;
  }
};

const applyIntensityToSets = (
  sets: ReturnType<typeof getRecommendedSets>,
  intensity: WorkoutIntensity,
  contextMultiplier = 1,
) => {
  const multiplier = INTENSITY_MULTIPLIER[intensity] * contextMultiplier;
  if (multiplier === 1.0) return sets;
  return sets.map((s) => ({
    ...s,
    weight: s.weight === 0 ? 0 : Math.round((s.weight * multiplier) / 2.5) * 2.5,
  }));
};

const getContextAdjustment = (group: MuscleGroup, trainingContext?: TrainingContext) => {
  const signal = trainingContext?.muscleFatigue[group];
  if (!signal || signal.recommendedIntensityMultiplier === 1) {
    return { multiplier: 1, rationale: null as string | null };
  }
  const label = group
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return {
    multiplier: signal.recommendedIntensityMultiplier,
    rationale: `${label}: ${
      signal.decision?.type ?? signal.level
    } recommendation from recent completion and recovery signals.`,
  };
};

export function generateWorkoutPlan(
  goal: WorkoutGoal,
  muscleGroups: MuscleGroup[],
  duration: number,
  intensity: WorkoutIntensity = 'normal',
  trainingContext?: TrainingContext,
): WorkoutPlan {
  const totalCount = durationToExerciseCount(duration);
  const perGroup = Math.ceil(totalCount / muscleGroups.length);

  const rationale = new Set<string>();
  const avoid = new Set(
    trainingContext?.exercisePreferences.avoid.map((name) => name.toLowerCase()) ?? [],
  );

  const exercises = muscleGroups
    .flatMap((group, groupIndex) => {
      const templates = exerciseLibrary[group] ?? [];
      const fatigueSignal = trainingContext?.muscleFatigue[group];
      const intensityOrderedTemplates = orderTemplatesForIntensity(
        templates,
        intensity,
        fatigueSignal,
      );
      const preferredTemplates = intensityOrderedTemplates.filter(
        (template) => !avoid.has(template.name.toLowerCase()),
      );
      const usableTemplates =
        preferredTemplates.length >= perGroup ? preferredTemplates : intensityOrderedTemplates;
      if (preferredTemplates.length !== templates.length && preferredTemplates.length >= perGroup) {
        rationale.add('Avoided exercises that were repeatedly marked as equipment occupied.');
      }
      if (
        (intensity === 'very-light' || intensity === 'light') &&
        intensityOrderedTemplates !== templates
      ) {
        rationale.add(
          'Light intensity: prioritized controlled machine, cable, and isolation work.',
        );
      }
      if (
        (intensity === 'hard' || intensity === 'very-hard') &&
        fatigueSignal?.level !== 'high' &&
        fatigueSignal?.decision?.type !== 'deload' &&
        fatigueSignal?.decision?.type !== 'reduce'
      ) {
        rationale.add('High intensity: prioritized heavier compound movements where appropriate.');
      }
      if (
        (intensity === 'hard' || intensity === 'very-hard') &&
        (fatigueSignal?.level === 'high' ||
          fatigueSignal?.decision?.type === 'deload' ||
          fatigueSignal?.decision?.type === 'reduce')
      ) {
        rationale.add(
          'Recovery signals kept exercise selection conservative despite high intensity.',
        );
      }
      const adjustment = getContextAdjustment(group, trainingContext);
      if (adjustment.rationale) rationale.add(adjustment.rationale);

      return usableTemplates.slice(0, perGroup).map((template, index) => {
        const adapted = adaptForGoal(template, goal);
        const rawSets = getRecommendedSets(
          adapted.name,
          adapted.sets,
          adapted.reps,
          adapted.muscleGroup,
        );
        return {
          id: `${group}-${goal}-${groupIndex}-${index + 1}`,
          ...adapted,
          setDetails: applyIntensityToSets(rawSets, intensity, adjustment.multiplier),
        };
      });
    })
    .slice(0, totalCount);

  return {
    goal,
    muscleGroup: muscleGroups,
    duration,
    exercises,
    rationale: Array.from(rationale),
  };
}
