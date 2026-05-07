export type WorkoutGoal = 'strength' | 'endurance' | 'flexibility' | 'weight-loss';

export type MuscleGroup = 'full-body' | 'upper-body' | 'lower-body' | 'core' | 'arms' | 'legs';

export interface WorkoutPlan {
  goal: WorkoutGoal;
  muscleGroup: MuscleGroup;
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
