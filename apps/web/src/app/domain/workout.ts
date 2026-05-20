export type WorkoutGoal = 'strength' | 'endurance' | 'flexibility' | 'weight-loss';

export type WorkoutIntensity = 'very-light' | 'light' | 'normal' | 'hard' | 'very-hard';

export const INTENSITY_MULTIPLIER: Record<WorkoutIntensity, number> = {
  'very-light': 0.8,
  light: 0.9,
  normal: 1.0,
  hard: 1.1,
  'very-hard': 1.2,
};

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulder'
  | 'triceps'
  | 'biceps'
  | 'core'
  | 'lower-body';

export interface WorkoutPlan {
  goal: WorkoutGoal;
  muscleGroup: MuscleGroup[];
  duration: number;
  exercises: Exercise[];
  rationale?: string[];
}

export type SetType = 'normal' | 'failure' | 'dropset';

export const SET_TYPE_CYCLE: SetType[] = ['normal', 'failure', 'dropset'];

export const SET_TYPE_LABEL: Record<SetType, string> = {
  normal: '',
  failure: 'F',
  dropset: 'D',
};

export interface ExerciseSet {
  weight: number;
  reps: number;
  completed: boolean;
  setType?: SetType;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restTime: number;
  muscleGroup: string;
  setDetails?: ExerciseSet[];
  isSuperset?: boolean;
}

export type WorkoutReviewRating = 1 | 2 | 3 | 4 | 5;

export const WORKOUT_REVIEW_FACE_OPTIONS: ReadonlyArray<{
  rating: WorkoutReviewRating;
  ariaLabel: string;
}> = [
  { rating: 1, ariaLabel: 'Face rating 1 of 5' },
  { rating: 2, ariaLabel: 'Face rating 2 of 5' },
  { rating: 3, ariaLabel: 'Face rating 3 of 5' },
  { rating: 4, ariaLabel: 'Face rating 4 of 5' },
  { rating: 5, ariaLabel: 'Face rating 5 of 5' },
];

export interface WorkoutSessionReview {
  /** One intuitive face rating that captures the user's overall feeling after the session. */
  rating: WorkoutReviewRating;
  notes?: string;
  reviewedAt: string;
}

export interface ExerciseReview {
  exerciseId: string;
  exerciseName: string;
  rating: WorkoutReviewRating;
  notes?: string;
  reviewedAt: string;
}

export type TrainingDecisionType = 'increase' | 'maintain' | 'reduce' | 'deload';

export interface TrainingDecision {
  type: TrainingDecisionType;
  multiplier: number;
  reasons: string[];
}

export interface WorkoutInsight {
  id: string;
  type: 'progress' | 'recovery' | 'consistency' | 'record' | 'next-step';
  severity: 'positive' | 'neutral' | 'caution';
  title: string;
  body: string;
  metricRefs?: string[];
}

export interface ExerciseProgressionInsight {
  exerciseName: string;
  decision: TrainingDecisionType;
  suggestedWeightDelta: number;
  reasons: string[];
}

export interface MuscleRecoveryStatus {
  muscleGroup: string;
  fatigueLevel: 'low' | 'moderate' | 'high';
  recentSets: number;
  recentVolume: number;
  daysSinceLastTrained: number | null;
  reviewInfluence: 'positive' | 'neutral' | 'negative';
}

export interface WorkoutSessionAnalytics {
  adherenceRate: number;
  volumeByMuscleGroup: Record<string, number>;
  estimatedOneRepMaxByExercise: Record<string, number>;
  prs: Array<{
    exerciseName: string;
    type: 'weight' | 'volume' | 'estimated-1rm' | 'reps';
    value: number;
    previousValue?: number;
  }>;
  insights: WorkoutInsight[];
}
