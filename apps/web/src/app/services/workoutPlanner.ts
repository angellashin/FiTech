import type { MuscleGroup, WorkoutGoal, WorkoutPlan, Exercise } from '../domain/workout';
import { getRecommendedSets } from '../utils/workoutHistory';

type ExerciseTemplate = Omit<Exercise, 'id' | 'setDetails'>;

const exerciseLibrary: Record<MuscleGroup, ExerciseTemplate[]> = {
  'lower-body': [
    { name: 'Squats', sets: 4, reps: 8, restTime: 120, muscleGroup: 'Legs' },
    { name: 'Romanian Deadlifts', sets: 3, reps: 10, restTime: 90, muscleGroup: 'Hamstrings' },
    { name: 'Leg Press', sets: 4, reps: 10, restTime: 90, muscleGroup: 'Legs' },
    { name: 'Lunges', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Legs' },
    { name: 'Calf Raises', sets: 3, reps: 15, restTime: 45, muscleGroup: 'Calves' },
    { name: 'Hip Thrusts', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Glutes' },
  ],
  legs: [
    { name: 'Squats', sets: 4, reps: 8, restTime: 120, muscleGroup: 'Legs' },
    { name: 'Leg Press', sets: 4, reps: 10, restTime: 90, muscleGroup: 'Legs' },
    { name: 'Lunges', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Legs' },
    { name: 'Calf Raises', sets: 3, reps: 15, restTime: 45, muscleGroup: 'Calves' },
  ],
  'upper-body': [
    { name: 'Bench Press', sets: 4, reps: 8, restTime: 120, muscleGroup: 'Chest' },
    { name: 'Lat Pulldown', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Back' },
    { name: 'Shoulder Press', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Shoulders' },
    { name: 'Seated Cable Row', sets: 3, reps: 12, restTime: 60, muscleGroup: 'Back' },
    { name: 'Push Ups', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Chest' },
    { name: 'Dumbbell Lateral Raises', sets: 3, reps: 15, restTime: 45, muscleGroup: 'Shoulders' },
  ],
  arms: [
    { name: 'Bicep Curl', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Biceps' },
    { name: 'Tricep Pushdown', sets: 3, reps: 12, restTime: 45, muscleGroup: 'Triceps' },
    { name: 'Hammer Curl', sets: 3, reps: 10, restTime: 45, muscleGroup: 'Biceps' },
    { name: 'Overhead Tricep Extension', sets: 3, reps: 10, restTime: 45, muscleGroup: 'Triceps' },
  ],
  core: [
    { name: 'Plank', sets: 3, reps: 45, restTime: 45, muscleGroup: 'Core' },
    { name: 'Crunches', sets: 3, reps: 15, restTime: 30, muscleGroup: 'Core' },
    { name: 'Russian Twists', sets: 3, reps: 20, restTime: 30, muscleGroup: 'Core' },
    { name: 'Dead Bug', sets: 3, reps: 12, restTime: 30, muscleGroup: 'Core' },
  ],
  'full-body': [
    { name: 'Squats', sets: 3, reps: 10, restTime: 90, muscleGroup: 'Legs' },
    { name: 'Bench Press', sets: 3, reps: 8, restTime: 90, muscleGroup: 'Chest' },
    { name: 'Lat Pulldown', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Back' },
    { name: 'Romanian Deadlifts', sets: 3, reps: 10, restTime: 90, muscleGroup: 'Hamstrings' },
    { name: 'Shoulder Press', sets: 3, reps: 10, restTime: 75, muscleGroup: 'Shoulders' },
    { name: 'Plank', sets: 3, reps: 45, restTime: 45, muscleGroup: 'Core' },
  ],
};

const durationToExerciseCount = (duration: number) => {
  if (duration <= 15) return 3;
  if (duration <= 30) return 4;
  if (duration <= 45) return 5;
  return 6;
};

const adaptForGoal = (template: ExerciseTemplate, goal: WorkoutGoal): ExerciseTemplate => {
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

export function generateWorkoutPlan(
  goal: WorkoutGoal,
  muscleGroup: MuscleGroup,
  duration: number,
): WorkoutPlan {
  const templates = exerciseLibrary[muscleGroup] ?? exerciseLibrary['full-body'];
  const selected = templates.slice(0, durationToExerciseCount(duration));

  const exercises = selected.map((template, index) => {
    const adapted = adaptForGoal(template, goal);
    return {
      id: `${muscleGroup}-${goal}-${index + 1}`,
      ...adapted,
      setDetails: getRecommendedSets(adapted.name, adapted.sets, adapted.reps),
    };
  });

  return {
    goal,
    muscleGroup,
    duration,
    exercises,
  };
}
