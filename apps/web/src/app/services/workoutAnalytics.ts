import type {
  Exercise,
  ExerciseSet,
  WorkoutInsight,
  WorkoutSessionAnalytics,
} from '../domain/workout';
import type { WorkoutSessionRecord } from '../utils/workoutHistory';
import {
  calculateExerciseVolume,
  getAllSessions,
  normalizeMuscleGroups,
} from '../utils/workoutHistory';

const completedSets = (exercise: Exercise): ExerciseSet[] =>
  (exercise.setDetails ?? []).filter((set) => set.completed);

export const estimateOneRepMax = (weight: number, reps: number): number => {
  if (weight <= 0 || reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30));
};

export const calculateAdherenceRate = (
  session: Pick<WorkoutSessionRecord, 'totalSets' | 'completedSets'>,
): number => {
  if (session.totalSets <= 0) return 0;
  return Math.round((session.completedSets / session.totalSets) * 100);
};

export const calculateVolumeByMuscleGroup = (exercises: Exercise[]): Record<string, number> =>
  exercises.reduce<Record<string, number>>((volumeByGroup, exercise) => {
    const group = exercise.muscleGroup || 'Unknown';
    volumeByGroup[group] = (volumeByGroup[group] ?? 0) + calculateExerciseVolume(exercise);
    return volumeByGroup;
  }, {});

export const calculateEstimatedOneRepMaxByExercise = (
  exercises: Exercise[],
): Record<string, number> =>
  exercises.reduce<Record<string, number>>((byExercise, exercise) => {
    const best = completedSets(exercise).reduce(
      (max, set) => Math.max(max, estimateOneRepMax(set.weight, set.reps)),
      0,
    );
    if (best > 0) byExercise[exercise.name] = best;
    return byExercise;
  }, {});

const getSessionVolume = (session: WorkoutSessionRecord): number =>
  typeof session.totalVolume === 'number'
    ? session.totalVolume
    : session.exercises.reduce((sum, exercise) => sum + calculateExerciseVolume(exercise), 0);

const hasComparableMuscleGroup = (
  session: WorkoutSessionRecord,
  target: WorkoutSessionRecord,
): boolean => {
  const targetGroups = new Set(
    normalizeMuscleGroups(
      target.muscleGroup?.length
        ? target.muscleGroup
        : target.exercises.map((exercise) => exercise.muscleGroup),
    ),
  );
  if (targetGroups.size === 0) return true;
  const sessionGroups = normalizeMuscleGroups(
    session.muscleGroup?.length
      ? session.muscleGroup
      : session.exercises.map((exercise) => exercise.muscleGroup),
  );
  return sessionGroups.some((group) => targetGroups.has(group));
};

export const calculateWeeklyVolumeTrend = (
  session: WorkoutSessionRecord,
  previousSessions: WorkoutSessionRecord[],
): {
  currentVolume: number;
  previousAverageVolume: number | null;
  changePercent: number | null;
  direction: 'up' | 'down' | 'stable' | 'baseline';
} => {
  const comparable = previousSessions
    .filter((candidate) => hasComparableMuscleGroup(candidate, session))
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 3);
  const currentVolume = getSessionVolume(session);

  if (comparable.length === 0) {
    return {
      currentVolume,
      previousAverageVolume: null,
      changePercent: null,
      direction: 'baseline',
    };
  }

  const previousAverageVolume =
    comparable.reduce((sum, candidate) => sum + getSessionVolume(candidate), 0) / comparable.length;
  const changePercent =
    previousAverageVolume > 0
      ? Math.round(((currentVolume - previousAverageVolume) / previousAverageVolume) * 100)
      : null;

  return {
    currentVolume,
    previousAverageVolume: Math.round(previousAverageVolume),
    changePercent,
    direction:
      changePercent === null
        ? 'baseline'
        : changePercent >= 10
          ? 'up'
          : changePercent <= -10
            ? 'down'
            : 'stable',
  };
};

export const calculateExerciseProgressionTrend = (
  exerciseName: string,
  sessions: WorkoutSessionRecord[],
): {
  samples: number;
  latestEstimatedOneRepMax: number | null;
  previousEstimatedOneRepMax: number | null;
  direction: 'up' | 'down' | 'stable' | 'insufficient-data';
} => {
  const samples = sessions
    .flatMap((session) =>
      session.exercises
        .filter((exercise) => exercise.name.toLowerCase() === exerciseName.toLowerCase())
        .map((exercise) => ({
          completedAt: session.completedAt,
          estimatedOneRepMax: completedSets(exercise).reduce(
            (max, set) => Math.max(max, estimateOneRepMax(set.weight, set.reps)),
            0,
          ),
        })),
    )
    .filter((sample) => sample.estimatedOneRepMax > 0)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  if (samples.length < 2) {
    return {
      samples: samples.length,
      latestEstimatedOneRepMax: samples[0]?.estimatedOneRepMax ?? null,
      previousEstimatedOneRepMax: null,
      direction: 'insufficient-data',
    };
  }

  const [latest, previous] = samples;
  const diff = latest.estimatedOneRepMax - previous.estimatedOneRepMax;

  return {
    samples: samples.length,
    latestEstimatedOneRepMax: latest.estimatedOneRepMax,
    previousEstimatedOneRepMax: previous.estimatedOneRepMax,
    direction: diff >= 2 ? 'up' : diff <= -2 ? 'down' : 'stable',
  };
};

export const buildWorkoutInsights = (
  session: WorkoutSessionRecord,
  previousSessions: WorkoutSessionRecord[] = getAllSessions().filter(
    (candidate) => candidate.id !== session.id,
  ),
  prs: WorkoutSessionAnalytics['prs'] = [],
): WorkoutInsight[] => {
  const insights: WorkoutInsight[] = [];
  const adherenceRate = calculateAdherenceRate(session);
  const trend = calculateWeeklyVolumeTrend(session, previousSessions);

  if (adherenceRate >= 90) {
    insights.push({
      id: 'completion-strong',
      type: 'consistency',
      severity: 'positive',
      title: 'Strong completion',
      body: `You completed ${adherenceRate}% of planned sets. Keep the next plan close to this level before making bigger jumps.`,
      metricRefs: ['adherenceRate'],
    });
  } else if (adherenceRate >= 70) {
    insights.push({
      id: 'completion-steady',
      type: 'consistency',
      severity: 'neutral',
      title: 'Mostly completed',
      body: `You completed ${adherenceRate}% of planned sets. The next recommendation should stay similar until this feels repeatable.`,
      metricRefs: ['adherenceRate'],
    });
  } else {
    insights.push({
      id: 'completion-caution',
      type: 'consistency',
      severity: 'caution',
      title: 'Keep the next session conservative',
      body: `Completion was ${adherenceRate}%. FiTech should hold or reduce load before trying to progress.`,
      metricRefs: ['adherenceRate'],
    });
  }

  if (trend.direction === 'baseline') {
    insights.push({
      id: 'volume-baseline',
      type: 'progress',
      severity: 'neutral',
      title: 'Baseline recorded',
      body: `Total work was ${Math.round(trend.currentVolume).toLocaleString()}. Repeat a similar session to unlock trend comparisons.`,
      metricRefs: ['totalVolume'],
    });
  } else if (trend.direction === 'up') {
    insights.push({
      id: 'volume-up',
      type: 'recovery',
      severity: 'caution',
      title: 'Workload jumped',
      body: `Total work was about ${trend.changePercent}% above your recent comparable average. Next time, avoid stacking another big increase immediately.`,
      metricRefs: ['totalVolume'],
    });
  } else if (trend.direction === 'down') {
    insights.push({
      id: 'volume-down',
      type: 'next-step',
      severity: 'neutral',
      title: 'Lower workload today',
      body: `Total work was about ${Math.abs(trend.changePercent ?? 0)}% below your recent comparable average. This can be useful after a tough day.`,
      metricRefs: ['totalVolume'],
    });
  } else {
    insights.push({
      id: 'volume-stable',
      type: 'progress',
      severity: 'positive',
      title: 'Workload stayed stable',
      body: 'Total work stayed close to your recent baseline, which is a good setup for sustainable progress.',
      metricRefs: ['totalVolume'],
    });
  }

  if (prs.length > 0) {
    insights.push({
      id: 'records',
      type: 'record',
      severity: 'positive',
      title: `${prs.length} new record signal${prs.length > 1 ? 's' : ''}`,
      body: 'These are compared against previous sessions, not counted from first-time exercises.',
      metricRefs: ['prs'],
    });
  }

  return insights.slice(0, 4);
};

export const buildSessionAnalytics = (
  session: WorkoutSessionRecord,
  previousSessions: WorkoutSessionRecord[] = getAllSessions().filter(
    (candidate) => candidate.id !== session.id,
  ),
): WorkoutSessionAnalytics => {
  const previousByExercise = new Map<
    string,
    { topWeight: number; topVolume: number; topOneRm: number; topReps: number }
  >();

  previousSessions.forEach((previous) => {
    previous.exercises.forEach((exercise) => {
      const sets = completedSets(exercise);
      const current = previousByExercise.get(exercise.name) ?? {
        topWeight: 0,
        topVolume: 0,
        topOneRm: 0,
        topReps: 0,
      };
      const topWeight = sets.reduce((max, set) => Math.max(max, set.weight), 0);
      const topReps = sets.reduce((max, set) => Math.max(max, set.reps), 0);
      const topOneRm = sets.reduce(
        (max, set) => Math.max(max, estimateOneRepMax(set.weight, set.reps)),
        0,
      );
      const topVolume = calculateExerciseVolume(exercise);
      previousByExercise.set(exercise.name, {
        topWeight: Math.max(current.topWeight, topWeight),
        topVolume: Math.max(current.topVolume, topVolume),
        topOneRm: Math.max(current.topOneRm, topOneRm),
        topReps: Math.max(current.topReps, topReps),
      });
    });
  });

  const prs: WorkoutSessionAnalytics['prs'] = [];
  session.exercises.forEach((exercise) => {
    const previous = previousByExercise.get(exercise.name);
    const sets = completedSets(exercise);
    const topWeight = sets.reduce((max, set) => Math.max(max, set.weight), 0);
    const topReps = sets.reduce((max, set) => Math.max(max, set.reps), 0);
    const topOneRm = sets.reduce(
      (max, set) => Math.max(max, estimateOneRepMax(set.weight, set.reps)),
      0,
    );
    const topVolume = calculateExerciseVolume(exercise);

    if (previous && topWeight > 0 && topWeight > previous.topWeight) {
      prs.push({
        exerciseName: exercise.name,
        type: 'weight',
        value: topWeight,
        previousValue: previous.topWeight,
      });
    }
    if (previous && topReps > 0 && topReps > previous.topReps) {
      prs.push({
        exerciseName: exercise.name,
        type: 'reps',
        value: topReps,
        previousValue: previous.topReps,
      });
    }
    if (previous && topOneRm > 0 && topOneRm > previous.topOneRm) {
      prs.push({
        exerciseName: exercise.name,
        type: 'estimated-1rm',
        value: topOneRm,
        previousValue: previous.topOneRm,
      });
    }
    if (previous && topVolume > 0 && topVolume > previous.topVolume) {
      prs.push({
        exerciseName: exercise.name,
        type: 'volume',
        value: topVolume,
        previousValue: previous.topVolume,
      });
    }
  });

  return {
    adherenceRate: calculateAdherenceRate(session),
    volumeByMuscleGroup: calculateVolumeByMuscleGroup(session.exercises),
    estimatedOneRepMaxByExercise: calculateEstimatedOneRepMaxByExercise(session.exercises),
    prs,
    insights: buildWorkoutInsights(session, previousSessions, prs),
  };
};

export const getPersonalRecords = (sessions: WorkoutSessionRecord[] = getAllSessions()) => {
  const records = new Map<
    string,
    {
      exercise: string;
      weight: number;
      reps: number;
      estimatedOneRepMax: number;
      volume: number;
      date: string;
    }
  >();

  sessions.forEach((session) => {
    session.exercises.forEach((exercise) => {
      const sets = completedSets(exercise);
      const topSet = sets.reduce<ExerciseSet | null>((best, set) => {
        if (!best) return set;
        if (estimateOneRepMax(set.weight, set.reps) > estimateOneRepMax(best.weight, best.reps))
          return set;
        return best;
      }, null);
      if (!topSet) return;

      const candidate = {
        exercise: exercise.name,
        weight: topSet.weight,
        reps: topSet.reps,
        estimatedOneRepMax: estimateOneRepMax(topSet.weight, topSet.reps),
        volume: calculateExerciseVolume(exercise),
        date: session.completedAt,
      };
      const previous = records.get(exercise.name);
      if (!previous || candidate.estimatedOneRepMax > previous.estimatedOneRepMax) {
        records.set(exercise.name, candidate);
      }
    });
  });

  return Array.from(records.values()).sort((a, b) => b.estimatedOneRepMax - a.estimatedOneRepMax);
};
