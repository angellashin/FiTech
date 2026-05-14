import type { MuscleGroup, WorkoutGoal, WorkoutPlan, Exercise } from '../domain/workout';
import { getRecommendedSets } from '../utils/workoutHistory';

type ExerciseTemplate = Omit<Exercise, 'id' | 'setDetails'>;

const exerciseLibrary: Record<MuscleGroup, ExerciseTemplate[]> = {
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
