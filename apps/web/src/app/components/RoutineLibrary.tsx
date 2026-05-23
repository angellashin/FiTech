import { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  RotateCcw,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  getSavedRoutines,
  deleteRoutine,
  reorderRoutines,
} from '../utils/workoutHistory';
import type { SavedRoutine } from '../utils/workoutHistory';
import type { MuscleGroup, WorkoutPlan, WorkoutIntensity } from '../domain/workout';
import { INTENSITY_MULTIPLIER } from '../domain/workout';

interface RoutineLibraryProps {
  onBack: () => void;
  onLoadPlan: (plan: WorkoutPlan) => void;
}

const INTENSITY_OPTIONS: { value: WorkoutIntensity; label: string; sub: string; color: string }[] = [
  { value: 'very-light', label: 'Very Light', sub: '×0.80', color: 'from-sky-700 to-sky-800 border-sky-600' },
  { value: 'light',      label: 'Light',      sub: '×0.90', color: 'from-blue-700 to-blue-800 border-blue-600' },
  { value: 'normal',     label: 'Normal',     sub: '×1.00', color: 'from-green-700 to-green-800 border-green-600' },
  { value: 'hard',       label: 'Hard',       sub: '×1.10', color: 'from-orange-700 to-orange-800 border-orange-600' },
  { value: 'very-hard',  label: 'Very Hard',  sub: '×1.20', color: 'from-red-700 to-red-800 border-red-600' },
];

const applyIntensity = (routine: SavedRoutine, intensity: WorkoutIntensity): WorkoutPlan => {
  const multiplier = INTENSITY_MULTIPLIER[intensity];
  const muscleGroups = [...new Set(routine.exercises.map((e) => e.muscleGroup as MuscleGroup))];
  return {
    goal: 'strength',
    muscleGroup: muscleGroups.length > 0 ? muscleGroups : ['chest'],
    duration: 45,
    exercises: routine.exercises.map((ex) => ({
      ...ex,
      setDetails: ex.setDetails?.map((s) => ({
        ...s,
        weight: s.weight === 0 ? 0 : Math.round((s.weight * multiplier) / 2.5) * 2.5,
      })),
    })),
  };
};

export function RoutineLibrary({ onBack, onLoadPlan }: RoutineLibraryProps) {
  const [routines, setRoutines] = useState<SavedRoutine[]>(() => getSavedRoutines());
  const [routineToDelete, setRoutineToDelete] = useState<{ id: string; name: string } | null>(null);
  const [loadingRoutine, setLoadingRoutine] = useState<SavedRoutine | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<WorkoutIntensity>('normal');

  const move = (index: number, direction: 'up' | 'down') => {
    const next = [...routines];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderRoutines(next);
    setRoutines(next);
  };

  const handleDelete = (id: string) => {
    deleteRoutine(id);
    setRoutines(getSavedRoutines());
    setRoutineToDelete(null);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-blue-400" />
          <h1 className="text-xl font-bold">My Routines</h1>
        </div>
        <span className="ml-auto text-sm text-neutral-500">{routines.length} saved</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {routines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-neutral-500 text-sm gap-2">
            <Bookmark className="w-10 h-10 text-neutral-700" />
            <p>No routines saved yet.</p>
            <p className="text-xs text-neutral-600">Complete a workout and save it from the home screen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routines.map((routine, index) => (
              <div key={routine.id} className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-semibold truncate">{routine.name}</div>
                    <div className="text-sm text-neutral-400 mt-0.5">
                      {routine.exercises.length} exercises · {[...new Set(routine.exercises.map((e) => e.muscleGroup))].join(', ')}
                    </div>
                  </div>
                  {/* Up / Down / Delete */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => move(index, 'up')}
                      disabled={index === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-neutral-500 hover:text-neutral-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => move(index, 'down')}
                      disabled={index === routines.length - 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-neutral-500 hover:text-neutral-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRoutineToDelete({ id: routine.id, name: routine.name })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors"
                      aria-label="Delete routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Exercise preview */}
                <div className="space-y-1 mb-3">
                  {routine.exercises.slice(0, 4).map((ex, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-300 truncate">{ex.name}</span>
                      <span className="text-neutral-500 ml-2 flex-shrink-0">{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                  {routine.exercises.length > 4 && (
                    <div className="text-xs text-neutral-600">+{routine.exercises.length - 4} more</div>
                  )}
                </div>

                <button
                  onClick={() => { setLoadingRoutine(routine); setSelectedIntensity('normal'); }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl py-2.5 text-sm font-medium transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Load Routine
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Load Routine — Intensity Picker ── */}
      {loadingRoutine && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setLoadingRoutine(null)}
          />
          <div className="relative bg-neutral-900 rounded-t-3xl shadow-2xl pb-8">
            <div className="w-10 h-1 rounded-full bg-neutral-700 mx-auto mt-4 mb-4" />
            <div className="px-6 mb-5">
              <h2 className="text-lg font-semibold">{loadingRoutine.name}</h2>
              <p className="text-sm text-neutral-400 mt-0.5">
                {loadingRoutine.exercises.length} exercises · Set today's intensity
              </p>
            </div>
            <div className="px-6 mb-6">
              <div className="grid grid-cols-5 gap-2">
                {INTENSITY_OPTIONS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSelectedIntensity(item.value)}
                    className={`py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${
                      selectedIntensity === item.value
                        ? `bg-gradient-to-br ${item.color} text-white shadow-lg scale-[1.04]`
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    <span className="text-[11px] font-semibold leading-tight text-center px-0.5">
                      {item.label}
                    </span>
                    <span className={`text-[10px] ${selectedIntensity === item.value ? 'text-white/70' : 'text-neutral-600'}`}>
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-6">
              <button
                onClick={() => setLoadingRoutine(null)}
                className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onLoadPlan(applyIntensity(loadingRoutine, selectedIntensity));
                  setLoadingRoutine(null);
                }}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
              >
                Start Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {routineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm bg-neutral-900 rounded-2xl p-6 border border-neutral-700 shadow-2xl">
            <h2 className="text-lg font-semibold mb-2">Delete routine?</h2>
            <p className="text-sm text-neutral-400 mb-6">
              "{routineToDelete.name}" will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRoutineToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(routineToDelete.id)}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
