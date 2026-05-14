export type WorkoutGoal = 'strength' | 'endurance' | 'flexibility' | 'weight-loss';

export type WorkoutIntensity = 'very-light' | 'light' | 'normal' | 'hard' | 'very-hard';

export const INTENSITY_MULTIPLIER: Record<WorkoutIntensity, number> = {
  'very-light': 0.80,
  'light':      0.90,
  'normal':     1.00,
  'hard':       1.10,
  'very-hard':  1.20,
};

export type MuscleGroup = 'chest' | 'back' | 'shoulder' | 'triceps' | 'biceps' | 'core' | 'lower-body';

export interface WorkoutPlan {
  goal: WorkoutGoal;
  muscleGroup: MuscleGroup[];
  duration: number;
  exercises: Exercise[];
}

export interface ExerciseSet {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restTime: number;
  muscleGroup: string;
  setDetails?: ExerciseSet[];
}
