import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';
import {
  WORKOUT_REVIEW_FACE_OPTIONS,
  type Exercise,
  type ExerciseSet,
  type WorkoutReviewRating,
} from '../domain/workout';
import {
  calculateTotalVolume,
  getPreviousExerciseHistory,
  getWorkoutSession,
  saveRoutine,
  saveWorkoutSessionReview,
  updateWorkoutSession,
} from '../utils/workoutHistory';
import { buildSessionAnalytics } from '../services/workoutAnalytics';
import { WorkoutReviewFaceIcon } from './WorkoutReviewFaceIcon';

interface WorkoutCompleteProps {
  sessionId: string;
  exercises: Exercise[];
  onBackToHome: () => void;
}

interface ExerciseComparison {
  name: string;
  muscleGroup: string;
  previousWeight: number;
  currentWeight: number;
  weightDiff: number;
  weightDiffPercent: string;
  isImprovement: boolean;
  isEqual: boolean;
}

const getTrackedSets = (exercise: Exercise): ExerciseSet[] => {
  if (!exercise.setDetails?.length) return [];
  const completedSets = exercise.setDetails.filter((set) => set.completed);
  return completedSets.length > 0 ? completedSets : exercise.setDetails;
};

const getTopWeight = (sets: ExerciseSet[]) => {
  if (sets.length === 0) return 0;
  return Math.max(...sets.map((set) => set.weight));
};

const buildComparisons = (exercises: Exercise[]): ExerciseComparison[] => {
  return exercises.flatMap((exercise) => {
    const previous = getPreviousExerciseHistory(exercise.name);
    if (!previous) return [];

    const currentWeight = getTopWeight(getTrackedSets(exercise));
    const previousWeight = getTopWeight(previous.setDetails);
    const weightDiff = currentWeight - previousWeight;
    const weightDiffPercent =
      previousWeight > 0 ? ((weightDiff / previousWeight) * 100).toFixed(1) : '0.0';

    return [
      {
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        previousWeight,
        currentWeight,
        weightDiff,
        weightDiffPercent,
        isImprovement: weightDiff > 0,
        isEqual: weightDiff === 0,
      },
    ];
  });
};

export function WorkoutComplete({ sessionId, exercises, onBackToHome }: WorkoutCompleteProps) {
  const [routineName, setRoutineName] = useState('');
  const [saved, setSaved] = useState(false);
  const [sessionRating, setSessionRating] = useState<WorkoutReviewRating | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);

  const handleSaveRoutine = () => {
    if (!routineName.trim()) return;
    saveRoutine(routineName, exercises);
    setSaved(true);
  };

  const handleSaveReview = () => {
    if (!sessionId || !sessionRating) return;
    const reviewedSession = saveWorkoutSessionReview(sessionId, {
      rating: sessionRating,
      notes: reviewNotes.trim() || undefined,
    });
    const latestSession = reviewedSession ?? getWorkoutSession(sessionId);
    const enrichedSession = latestSession
      ? (updateWorkoutSession(latestSession.id, {
          analytics: buildSessionAnalytics(latestSession),
        }) ?? latestSession)
      : null;
    void import('../services/supabaseWorkoutSync')
      .then(({ syncWorkoutSessionToSupabase }) => syncWorkoutSessionToSupabase(enrichedSession))
      .catch((error) => console.warn('Unable to sync workout review:', error));
    setReviewSaved(true);
  };

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completedSets = exercises.reduce(
    (sum, ex) => sum + getTrackedSets(ex).filter((set) => set.completed).length,
    0,
  );
  const totalVolume = calculateTotalVolume(exercises);
  const comparisons = buildComparisons(exercises);
  const hasComparisons = comparisons.length > 0;
  const analytics = useMemo(
    () =>
      buildSessionAnalytics({
        id: sessionId,
        schemaVersion: 2,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        exercises,
        events: [],
        totalSets,
        completedSets,
        totalVolume,
        review: sessionRating
          ? {
              rating: sessionRating,
              notes: reviewNotes.trim() || undefined,
              reviewedAt: new Date().toISOString(),
            }
          : undefined,
      }),
    [completedSets, exercises, reviewNotes, sessionId, sessionRating, totalSets, totalVolume],
  );

  const stats = [
    {
      label: 'Completed Sets',
      value: `${completedSets}/${totalSets}`,
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      label: 'Exercises',
      value: exercises.length.toString(),
      icon: Flame,
      color: 'text-orange-500',
    },
    {
      label: 'Total Work',
      value: Math.round(totalVolume).toLocaleString(),
      icon: BarChart3,
      color: 'text-blue-500',
    },
  ];

  return (
    <div className="size-full flex flex-col bg-neutral-950 overflow-auto">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Workout Complete!</h1>
            <p className="text-neutral-400">Great job staying focused</p>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50">
            <div className="text-sm text-neutral-400 mb-4">Today's Performance</div>
            <div className="space-y-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between glass-dark rounded-xl p-4 shadow-lg hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center shadow-lg">
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div className="text-neutral-300">{stat.label}</div>
                    </div>
                    <div className="text-xl font-bold">{stat.value}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="glass-dark rounded-xl p-3">
                <div className="text-neutral-500 mb-1">Completion Rate</div>
                <div className="text-lg font-bold text-emerald-400">{analytics.adherenceRate}%</div>
                <div className="text-[11px] text-neutral-600 mt-1">Completed / planned sets</div>
              </div>
              <div className="glass-dark rounded-xl p-3">
                <div className="text-neutral-500 mb-1">New Records</div>
                <div className="text-lg font-bold text-yellow-400">{analytics.prs.length}</div>
                <div className="text-[11px] text-neutral-600 mt-1">Compared with past sessions</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-950/40 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <div className="text-sm text-blue-200">Quick Review</div>
            </div>
            <h3 className="text-lg font-semibold mb-2">How did this workout feel?</h3>
            <p className="text-xs text-neutral-400 mb-4">
              One face captures the overall feel — difficulty, condition, energy, and satisfaction.
            </p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {WORKOUT_REVIEW_FACE_OPTIONS.map((item) => (
                <button
                  key={item.rating}
                  type="button"
                  aria-label={item.ariaLabel}
                  aria-pressed={sessionRating === item.rating}
                  onClick={() => setSessionRating(item.rating)}
                  className={`rounded-2xl p-2 border transition-all ${
                    sessionRating === item.rating
                      ? 'border-blue-400 bg-blue-500/20 scale-105'
                      : 'border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800'
                  }`}
                >
                  <WorkoutReviewFaceIcon rating={item.rating} className="w-8 h-8 mx-auto" />
                </button>
              ))}
            </div>
            <textarea
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              placeholder="Optional note: pain, form, energy, or anything to remember"
              maxLength={160}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-blue-500 min-h-20 mb-4"
            />
            <button
              type="button"
              onClick={handleSaveReview}
              disabled={!sessionRating || reviewSaved}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 py-3 text-sm font-semibold transition-all"
            >
              {reviewSaved ? 'Review saved for future plans' : 'Save Review'}
            </button>
          </div>

          {hasComparisons && (
            <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <div className="relative">
                <div className="text-sm text-neutral-400 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Performance Comparison
                </div>
                <div className="space-y-3">
                  {comparisons.map((comp, index) => (
                    <div key={index} className="glass-dark rounded-xl p-4 shadow-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-white">{comp.name}</div>
                          <div className="text-xs text-neutral-500">{comp.muscleGroup}</div>
                        </div>
                        <div
                          className={`flex items-center gap-1 text-sm font-semibold ${
                            comp.isImprovement
                              ? 'text-green-400'
                              : comp.isEqual
                                ? 'text-neutral-400'
                                : 'text-orange-400'
                          }`}
                        >
                          {comp.isImprovement ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : comp.isEqual ? (
                            <Minus className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          <span>{comp.weightDiffPercent}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-neutral-400">
                          Previous:{' '}
                          <span className="text-neutral-300 font-medium">
                            {comp.previousWeight.toFixed(1)} kg
                          </span>
                        </div>
                        <div className="text-neutral-400">
                          Today:{' '}
                          <span className="text-white font-medium">
                            {comp.currentWeight.toFixed(1)} kg
                          </span>
                        </div>
                      </div>
                      {comp.weightDiff !== 0 && (
                        <div
                          className={`text-xs mt-2 ${comp.isImprovement ? 'text-green-400' : 'text-orange-400'}`}
                        >
                          {comp.isImprovement ? '+' : ''}
                          {comp.weightDiff.toFixed(1)} kg difference
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!hasComparisons && (
            <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <div className="relative">
                <div className="text-sm text-neutral-400 mb-4">Progress Insight</div>
                <div className="glass-dark rounded-xl p-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/50">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="text-sm">
                      <p className="text-white mb-1">
                        <span className="font-semibold">First comparable workout recorded!</span>
                      </p>
                      <p className="text-neutral-400">
                        Repeat these exercises to unlock previous-vs-current strength trend
                        insights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50">
            {saved ? (
              <div className="flex items-center justify-center gap-3 py-2 text-green-400">
                <BookmarkCheck className="w-5 h-5" />
                <span className="font-medium">"{routineName}" saved to My Routines!</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Bookmark className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-neutral-400">Save this routine for later?</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRoutine()}
                    placeholder="e.g. Push Day A"
                    maxLength={40}
                    className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSaveRoutine}
                    disabled={!routineName.trim()}
                    className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-sm font-medium transition-all"
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="w-full bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 text-white rounded-2xl py-5 font-semibold transition-all shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-[1.02] active:scale-[0.98]"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
