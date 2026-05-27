import type { MuscleGroup } from '../domain/workout';
import {
  calculateExerciseVolume,
  getAllSessions,
  normalizeMuscleGroups,
  type WorkoutSessionRecord,
} from '../utils/workoutHistory';
import { estimateOneRepMax, getPersonalRecords } from './workoutAnalytics';
import { buildTrainingContext } from './trainingContext';

export interface ProgressReportGroup {
  group: MuscleGroup;
  label: string;
  sessions: number;
  completedSets: number;
  totalWork: number;
  share: number;
}

export interface ProgressDailyPoint {
  date: string;
  dayLabel: string;
  work: number;
  completedSets: number;
  sessions: number;
  isToday: boolean;
}

export interface ExerciseTrendPoint {
  date: string;
  label: string;
  weight: number;
  reps: number;
  volume: number;
  estimatedOneRepMax: number;
}

export interface ExerciseTrend {
  exercise: string;
  muscleGroup: string;
  sessions: number;
  topWeight: number;
  topVolume: number;
  topEstimatedOneRepMax: number;
  latestEstimatedOneRepMax: number | null;
  points: ExerciseTrendPoint[];
}

export interface ProgressReport {
  totalSessions: number;
  trainingDays: number;
  currentStreak: number;
  thisWeekSessions: number;
  thisMonthSessions: number;
  totalWork: number;
  averageCompletionRate: number;
  weeklyWork: {
    current: number;
    previous: number;
    changePercent: number | null;
    direction: 'up' | 'down' | 'stable' | 'baseline';
  };
  dailyWork: ProgressDailyPoint[];
  muscleGroups: ProgressReportGroup[];
  exerciseTrends: ExerciseTrend[];
  topRecords: ReturnType<typeof getPersonalRecords>;
  recommendations: string[];
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulder',
  'triceps',
  'biceps',
  'core',
  'lower-body',
];

const labelForGroup = (group: MuscleGroup) =>
  group
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const dayKey = (iso: string) => iso.slice(0, 10);

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shortDateLabel = (date: Date) =>
  new Intl.DateTimeFormat('en', { month: '2-digit', day: '2-digit' }).format(date);

const weekdayLabel = (date: Date) =>
  new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).slice(0, 1);

const daysBetween = (from: Date, to: Date) =>
  Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / (24 * 60 * 60 * 1000));

const calculateCurrentStreak = (sessions: WorkoutSessionRecord[]): number => {
  if (sessions.length === 0) return 0;
  const trainedDays = Array.from(new Set(sessions.map((session) => dayKey(session.completedAt))))
    .map((value) => new Date(`${value}T00:00:00.000Z`))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  for (let index = 1; index < trainedDays.length; index += 1) {
    if (daysBetween(trainedDays[index], trainedDays[index - 1]) === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
};

const sessionsSince = (sessions: WorkoutSessionRecord[], now: Date, days: number) => {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return sessions.filter((session) => new Date(session.completedAt).getTime() >= cutoff);
};

const sumWork = (sessions: WorkoutSessionRecord[]) =>
  sessions.reduce((sum, session) => sum + session.totalVolume, 0);

const buildDailyWork = (
  sessions: WorkoutSessionRecord[],
  now: Date,
  days = 7,
): ProgressDailyPoint[] => {
  const today = startOfDay(now);
  return Array.from({ length: days }, (_, index) => addDays(today, index - (days - 1))).map(
    (date) => {
      const key = dateKey(date);
      const daySessions = sessions.filter((session) => dayKey(session.completedAt) === key);
      return {
        date: key,
        dayLabel: weekdayLabel(date),
        work: Math.round(sumWork(daySessions)),
        completedSets: daySessions.reduce((sum, session) => sum + session.completedSets, 0),
        sessions: daySessions.length,
        isToday: key === dateKey(today),
      };
    },
  );
};

const completedExerciseSets = (exercise: WorkoutSessionRecord['exercises'][number]) =>
  (exercise.setDetails ?? []).filter((set) => set.completed);

const buildExerciseTrends = (sessions: WorkoutSessionRecord[]): ExerciseTrend[] => {
  const trends = new Map<string, ExerciseTrend>();
  const oldestFirst = [...sessions].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );

  oldestFirst.forEach((session) => {
    session.exercises.forEach((exercise) => {
      const sets = completedExerciseSets(exercise);
      if (sets.length === 0) return;
      const topWeight = sets.reduce((max, set) => Math.max(max, set.weight), 0);
      const topReps = sets.reduce((max, set) => Math.max(max, set.reps), 0);
      const topEstimatedOneRepMax = sets.reduce(
        (max, set) => Math.max(max, estimateOneRepMax(set.weight, set.reps)),
        0,
      );
      const volume = calculateExerciseVolume(exercise);
      const point: ExerciseTrendPoint = {
        date: dayKey(session.completedAt),
        label: shortDateLabel(new Date(session.completedAt)),
        weight: topWeight,
        reps: topReps,
        volume: Math.round(volume),
        estimatedOneRepMax: topEstimatedOneRepMax,
      };
      const current = trends.get(exercise.name) ?? {
        exercise: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sessions: 0,
        topWeight: 0,
        topVolume: 0,
        topEstimatedOneRepMax: 0,
        latestEstimatedOneRepMax: null,
        points: [],
      };
      current.sessions += 1;
      current.topWeight = Math.max(current.topWeight, topWeight);
      current.topVolume = Math.max(current.topVolume, volume);
      current.topEstimatedOneRepMax = Math.max(
        current.topEstimatedOneRepMax,
        topEstimatedOneRepMax,
      );
      current.latestEstimatedOneRepMax = topEstimatedOneRepMax || current.latestEstimatedOneRepMax;
      current.points.push(point);
      trends.set(exercise.name, current);
    });
  });

  return Array.from(trends.values())
    .map((trend) => ({ ...trend, topVolume: Math.round(trend.topVolume) }))
    .sort((a, b) => b.sessions - a.sessions || b.topEstimatedOneRepMax - a.topEstimatedOneRepMax);
};

const buildWeeklyWork = (sessions: WorkoutSessionRecord[], now: Date) => {
  const currentCutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const previousCutoff = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  const currentSessions = sessions.filter(
    (session) => new Date(session.completedAt).getTime() >= currentCutoff,
  );
  const previousSessions = sessions.filter((session) => {
    const time = new Date(session.completedAt).getTime();
    return time >= previousCutoff && time < currentCutoff;
  });
  const current = sumWork(currentSessions);
  const previous = sumWork(previousSessions);
  const changePercent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

  return {
    current,
    previous,
    changePercent,
    direction:
      changePercent === null
        ? ('baseline' as const)
        : changePercent >= 15
          ? ('up' as const)
          : changePercent <= -15
            ? ('down' as const)
            : ('stable' as const),
  };
};

const buildMuscleGroupReport = (sessions: WorkoutSessionRecord[]): ProgressReportGroup[] => {
  const stats = new Map<
    MuscleGroup,
    { sessions: Set<string>; completedSets: number; totalWork: number }
  >();
  MUSCLE_GROUPS.forEach((group) => {
    stats.set(group, { sessions: new Set(), completedSets: 0, totalWork: 0 });
  });

  sessions.forEach((session) => {
    session.exercises.forEach((exercise) => {
      const groups = normalizeMuscleGroups(exercise.muscleGroup);
      const completedSets = (exercise.setDetails ?? []).filter((set) => set.completed).length;
      const exerciseWork = calculateExerciseVolume(exercise);
      groups.forEach((group) => {
        const current = stats.get(group);
        if (!current) return;
        current.sessions.add(session.id);
        current.completedSets += completedSets;
        current.totalWork += exerciseWork / groups.length;
      });
    });
  });

  const totalWork = Array.from(stats.values()).reduce((sum, item) => sum + item.totalWork, 0);
  return Array.from(stats.entries())
    .map(([group, value]) => ({
      group,
      label: labelForGroup(group),
      sessions: value.sessions.size,
      completedSets: value.completedSets,
      totalWork: Math.round(value.totalWork),
      share: totalWork > 0 ? Math.round((value.totalWork / totalWork) * 100) : 0,
    }))
    .filter((item) => item.sessions > 0 || item.totalWork > 0)
    .sort((a, b) => b.totalWork - a.totalWork);
};

const buildRecommendations = (
  report: Omit<ProgressReport, 'recommendations'>,
  sessions: WorkoutSessionRecord[],
) => {
  if (sessions.length === 0) {
    return ['Complete your first workout to unlock progress analysis.'];
  }

  const recommendations: string[] = [];
  if (report.averageCompletionRate < 70) {
    recommendations.push('Keep the next plan lighter or shorter until completion rate improves.');
  } else if (report.averageCompletionRate >= 90) {
    recommendations.push(
      'Completion is strong. Keep loads similar and look for repeatable form before increasing.',
    );
  } else {
    recommendations.push('Completion is steady. Maintain similar volume before adding more work.');
  }

  if (report.weeklyWork.direction === 'up' && (report.weeklyWork.changePercent ?? 0) >= 25) {
    recommendations.push(
      'This week’s total work jumped quickly; monitor recovery before adding more load.',
    );
  } else if (report.weeklyWork.direction === 'down') {
    recommendations.push(
      'This week’s total work is lower than the previous week; a normal session can rebuild rhythm.',
    );
  }

  const recentContext = buildTrainingContext({ sessions });
  const highFatigueGroups = Object.entries(recentContext.muscleFatigue)
    .filter(([, signal]) => signal?.level === 'high')
    .map(([group]) => labelForGroup(group as MuscleGroup));
  if (highFatigueGroups.length > 0) {
    recommendations.push(
      `${highFatigueGroups.slice(0, 2).join(', ')} recovery looks limited; avoid stacking another maximal session there.`,
    );
  }

  const missingMajorGroup = MUSCLE_GROUPS.find(
    (group) => !report.muscleGroups.some((item) => item.group === group),
  );
  if (missingMajorGroup) {
    recommendations.push(
      `${labelForGroup(missingMajorGroup)} has no logged work yet; consider adding it when it matches your goal.`,
    );
  }

  return recommendations.slice(0, 4);
};

export const buildProgressReport = ({
  sessions = getAllSessions(),
  now = new Date(),
}: {
  sessions?: WorkoutSessionRecord[];
  now?: Date;
} = {}): ProgressReport => {
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
  const thisWeekSessions = sessionsSince(sortedSessions, now, 7);
  const thisMonthSessions = sessionsSince(sortedSessions, now, 30);
  const totalSets = sortedSessions.reduce((sum, session) => sum + session.totalSets, 0);
  const completedSets = sortedSessions.reduce((sum, session) => sum + session.completedSets, 0);

  const reportWithoutRecommendations = {
    totalSessions: sortedSessions.length,
    trainingDays: new Set(sortedSessions.map((session) => dayKey(session.completedAt))).size,
    currentStreak: calculateCurrentStreak(sortedSessions),
    thisWeekSessions: thisWeekSessions.length,
    thisMonthSessions: thisMonthSessions.length,
    totalWork: Math.round(sumWork(sortedSessions)),
    averageCompletionRate: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    weeklyWork: buildWeeklyWork(sortedSessions, now),
    dailyWork: buildDailyWork(sortedSessions, now),
    muscleGroups: buildMuscleGroupReport(sortedSessions),
    exerciseTrends: buildExerciseTrends(sortedSessions).slice(0, 8),
    topRecords: getPersonalRecords(sortedSessions).slice(0, 3),
  } satisfies Omit<ProgressReport, 'recommendations'>;

  return {
    ...reportWithoutRecommendations,
    recommendations: buildRecommendations(reportWithoutRecommendations, sortedSessions),
  };
};
