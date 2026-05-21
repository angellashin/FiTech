import type {
  Exercise,
  ExerciseReview,
  ExerciseSet,
  MuscleGroup,
  WorkoutGoal,
  WorkoutPlan,
  WorkoutSessionAnalytics,
  WorkoutSessionReview,
} from '../domain/workout';

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
  schemaVersion: 2;
  startedAt: string;
  completedAt: string;
  goal?: WorkoutGoal;
  muscleGroup?: MuscleGroup[];
  duration?: number;
  planSnapshot?: WorkoutPlan;
  exercises: Exercise[];
  events: WorkoutSessionEvent[];
  totalSets: number;
  completedSets: number;
  totalVolume: number;
  review?: WorkoutSessionReview;
  exerciseReviews?: ExerciseReview[];
  analytics?: WorkoutSessionAnalytics;
}

const HISTORY_KEY = 'fitech_workout_history';
const SESSION_HISTORY_KEY = 'fitech_workout_sessions';
const SAVED_ROUTINES_KEY = 'fitech_saved_routines';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulder',
  'triceps',
  'biceps',
  'core',
  'lower-body',
];

const FACE_RATING_VALUES = [1, 2, 3, 4, 5];

const assertFaceRating = (rating: number): void => {
  if (!FACE_RATING_VALUES.includes(rating)) {
    throw new Error('Review rating must use the 1-5 face scale.');
  }
};

export interface SavedRoutine {
  id: string;
  name: string;
  savedAt: string;
  exercises: Exercise[];
}

const safeReadArray = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return [];
  }
};

const LEGACY_MUSCLE_GROUP_MAP: Record<string, MuscleGroup[]> = {
  'upper-body': ['chest', 'back', 'shoulder', 'biceps', 'triceps'],
  upper: ['chest', 'back', 'shoulder', 'biceps', 'triceps'],
  arms: ['biceps', 'triceps'],
  arm: ['biceps', 'triceps'],
  'full-body': MUSCLE_GROUPS,
  full: MUSCLE_GROUPS,
  legs: ['lower-body'],
  leg: ['lower-body'],
  lower: ['lower-body'],
  'lower-body': ['lower-body'],
};

const isMuscleGroup = (value: unknown): value is MuscleGroup =>
  typeof value === 'string' && MUSCLE_GROUPS.includes(value as MuscleGroup);

const normalizeMuscleGroupValue = (value: unknown): MuscleGroup[] => {
  if (isMuscleGroup(value)) return [value];
  if (typeof value !== 'string') return [];
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
  if (isMuscleGroup(normalized)) return [normalized];
  return LEGACY_MUSCLE_GROUP_MAP[normalized] ?? [];
};

export const normalizeMuscleGroups = (value: unknown): MuscleGroup[] => {
  const groups = (Array.isArray(value) ? value : [value]).flatMap(normalizeMuscleGroupValue);
  const uniqueGroups = Array.from(new Set(groups));
  return uniqueGroups.length > 0 ? uniqueGroups : ['chest'];
};

const normalizeSession = (
  session: Partial<WorkoutSessionRecord> & Record<string, unknown>,
): WorkoutSessionRecord => {
  const exercises = Array.isArray(session.exercises) ? (session.exercises as Exercise[]) : [];
  const events = Array.isArray(session.events) ? (session.events as WorkoutSessionEvent[]) : [];
  const completedSets =
    typeof session.completedSets === 'number'
      ? session.completedSets
      : exercises.reduce((sum, exercise) => sum + getCompletedSets(exercise).length, 0);
  const totalVolume =
    typeof session.totalVolume === 'number' ? session.totalVolume : calculateTotalVolume(exercises);

  return {
    id:
      typeof session.id === 'string' ? session.id : `session_${session.completedAt ?? Date.now()}`,
    schemaVersion: 2,
    startedAt: typeof session.startedAt === 'string' ? session.startedAt : new Date().toISOString(),
    completedAt:
      typeof session.completedAt === 'string' ? session.completedAt : new Date().toISOString(),
    goal: session.goal as WorkoutGoal | undefined,
    muscleGroup: normalizeMuscleGroups(session.muscleGroup),
    duration: typeof session.duration === 'number' ? session.duration : undefined,
    planSnapshot: session.planSnapshot as WorkoutPlan | undefined,
    exercises,
    events,
    totalSets:
      typeof session.totalSets === 'number'
        ? session.totalSets
        : exercises.reduce((sum, exercise) => sum + exercise.sets, 0),
    completedSets,
    totalVolume,
    review: session.review as WorkoutSessionReview | undefined,
    exerciseReviews: Array.isArray(session.exerciseReviews)
      ? (session.exerciseReviews as ExerciseReview[])
      : [],
    analytics: session.analytics as WorkoutSessionAnalytics | undefined,
  };
};

const writeSessions = (sessions: WorkoutSessionRecord[]) => {
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(sessions));
};

export const getSavedRoutines = (): SavedRoutine[] =>
  safeReadArray<SavedRoutine>(SAVED_ROUTINES_KEY);

export const saveRoutine = (name: string, exercises: Exercise[]): SavedRoutine => {
  const routines = getSavedRoutines();
  const routine: SavedRoutine = {
    id: `routine_${Date.now()}`,
    name: name.trim(),
    savedAt: new Date().toISOString(),
    exercises: exercises.map((ex) => ({
      ...ex,
      setDetails: ex.setDetails?.map((s) => ({ ...s, completed: false })) ?? [],
    })),
  };
  routines.push(routine);
  localStorage.setItem(SAVED_ROUTINES_KEY, JSON.stringify(routines));
  return routine;
};

export const deleteRoutine = (id: string): void => {
  const updated = getSavedRoutines().filter((r) => r.id !== id);
  localStorage.setItem(SAVED_ROUTINES_KEY, JSON.stringify(updated));
};

export const updateRoutine = (
  id: string,
  patch: Partial<Omit<SavedRoutine, 'id'>>,
): SavedRoutine | null => {
  const routines = getSavedRoutines();
  const index = routines.findIndex((routine) => routine.id === id);
  if (index === -1) return null;
  const updated = { ...routines[index], ...patch };
  routines[index] = updated;
  localStorage.setItem(SAVED_ROUTINES_KEY, JSON.stringify(routines));
  return updated;
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
  planMeta?: {
    goal?: WorkoutGoal;
    muscleGroup?: MuscleGroup[];
    duration?: number;
    planSnapshot?: WorkoutPlan;
  },
): WorkoutSessionRecord | null => {
  try {
    const history = safeReadArray<WorkoutHistory>(HISTORY_KEY);
    const sessions = getAllSessions();
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
      schemaVersion: 2,
      startedAt,
      completedAt,
      goal: planMeta?.goal,
      muscleGroup: planMeta?.muscleGroup,
      duration: planMeta?.duration,
      planSnapshot: planMeta?.planSnapshot,
      exercises,
      events,
      totalSets: exercises.reduce((sum, exercise) => sum + exercise.sets, 0),
      completedSets,
      totalVolume: calculateTotalVolume(exercises),
      exerciseReviews: [],
    };
    sessions.push(sessionRecord);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    writeSessions(sessions);
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
  safeReadArray<Partial<WorkoutSessionRecord> & Record<string, unknown>>(SESSION_HISTORY_KEY).map(
    normalizeSession,
  );

export const getWorkoutSession = (sessionId: string): WorkoutSessionRecord | null =>
  getAllSessions().find((session) => session.id === sessionId) ?? null;

export const updateWorkoutSession = (
  sessionId: string,
  patch: Partial<WorkoutSessionRecord>,
): WorkoutSessionRecord | null => {
  const sessions = getAllSessions();
  const index = sessions.findIndex((session) => session.id === sessionId);
  if (index === -1) return null;
  const updated = normalizeSession({ ...sessions[index], ...patch });
  sessions[index] = updated;
  writeSessions(sessions);
  return updated;
};

export const saveWorkoutSessionReview = (
  sessionId: string,
  review: Omit<WorkoutSessionReview, 'reviewedAt'>,
): WorkoutSessionRecord | null => {
  assertFaceRating(review.rating);
  return updateWorkoutSession(sessionId, {
    review: { ...review, reviewedAt: new Date().toISOString() },
  });
};

export const saveExerciseReviews = (
  sessionId: string,
  reviews: Array<Omit<ExerciseReview, 'reviewedAt'>>,
): WorkoutSessionRecord | null => {
  reviews.forEach((review) => assertFaceRating(review.rating));
  return updateWorkoutSession(sessionId, {
    exerciseReviews: reviews.map((review) => ({ ...review, reviewedAt: new Date().toISOString() })),
  });
};

export const deleteWorkoutSession = (sessionId: string): void => {
  const sessions = getAllSessions().filter((session) => session.id !== sessionId);
  const history = getAllHistory().filter((record) => record.sessionId !== sessionId);
  writeSessions(sessions);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const clearWorkoutData = (options: { includeRoutines?: boolean } = {}): void => {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(SESSION_HISTORY_KEY);
  if (options.includeRoutines) {
    localStorage.removeItem(SAVED_ROUTINES_KEY);
  }
};

export const carryForwardWorkingSets = (previousSets: ExerciseSet[]): ExerciseSet[] => {
  return previousSets.map((set) => ({
    ...set,
    completed: false,
  }));
};

/**
 * Backward-compatible name retained for older callers/tests.
 *
 * FiTech intentionally no longer auto-increases yesterday's working weight by default:
 * strength does not reliably improve from one completed session to the next. Progression
 * decisions now come from the training-context layer; this helper simply carries forward
 * the last completed working sets as a conservative starting point.
 */
export const applyProgressiveOverload = carryForwardWorkingSets;

const isBodyweightExercise = (exerciseName: string): boolean => {
  const lower = exerciseName.toLowerCase();
  return (
    lower.includes('pull up') ||
    lower.includes('chin up') ||
    lower.includes('push up') ||
    lower.includes('dip') ||
    lower.includes('plank') ||
    lower.includes('crunch') ||
    lower.includes('dead bug') ||
    lower.includes('mountain climber') ||
    lower.includes('bicycle crunch') ||
    lower.includes('leg raise') ||
    lower.includes('hanging knee raise')
  );
};

const getLoadProfileFactor = (exerciseName: string): number => {
  const lower = exerciseName.toLowerCase();
  if (isBodyweightExercise(exerciseName)) return 0;
  if (lower.includes('fly') || lower.includes('raise') || lower.includes('kickback')) return 0.35;
  if (
    lower.includes('curl') ||
    lower.includes('extension') ||
    lower.includes('pushdown') ||
    lower.includes('skull') ||
    lower.includes('calf')
  ) {
    return 0.45;
  }
  if (
    lower.includes('dumbbell') ||
    lower.includes('lunge') ||
    lower.includes('step up') ||
    lower.includes('arnold')
  ) {
    return 0.65;
  }
  if (
    lower.includes('cable') ||
    lower.includes('machine') ||
    lower.includes('pec deck') ||
    lower.includes('pulldown') ||
    lower.includes('landmine')
  ) {
    return 0.75;
  }
  if (lower.includes('leg press') || lower.includes('hip thrust')) return 0.9;
  return 1;
};

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const getMuscleGroupReferenceWeight = (
  muscleGroup: string,
  targetExerciseName: string,
): number | null => {
  const history = safeReadArray<WorkoutHistory>(HISTORY_KEY);
  const groupRecords = history
    .filter((r) => r.muscleGroup.toLowerCase() === muscleGroup.toLowerCase())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);
  if (groupRecords.length === 0) return null;

  const targetFactor = getLoadProfileFactor(targetExerciseName);
  if (targetFactor === 0) return 0;

  const strengthBaseSamples = groupRecords.flatMap((record) => {
    const sourceFactor = getLoadProfileFactor(record.exerciseName);
    if (sourceFactor === 0) return [];
    return record.setDetails
      .filter((set) => set.completed && set.weight > 0)
      .map((set) => set.weight / sourceFactor);
  });

  const referenceStrength = median(strengthBaseSamples);
  if (referenceStrength === null) return null;

  return Math.max(2.5, Math.round((referenceStrength * targetFactor) / 2.5) * 2.5);
};

const getLastSessionWithExercise = (exerciseName: string): WorkoutSessionRecord | null =>
  getAllSessions()
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .find((session) =>
      session.exercises.some((ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()),
    ) ?? null;

export const getRecommendedSets = (
  exerciseName: string,
  defaultSets: number,
  defaultReps: number,
  muscleGroup?: string,
): ExerciseSet[] => {
  // 1. Specific exercise history → carry forward the latest completed working sets,
  // then apply a small progression bump if the last session was well-reviewed.
  const history = exerciseName ? getExerciseHistory(exerciseName) : null;
  if (history && history.setDetails.length > 0) {
    const baseSets = carryForwardWorkingSets(history.setDetails);

    // Review-based progression: if last session felt good AND completion was strong,
    // nudge weight up by one standard increment (2.5 kg).
    const lastSession = getLastSessionWithExercise(exerciseName);
    const rating = lastSession?.review?.rating ?? 0;
    const completionRate =
      lastSession && lastSession.totalSets > 0
        ? lastSession.completedSets / lastSession.totalSets
        : 0;

    if (rating >= 4 && completionRate >= 0.9 && !isBodyweightExercise(exerciseName)) {
      return baseSets.map((set) => ({
        ...set,
        weight: set.weight > 0 ? Math.round((set.weight + 2.5) / 2.5) * 2.5 : set.weight,
      }));
    }

    return baseSets;
  }

  // 2. Same muscle group fallback → start near a familiar recent working load.
  const referenceWeight = muscleGroup
    ? getMuscleGroupReferenceWeight(muscleGroup, exerciseName)
    : null;
  const defaultWeight = isBodyweightExercise(exerciseName) ? 0 : (referenceWeight ?? 20);

  return Array.from({ length: defaultSets }, () => ({
    weight: defaultWeight,
    reps: defaultReps,
    completed: false,
  }));
};
