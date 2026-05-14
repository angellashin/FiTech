import type { MuscleGroup, WorkoutGoal, WorkoutPlan, Exercise } from '../domain/workout';
import { getRecommendedSets } from '../utils/workoutHistory';

type ExerciseTemplate = Omit<Exercise, 'id' | 'setDetails'>;

const exerciseLibrary: Record<MuscleGroup, ExerciseTemplate[]> = {
  chest: [
    { name: 'Bench Press', sets: 4, reps: 8, restTime: 120, muscleGroup: '가슴' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 10, restTime: 90, muscleGroup: '가슴' },
    { name: 'Cable Fly', sets: 3, reps: 12, restTime: 60, muscleGroup: '가슴' },
    { name: 'Dips', sets: 3, reps: 10, restTime: 75, muscleGroup: '가슴' },
    { name: 'Push Ups', sets: 3, reps: 15, restTime: 45, muscleGroup: '가슴' },
    { name: 'Pec Deck Machine', sets: 3, reps: 12, restTime: 60, muscleGroup: '가슴' },
  ],
  back: [
    { name: 'Lat Pulldown', sets: 4, reps: 10, restTime: 90, muscleGroup: '등' },
    { name: 'Seated Cable Row', sets: 4, reps: 10, restTime: 90, muscleGroup: '등' },
    { name: 'Deadlift', sets: 3, reps: 6, restTime: 150, muscleGroup: '등' },
    { name: 'Dumbbell Row', sets: 3, reps: 10, restTime: 75, muscleGroup: '등' },
    { name: 'Pull Ups', sets: 3, reps: 8, restTime: 90, muscleGroup: '등' },
    { name: 'Face Pull', sets: 3, reps: 15, restTime: 45, muscleGroup: '등' },
  ],
  shoulder: [
    { name: 'Overhead Press', sets: 4, reps: 8, restTime: 90, muscleGroup: '어깨' },
    { name: 'Dumbbell Lateral Raise', sets: 3, reps: 15, restTime: 45, muscleGroup: '어깨' },
    { name: 'Front Raise', sets: 3, reps: 12, restTime: 45, muscleGroup: '어깨' },
    { name: 'Reverse Pec Deck', sets: 3, reps: 15, restTime: 45, muscleGroup: '어깨' },
    { name: 'Arnold Press', sets: 3, reps: 10, restTime: 75, muscleGroup: '어깨' },
    { name: 'Upright Row', sets: 3, reps: 12, restTime: 60, muscleGroup: '어깨' },
  ],
  triceps: [
    { name: 'Tricep Pushdown', sets: 4, reps: 12, restTime: 45, muscleGroup: '삼두' },
    { name: 'Overhead Tricep Extension', sets: 3, reps: 10, restTime: 60, muscleGroup: '삼두' },
    { name: 'Skull Crusher', sets: 3, reps: 10, restTime: 60, muscleGroup: '삼두' },
    { name: 'Close Grip Bench Press', sets: 3, reps: 10, restTime: 90, muscleGroup: '삼두' },
    { name: 'Tricep Dips', sets: 3, reps: 12, restTime: 60, muscleGroup: '삼두' },
  ],
  biceps: [
    { name: 'Barbell Curl', sets: 4, reps: 10, restTime: 60, muscleGroup: '이두' },
    { name: 'Dumbbell Curl', sets: 3, reps: 12, restTime: 45, muscleGroup: '이두' },
    { name: 'Hammer Curl', sets: 3, reps: 12, restTime: 45, muscleGroup: '이두' },
    { name: 'Incline Dumbbell Curl', sets: 3, reps: 10, restTime: 60, muscleGroup: '이두' },
    { name: 'Concentration Curl', sets: 3, reps: 12, restTime: 45, muscleGroup: '이두' },
  ],
  core: [
    { name: 'Plank', sets: 3, reps: 45, restTime: 45, muscleGroup: '복근' },
    { name: 'Crunches', sets: 3, reps: 20, restTime: 30, muscleGroup: '복근' },
    { name: 'Russian Twists', sets: 3, reps: 20, restTime: 30, muscleGroup: '복근' },
    { name: 'Leg Raise', sets: 3, reps: 15, restTime: 30, muscleGroup: '복근' },
    { name: 'Ab Wheel Rollout', sets: 3, reps: 10, restTime: 45, muscleGroup: '복근' },
    { name: 'Dead Bug', sets: 3, reps: 12, restTime: 30, muscleGroup: '복근' },
  ],
  'lower-body': [
    { name: 'Squats', sets: 4, reps: 8, restTime: 120, muscleGroup: '하체' },
    { name: 'Romanian Deadlifts', sets: 3, reps: 10, restTime: 90, muscleGroup: '하체' },
    { name: 'Leg Press', sets: 4, reps: 10, restTime: 90, muscleGroup: '하체' },
    { name: 'Lunges', sets: 3, reps: 12, restTime: 60, muscleGroup: '하체' },
    { name: 'Hip Thrusts', sets: 3, reps: 10, restTime: 75, muscleGroup: '하체' },
    { name: 'Calf Raises', sets: 3, reps: 15, restTime: 45, muscleGroup: '하체' },
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
