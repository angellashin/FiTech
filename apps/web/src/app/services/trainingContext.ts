import type { MuscleGroup, TrainingDecision, WorkoutSessionReview } from '../domain/workout';
import {
  getAllSessions,
  normalizeMuscleGroups,
  type WorkoutSessionRecord,
} from '../utils/workoutHistory';

export type FatigueLevel = 'low' | 'moderate' | 'high';

export interface MuscleFatigueSignal {
  level: FatigueLevel;
  score: number;
  recentSets: number;
  recentVolume: number;
  daysSinceLastTrained: number | null;
  recommendedIntensityMultiplier: number;
  reasons: string[];
  averageAdherence: number;
  decision: TrainingDecision;
}

export interface TrainingContext {
  muscleFatigue: Partial<Record<MuscleGroup, MuscleFatigueSignal>>;
  exercisePreferences: {
    avoid: string[];
  };
  recentReviewAverage: number | null;
  summary: string[];
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

const daysBetween = (from: Date, to: Date) =>
  Math.max(0, Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));

const scoreReview = (review: WorkoutSessionReview | undefined) => {
  if (!review) return 0;
  // Lower face ratings represent a worse/tougher session and increase fatigue.
  if (review.rating <= 2) return 2;
  if (review.rating === 3) return 1;
  return -1;
};

const reviewInfluenceLabel = (score: number) => {
  if (score > 0) return 'Recent face-scale review felt tough.';
  if (score < 0) return 'Recent face-scale review was positive.';
  return 'No strong review signal yet.';
};

const buildTrainingDecision = ({
  level,
  averageAdherence,
  reviewScore,
  daysSinceLastTrained,
}: {
  level: FatigueLevel;
  averageAdherence: number;
  reviewScore: number;
  daysSinceLastTrained: number | null;
}): TrainingDecision => {
  const reasons: string[] = [];

  if (daysSinceLastTrained !== null && daysSinceLastTrained <= 1) {
    reasons.push('same muscle group was trained within the last day');
  }
  if (averageAdherence < 70) {
    reasons.push(`recent completion rate was ${averageAdherence}%`);
  } else if (averageAdherence >= 90) {
    reasons.push(`recent completion rate was strong at ${averageAdherence}%`);
  }
  if (reviewScore !== 0) reasons.push(reviewInfluenceLabel(reviewScore));

  if (level === 'high' && (reviewScore > 0 || averageAdherence < 75)) {
    return {
      type: 'deload',
      multiplier: 0.85,
      reasons: reasons.length ? reasons : ['recent training load suggests a conservative deload'],
    };
  }

  if (level === 'high') {
    return {
      type: 'reduce',
      multiplier: 0.9,
      reasons: reasons.length ? reasons : ['recent training load is high'],
    };
  }

  if (level === 'moderate') {
    return {
      type: 'maintain',
      multiplier: 0.95,
      reasons: reasons.length ? reasons : ['recent workload is moderate'],
    };
  }

  return {
    type: 'maintain',
    multiplier: 1,
    reasons: reasons.length
      ? reasons
      : ['carry forward recent working loads; avoid automatic one-session jumps'],
  };
};

export const buildTrainingContext = ({
  sessions = getAllSessions(),
  now = new Date(),
}: {
  sessions?: WorkoutSessionRecord[];
  now?: Date;
} = {}): TrainingContext => {
  const recentCutoff = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  const recentSessions = sessions.filter(
    (session) => new Date(session.completedAt).getTime() >= recentCutoff,
  );
  const summary: string[] = [];
  const muscleFatigue: TrainingContext['muscleFatigue'] = {};
  const ratings = recentSessions.flatMap((session) => session.review?.rating ?? []);

  MUSCLE_GROUPS.forEach((group) => {
    const groupSessions = recentSessions.filter((session) =>
      normalizeMuscleGroups(session.muscleGroup).includes(group),
    );
    if (groupSessions.length === 0) {
      muscleFatigue[group] = {
        level: 'low',
        score: 0,
        recentSets: 0,
        recentVolume: 0,
        daysSinceLastTrained: null,
        recommendedIntensityMultiplier: 1,
        reasons: ['No recent training recorded.'],
        averageAdherence: 0,
        decision: {
          type: 'maintain',
          multiplier: 1,
          reasons: ['No recent training recorded for this muscle group.'],
        },
      };
      return;
    }

    const recentSets = groupSessions.reduce((sum, session) => sum + session.completedSets, 0);
    const recentVolume = groupSessions.reduce((sum, session) => sum + session.totalVolume, 0);
    const lastDate = groupSessions
      .map((session) => new Date(session.completedAt))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const daysSinceLastTrained = daysBetween(lastDate, now);
    const totalPlannedSets = groupSessions.reduce((sum, session) => sum + session.totalSets, 0);
    const averageAdherence =
      totalPlannedSets > 0 ? Math.round((recentSets / totalPlannedSets) * 100) : 0;
    let score = 0;
    const reasons: string[] = [];

    if (recentSets >= 16) {
      score += 3;
      reasons.push(`${recentSets} completed sets in the last 14 days.`);
    } else if (recentSets >= 8) {
      score += 2;
      reasons.push(`${recentSets} completed sets recently.`);
    } else {
      score += 1;
      reasons.push('Light recent workload.');
    }

    if (daysSinceLastTrained <= 1) {
      score += 2;
      reasons.push('Trained this muscle group within the last day.');
    } else if (daysSinceLastTrained <= 3) {
      score += 1;
      reasons.push('Recently trained within three days.');
    }

    const reviewScore = groupSessions.reduce(
      (sum, session) => sum + scoreReview(session.review),
      0,
    );
    if (reviewScore > 0) reasons.push('Recent face-scale reviews indicate the session felt tough.');
    if (reviewScore < 0) reasons.push('Recent face-scale reviews were positive.');
    score += reviewScore;

    if (averageAdherence < 70) {
      score += 1;
      reasons.push(`Recent completion rate was ${averageAdherence}%.`);
    }

    const level: FatigueLevel = score >= 5 ? 'high' : score >= 3 ? 'moderate' : 'low';
    const decision = buildTrainingDecision({
      level,
      averageAdherence,
      reviewScore,
      daysSinceLastTrained,
    });
    const recommendedIntensityMultiplier = decision.multiplier;
    muscleFatigue[group] = {
      level,
      score,
      recentSets,
      recentVolume,
      daysSinceLastTrained,
      recommendedIntensityMultiplier,
      reasons,
      averageAdherence,
      decision,
    };

    if (level !== 'low' || decision.type !== 'maintain') {
      summary.push(
        `${labelForGroup(group)} recommendation: ${decision.type}; load multiplier ${recommendedIntensityMultiplier}.`,
      );
    }
  });

  const equipmentEvents = new Map<string, number>();
  recentSessions.forEach((session) => {
    session.events
      .filter((event) => event.type === 'equipment_occupied' && event.exerciseName)
      .forEach((event) => {
        const name = event.exerciseName as string;
        equipmentEvents.set(name, (equipmentEvents.get(name) ?? 0) + 1);
      });
  });
  const avoid = Array.from(equipmentEvents.entries())
    .filter(([, count]) => count >= 2)
    .map(([name]) => name);
  if (avoid.length > 0) {
    summary.push(`Avoid repeatedly occupied exercises: ${avoid.join(', ')}.`);
  }

  return {
    muscleFatigue,
    exercisePreferences: { avoid },
    recentReviewAverage:
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
        : null,
    summary,
  };
};

export const formatTrainingContextForPrompt = (context: TrainingContext): string => {
  const lines: string[] = [];
  context.summary.forEach((item) => lines.push(`- ${item}`));
  Object.entries(context.muscleFatigue).forEach(([group, signal]) => {
    if (!signal || signal.level === 'low') return;
    lines.push(
      `- ${labelForGroup(group as MuscleGroup)}: ${signal.decision.type} recommendation, load multiplier ${signal.recommendedIntensityMultiplier}. Reasons: ${signal.decision.reasons.join('; ')}.`,
    );
  });
  if (context.recentReviewAverage) {
    lines.push(`- Recent face-scale average: ${context.recentReviewAverage}/5.`);
  }
  return lines.length > 0 ? lines.join('\n') : '- No strong fatigue or preference signals yet.';
};
