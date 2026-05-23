import { useState } from 'react';
import {
  Dumbbell,
  History,
  TrendingUp,
  Headphones,
  User,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Bookmark,
  Trash2,
  CalendarDays,
  Edit2,
  Plus,
  X,
  ChevronLeft,
} from 'lucide-react';
import { getAllSessions, getSavedRoutines, deleteRoutine, updateRoutine, saveRoutine } from '../utils/workoutHistory';
import type { WorkoutSessionRecord, SavedRoutine } from '../utils/workoutHistory';
import type { MuscleGroup, WorkoutPlan, Exercise } from '../domain/workout';
import { exerciseLibrary } from '../services/workoutPlanner';
import type { ExerciseTemplate } from '../services/workoutPlanner';

interface HomeProps {
  onStartWorkout: () => void;
  onGoToProfile: () => void;
  onLoadPlan: (plan: WorkoutPlan) => void;
  onViewHistory: () => void;
  onViewProgressReport: () => void;
}

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getSessionLabel = (session: WorkoutSessionRecord): string => {
  const groups = Array.isArray(session.muscleGroup)
    ? session.muscleGroup
    : session.muscleGroup
      ? [session.muscleGroup]
      : [];
  const groupLabel = groups
    .map((g) => g.charAt(0).toUpperCase() + g.slice(1).replace('-', ' '))
    .join(' & ');
  return groupLabel ? `${groupLabel} Workout` : 'Workout';
};

const getDurationLabel = (session: WorkoutSessionRecord): string => {
  const start = new Date(session.startedAt).getTime();
  const end = new Date(session.completedAt).getTime();
  const mins = Math.round((end - start) / 60000);
  return `${mins} min`;
};

const sessionToPlan = (session: WorkoutSessionRecord): WorkoutPlan => {
  const muscleGroup: MuscleGroup[] = session.muscleGroup?.length ? session.muscleGroup : ['chest'];
  return {
    goal: session.goal ?? 'strength',
    muscleGroup,
    duration: session.duration ?? 45,
    exercises: session.exercises.map((ex) => ({
      ...ex,
      setDetails: ex.setDetails?.map((s) => ({ ...s, completed: false })),
    })),
  };
};

const routineToPlan = (routine: SavedRoutine): WorkoutPlan => ({
  goal: 'strength',
  muscleGroup: ['chest'],
  duration: 45,
  exercises: routine.exercises,
});

export function Home({
  onStartWorkout,
  onGoToProfile,
  onLoadPlan,
  onViewHistory,
  onViewProgressReport,
}: HomeProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>(() => getSavedRoutines());

  // Save-as-routine state (for Recent Workouts)
  const [savingRoutineId, setSavingRoutineId] = useState<string | null>(null);
  const [routineSaveName, setRoutineSaveName] = useState('');
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  // Routine edit state
  const [editingRoutine, setEditingRoutine] = useState<SavedRoutine | null>(null);
  const [editName, setEditName] = useState('');
  const [editExercises, setEditExercises] = useState<Exercise[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addFilter, setAddFilter] = useState<MuscleGroup | 'all'>('all');
  const [routineToDelete, setRoutineToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleSaveAsRoutine = (session: WorkoutSessionRecord) => {
    const name = routineSaveName.trim() || getSessionLabel(session);
    saveRoutine(name, session.exercises);
    setSavedRoutines(getSavedRoutines());
    setSavingRoutineId(null);
    setRoutineSaveName('');
    setJustSavedId(session.id);
    setTimeout(() => setJustSavedId(null), 2000);
  };

  const handleDeleteRoutine = (id: string) => {
    deleteRoutine(id);
    setSavedRoutines(getSavedRoutines());
    setRoutineToDelete(null);
  };

  const openEditRoutine = (routine: SavedRoutine) => {
    setEditingRoutine(routine);
    setEditName(routine.name);
    setEditExercises([...routine.exercises]);
    setShowAddExercise(false);
    setAddFilter('all');
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setEditExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  };

  const handleAddExercise = (template: ExerciseTemplate) => {
    const newExercise: Exercise = {
      id: `${template.name.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`,
      name: template.name,
      sets: template.sets,
      reps: template.reps,
      restTime: template.restTime,
      muscleGroup: template.muscleGroup,
      setDetails: Array.from({ length: template.sets }, () => ({
        weight: 0,
        reps: template.reps,
        completed: false,
      })),
    };
    setEditExercises((prev) => [...prev, newExercise]);
  };

  const handleSaveRoutine = () => {
    if (!editingRoutine) return;
    updateRoutine(editingRoutine.id, {
      name: editName.trim() || editingRoutine.name,
      exercises: editExercises,
    });
    setSavedRoutines(getSavedRoutines());
    setEditingRoutine(null);
  };

  const muscleGroupKeys = Object.keys(exerciseLibrary) as MuscleGroup[];

  const filteredLibraryExercises =
    addFilter === 'all'
      ? muscleGroupKeys.flatMap((g) => exerciseLibrary[g])
      : (exerciseLibrary[addFilter] ?? []);

  const allSessions = getAllSessions();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const thisWeekCount = allSessions.filter((s) => new Date(s.completedAt) >= weekAgo).length;
  const thisMonthCount = allSessions.filter((s) => new Date(s.completedAt) >= monthAgo).length;
  const totalCount = allSessions.length;

  const recentWorkouts = [...allSessions]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 3);

  return (
    <div className="relative size-full flex flex-col bg-gradient-to-b from-[#0a0a0a] from-[8%] to-[#707070] to-[95%] overflow-auto">
      <header className="px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
              <Dumbbell className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">FiTech</h1>
              <p className="text-sm text-neutral-400">Screenless Fitness</p>
            </div>
          </div>
          <button
            onClick={onGoToProfile}
            className="w-12 h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            <User className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="flex-1 px-6 pb-6 flex flex-col gap-6">
        <button
          onClick={onStartWorkout}
          className="w-full bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 text-white rounded-2xl py-6 px-8 flex items-center justify-between transition-all shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="text-left">
            <div className="text-lg font-semibold mb-1">Start New Workout</div>
            <div className="text-sm text-blue-100">AI-powered plan generation</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <Dumbbell className="w-7 h-7" />
          </div>
        </button>

        {/* Your Progress */}
        <button
          type="button"
          onClick={onViewProgressReport}
          className="w-full text-left bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 shadow-xl border border-neutral-800/50 hover:border-blue-500/30 hover:bg-neutral-900 transition-all"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Your Progress</h2>
              <p className="text-xs text-neutral-500">Tap for full progress report</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
              <div className="text-2xl font-bold text-blue-400">{thisWeekCount}</div>
              <div className="text-xs text-neutral-400 mt-1">This Week</div>
            </div>
            <div className="text-center bg-green-500/5 rounded-xl p-3 border border-green-500/10">
              <div className="text-2xl font-bold text-green-400">{thisMonthCount}</div>
              <div className="text-xs text-neutral-400 mt-1">This Month</div>
            </div>
            <div className="text-center bg-purple-500/5 rounded-xl p-3 border border-purple-500/10">
              <div className="text-2xl font-bold text-purple-400">{totalCount}</div>
              <div className="text-xs text-neutral-400 mt-1">Total</div>
            </div>
          </div>
        </button>

        {/* My Routines */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 shadow-xl border border-neutral-800/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold">My Routines</h2>
          </div>
          {savedRoutines.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-sm">
              No routines saved yet. Complete a workout and save it!
            </div>
          ) : (
            <div className="space-y-3">
              {savedRoutines.map((routine) => (
                <div key={routine.id} className="glass-dark rounded-xl p-4 shadow-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{routine.name}</div>
                      <div className="text-sm text-neutral-400 mt-0.5">
                        {routine.exercises.length} exercises
                        {' · '}
                        {routine.exercises
                          .map((e) => e.muscleGroup)
                          .filter((v, i, a) => a.indexOf(v) === i)
                          .join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditRoutine(routine)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-500/20 text-neutral-500 hover:text-blue-400 transition-colors"
                        aria-label="Edit routine"
                      >
                        <Edit2 className="w-4 h-4" />
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
                  <button
                    onClick={() => onLoadPlan(routineToPlan(routine))}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl py-3 text-sm font-medium transition-all mt-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Load Routine
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Workouts */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 shadow-xl border border-neutral-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                <History className="w-5 h-5 text-neutral-400" />
              </div>
              <h2 className="text-lg font-semibold">Recent Workouts</h2>
            </div>
            <button
              onClick={onViewHistory}
              className="flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
            >
              <CalendarDays className="w-4 h-4" />
              View all
            </button>
          </div>
          <div className="space-y-3">
            {recentWorkouts.length === 0 ? (
              <div className="text-center py-6 text-neutral-500 text-sm">
                No workouts yet. Start your first one!
              </div>
            ) : (
              recentWorkouts.map((session) => {
                const isExpanded = expandedId === session.id;
                return (
                  <div key={session.id} className="glass-dark rounded-xl overflow-hidden shadow-lg">
                    <button
                      className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all group"
                      onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    >
                      <div className="text-left">
                        <div className="font-medium mb-1 group-hover:text-blue-400 transition-colors">
                          {getSessionLabel(session)}
                        </div>
                        <div className="text-sm text-neutral-400">
                          {getDurationLabel(session)} • {session.exercises.length} exercises
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-neutral-500">
                          {formatDate(session.completedAt)}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-neutral-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-neutral-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-white/5 px-4 pb-4 pt-3">
                        <div className="space-y-2 mb-4">
                          {session.exercises.map((ex, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-neutral-300">{ex.name}</span>
                              <span className="text-neutral-500">
                                {ex.sets} sets × {ex.reps} reps
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => onLoadPlan(sessionToPlan(session))}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl py-3 text-sm font-medium transition-all"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Load This Workout
                        </button>

                        {/* Save as Routine */}
                        {justSavedId === session.id ? (
                          <div className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl py-3 text-sm font-medium">
                            <Bookmark className="w-4 h-4 fill-emerald-400" />
                            Saved to My Routines!
                          </div>
                        ) : savingRoutineId === session.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={routineSaveName}
                              onChange={(e) => setRoutineSaveName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveAsRoutine(session);
                                if (e.key === 'Escape') { setSavingRoutineId(null); setRoutineSaveName(''); }
                              }}
                              placeholder={getSessionLabel(session)}
                              autoFocus
                              className="flex-1 bg-neutral-800 border border-neutral-600 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              onClick={() => handleSaveAsRoutine(session)}
                              className="px-4 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-400 rounded-xl text-sm font-medium transition-all"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setSavingRoutineId(null); setRoutineSaveName(''); }}
                              className="px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 rounded-xl text-sm transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSavingRoutineId(session.id); setRoutineSaveName(''); }}
                            className="w-full flex items-center justify-center gap-2 bg-neutral-800/60 hover:bg-neutral-700/60 border border-neutral-700/50 text-neutral-400 hover:text-neutral-200 rounded-xl py-3 text-sm font-medium transition-all"
                          >
                            <Bookmark className="w-4 h-4" />
                            Save as Routine
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Earbud Controls */}
        <div
          className="relative rounded-2xl p-6 border border-blue-500/20 shadow-xl overflow-hidden"
          style={{
            backgroundImage:
              'linear-gradient(129.61deg, rgba(22, 36, 86, 0.4) 0%, rgb(23, 23, 23) 50%, rgb(10, 10, 10) 100%)',
          }}
        >
          <div
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(129.593deg, rgba(43, 127, 255, 0.05) 0%, rgba(0, 0, 0, 0) 100%)',
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center backdrop-blur-sm">
                <Headphones className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold">Earbud Controls</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 glass-dark rounded-xl p-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center flex-shrink-0 relative shadow-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 absolute animate-pulse" />
                  <div className="w-3 h-3 rounded-full bg-blue-500 relative shadow-lg shadow-blue-500/50" />
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-0.5 text-sm">Single Tap</div>
                  <div className="text-xs text-neutral-400">Complete set & start/skip rest</div>
                </div>
              </div>
              <div className="flex items-start gap-3 glass-dark rounded-xl p-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center flex-shrink-0 relative shadow-lg">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                    <div
                      className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"
                      style={{ animationDelay: '0.15s' }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-0.5 text-sm">Double Tap</div>
                  <div className="text-xs text-neutral-400">Skip current exercise</div>
                </div>
              </div>
              <div className="flex items-start gap-3 glass-dark rounded-xl p-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center flex-shrink-0 relative shadow-lg">
                  <div className="flex gap-0.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50" />
                    <div
                      className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-0.5 text-sm">Triple Tap</div>
                  <div className="text-xs text-neutral-400">
                    Move to next position (machine occupied)
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="text-xs text-blue-300/80 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                <span>Hands-free control for uninterrupted flow</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    {/* ── Edit Routine Bottom Sheet ── */}
    {editingRoutine && (
      <div className="absolute inset-0 z-50 flex flex-col justify-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setEditingRoutine(null)}
        />

        {/* Sheet */}
        <div className="relative bg-neutral-900 rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Drag handle */}
          <div className="w-10 h-1 rounded-full bg-neutral-700 mx-auto mt-4 mb-1 flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 flex-shrink-0 border-b border-neutral-800">
            {showAddExercise ? (
              <button
                onClick={() => setShowAddExercise(false)}
                className="flex items-center gap-2 text-blue-400 text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <h2 className="text-lg font-semibold">Edit Routine</h2>
            )}
            <button
              onClick={() => setEditingRoutine(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-6 py-4">
            {!showAddExercise ? (
              /* ─── EDIT MODE ─── */
              <div className="space-y-4">
                {/* Name input */}
                <div>
                  <label className="text-sm text-neutral-400 block mb-2">Routine Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={40}
                    className="w-full bg-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>

                {/* Exercise list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-400">
                      Exercises ({editExercises.length})
                    </span>
                  </div>
                  {editExercises.length === 0 ? (
                    <div className="text-center py-6 text-neutral-500 text-sm rounded-xl border border-dashed border-neutral-700">
                      No exercises. Add some below.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editExercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex items-center gap-3 bg-neutral-800/60 rounded-xl px-4 py-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{exercise.name}</div>
                            <div className="text-xs text-neutral-400">
                              {exercise.muscleGroup} · {exercise.sets}×{exercise.reps}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveExercise(exercise.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add exercise button */}
                <button
                  onClick={() => setShowAddExercise(true)}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-blue-500/40 hover:border-blue-500/70 text-blue-400 hover:text-blue-300 rounded-xl py-3 text-sm font-medium transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Exercise
                </button>
              </div>
            ) : (
              /* ─── ADD EXERCISE MODE ─── */
              <div className="space-y-4">
                {/* Muscle group filter pills */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAddFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      addFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    All
                  </button>
                  {muscleGroupKeys.map((g) => (
                    <button
                      key={g}
                      onClick={() => setAddFilter(g)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                        addFilter === g
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {g.replace('-', ' ')}
                    </button>
                  ))}
                </div>

                {/* Exercise list */}
                <div className="space-y-2">
                  {filteredLibraryExercises.map((template) => {
                    const alreadyAdded = editExercises.some((e) => e.name === template.name);
                    return (
                      <div
                        key={template.name}
                        className="flex items-center gap-3 bg-neutral-800/60 rounded-xl px-4 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{template.name}</div>
                          <div className="text-xs text-neutral-400">
                            {template.muscleGroup} · {template.sets}×{template.reps}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (!alreadyAdded) handleAddExercise(template);
                          }}
                          disabled={alreadyAdded}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                            alreadyAdded
                              ? 'text-neutral-600 cursor-not-allowed'
                              : 'hover:bg-blue-500/20 text-neutral-400 hover:text-blue-400'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons — only shown in edit mode */}
          {!showAddExercise && (
            <div className="flex gap-3 px-6 py-4 flex-shrink-0 border-t border-neutral-800">
              <button
                onClick={() => setEditingRoutine(null)}
                className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoutine}
                disabled={editExercises.length === 0}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    )}
      {/* ── Delete routine confirmation dialog ───────────────── */}
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
                onClick={() => handleDeleteRoutine(routineToDelete.id)}
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
