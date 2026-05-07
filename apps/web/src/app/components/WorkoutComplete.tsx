import {
  CheckCircle2,
  TrendingUp,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
} from 'lucide-react';
import type { Exercise, ExerciseSet } from '../domain/workout';
import { calculateTotalVolume, getPreviousExerciseHistory } from '../utils/workoutHistory';

interface WorkoutCompleteProps {
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

export function WorkoutComplete({ exercises, onBackToHome }: WorkoutCompleteProps) {
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completedSets = exercises.reduce(
    (sum, ex) => sum + getTrackedSets(ex).filter((set) => set.completed).length,
    0,
  );
  const totalVolume = calculateTotalVolume(exercises);
  const comparisons = buildComparisons(exercises);
  const hasComparisons = comparisons.length > 0;

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
      label: 'Volume Score',
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
                        Repeat these exercises to unlock previous-vs-current progressive overload
                        insights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
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
