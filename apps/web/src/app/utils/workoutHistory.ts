import type { Exercise, ExerciseSet, MuscleGroup, WorkoutGoal } from '../domain/workout';

export interface WorkoutHistory {
  id: string;
  date: string;
  sessionId: string;
  exerciseName: string;
  muscleGroup: string;
  setDetails: ExerciseSet[];
  restTime: number;
}

export type WorkoutSessionEventType =
  | 'set_completed'
  | 'rest_started'
  | 'rest_skipped'
  | 'exercise_completed'
  | 'exercise_skipped'
  | 'equipment_occupied'
  | 'session_completed';

export interface WorkoutSessionEvent {
  id: string;
  type: WorkoutSessionEventType;
  timestamp: string;
  exerciseId?: string;
  exerciseName?: string;
  setNumber?: number;
  message: string;
}

export interface WorkoutSessionRecord {
  id: string;
  schemaVersion: 1;
  startedAt: string;
  completedAt: string;
  goal?: WorkoutGoal;
  muscleGroup?: MuscleGroup;
  duration?: number;
  exercises: Exercise[];
  events: WorkoutSessionEvent[];
  totalSets: number;
  completedSets: number;
  totalVolume: number;
}

const HISTORY_KEY = 'fitech_workout_history';
const SESSION_HISTORY_KEY = 'fitech_workout_sessions';

const safeReadArray = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return [];
  }
};

const getCompletedSets = (exercise: Exercise) => {
  if (!exercise.setDetails?.length) return [];
  return exercise.setDetails.filter((set) => set.completed);
};

export const calculateExerciseVolume = (exercise: Exercise): number => {
  const sets = exercise.setDetails?.length
    ? exercise.setDetails
    : Array.from({ length: exercise.sets }, () => ({
        weight: 0,
        reps: exercise.reps,
        completed: false,
      }));

  return sets.reduce((sum, set) => {
    const effort = set.weight > 0 ? set.weight * set.reps : set.reps;
    return sum + (set.completed ? effort : 0);
  }, 0);
};

export const calculateTotalVolume = (exercises: Exercise[]): number => {
  return exercises.reduce((sum, exercise) => sum + calculateExerciseVolume(exercise), 0);
};

export const saveWorkoutHistory = (
  exercises: Exercise[],
  events: WorkoutSessionEvent[] = [],
  startedAt: string = new Date().toISOString(),
  planMeta?: { goal?: WorkoutGoal; muscleGroup?: MuscleGroup; duration?: number },
): WorkoutSessionRecord | null => {
  try {
    const history = safeReadArray<WorkoutHistory>(HISTORY_KEY);
    const sessions = safeReadArray<WorkoutSessionRecord>(SESSION_HISTORY_KEY);
    const completedAt = new Date().toISOString();
    const sessionId = `session_${completedAt}`;

    exercises.forEach((exercise) => {
      const completedSetDetails = getCompletedSets(exercise);
      if (completedSetDetails.length > 0) {
        const record: WorkoutHistory = {
          id: `${exercise.name}_${completedAt}`,
          sessionId,
          date: completedAt,
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
          setDetails: completedSetDetails,
          restTime: exercise.restTime,
        };
        history.push(record);
      }
    });

    const completedSets = exercises.reduce(
      (sum, exercise) => sum + getCompletedSets(exercise).length,
      0,
    );
    const sessionRecord: WorkoutSessionRecord = {
      id: sessionId,
      schemaVersion: 1,
      startedAt,
      completedAt,
      goal: planMeta?.goal,
      muscleGroup: planMeta?.muscleGroup,
      duration: planMeta?.duration,
      exercises,
      events,
      totalSets: exercises.reduce((sum, exercise) => sum + exercise.sets, 0),
      completedSets,
      totalVolume: calculateTotalVolume(exercises),
    };
    sessions.push(sessionRecord);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(sessions));
    return sessionRecord;
  } catch (error) {
    console.error('Failed to save workout history:', error);
    return null;
  }
};

export const getExerciseHistory = (exerciseName: string): WorkoutHistory | null => {
  try {
    const history = safeReadArray<WorkoutHistory>(HISTORY_KEY);

    const exerciseRecords = history
      .filter((record) => record.exerciseName.toLowerCase() === exerciseName.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return exerciseRecords[0] || null;
  } catch (error) {
    console.error('Failed to get exercise history:', error);
    return null;
  }
};

export const getPreviousExerciseHistory = (exerciseName: string): WorkoutHistory | null => {
  try {
    const history = safeReadArray<WorkoutHistory>(HISTORY_KEY);

    const exerciseRecords = history
      .filter((record) => record.exerciseName.toLowerCase() === exerciseName.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return exerciseRecords[1] || null;
  } catch (error) {
    console.error('Failed to get previous exercise history:', error);
    return null;
  }
};

export const getAllHistory = (): WorkoutHistory[] => safeReadArray<WorkoutHistory>(HISTORY_KEY);

export const getAllSessions = (): WorkoutSessionRecord[] =>
  safeReadArray<WorkoutSessionRecord>(SESSION_HISTORY_KEY);

export const applyProgressiveOverload = (previousSets: ExerciseSet[]): ExerciseSet[] => {
  return previousSets.map((set) => ({
    ...set,
    weight: set.weight > 0 ? Math.round(set.weight * 1.025 * 2) / 2 : 0,
    completed: false,
  }));
};

const getDefaultWeight = (exerciseName: string): number => {
  const exerciseLower = exerciseName.toLowerCase();

  if (exerciseLower.includes('squat')) return 60;
  if (exerciseLower.includes('deadlift')) return 70;
  if (exerciseLower.includes('leg press')) return 100;
  if (exerciseLower.includes('lunge')) return 40;
  if (exerciseLower.includes('calf')) return 35;
  if (exerciseLower.includes('hip thrust')) return 50;

  if (exerciseLower.includes('bench press')) return 50;
  if (exerciseLower.includes('shoulder press') || exerciseLower.includes('overhead press'))
    return 35;
  if (exerciseLower.includes('push')) return 0;

  if (exerciseLower.includes('pull up') || exerciseLower.includes('chin up')) return 0;
  if (exerciseLower.includes('row')) return 45;
  if (exerciseLower.includes('lat pulldown')) return 50;

  if (exerciseLower.includes('bicep curl') || exerciseLower.includes('curl')) return 12;
  if (exerciseLower.includes('tricep')) return 15;

  if (
    exerciseLower.includes('plank') ||
    exerciseLower.includes('crunch') ||
    exerciseLower.includes('dead bug')
  )
    return 0;
  if (exerciseLower.includes('russian twist')) return 10;

  return 20;
};

export const getRecommendedSets = (
  exerciseName: string,
  defaultSets: number,
  defaultReps: number,
): ExerciseSet[] => {
  const history = exerciseName ? getExerciseHistory(exerciseName) : null;

  if (history && history.setDetails.length > 0) {
    return applyProgressiveOverload(history.setDetails);
  }

  const defaultWeight = getDefaultWeight(exerciseName);

  return Array.from({ length: defaultSets }, () => ({
    weight: defaultWeight,
    reps: defaultReps,
    completed: false,
  }));
};
