import { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  RotateCcw,
  Edit2,
  Trash2,
  Plus,
  X,
  ChevronLeft,
} from 'lucide-react';
import {
  getSavedRoutines,
  deleteRoutine,
  updateRoutine,
} from '../utils/workoutHistory';
import type { SavedRoutine } from '../utils/workoutHistory';
import type { MuscleGroup, WorkoutPlan, Exercise } from '../domain/workout';
import { exerciseLibrary } from '../services/workoutPlanner';
import type { ExerciseTemplate } from '../services/workoutPlanner';

interface RoutineLibraryProps {
  onBack: () => void;
  onLoadPlan: (plan: WorkoutPlan) => void;
}

const routineToPlan = (routine: SavedRoutine): WorkoutPlan => ({
  goal: 'strength',
  muscleGroup: ['chest'],
  duration: 45,
  exercises: routine.exercises,
});

export function RoutineLibrary({ onBack, onLoadPlan }: RoutineLibraryProps) {
  const [routines, setRoutines] = useState<SavedRoutine[]>(() => getSavedRoutines());

  // Edit bottom sheet state
  const [editingRoutine, setEditingRoutine] = useState<SavedRoutine | null>(null);
  const [editName, setEditName] = useState('');
  const [editExercises, setEditExercises] = useState<Exercise[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [addFilter, setAddFilter] = useState<MuscleGroup | 'all'>('all');

  // Delete confirmation state
  const [routineToDelete, setRoutineToDelete] = useState<{ id: string; name: string } | null>(null);

  const muscleGroupKeys = Object.keys(exerciseLibrary) as MuscleGroup[];

  const filteredLibraryExercises =
    addFilter === 'all'
      ? muscleGroupKeys.flatMap((g) => exerciseLibrary[g])
      : (exerciseLibrary[addFilter] ?? []);

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
    setRoutines(getSavedRoutines());
    setEditingRoutine(null);
  };

  const handleDeleteRoutine = (id: string) => {
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
            {routines.map((routine) => (
              <div key={routine.id} className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-semibold truncate">{routine.name}</div>
                    <div className="text-sm text-neutral-400 mt-0.5">
                      {routine.exercises.length} exercises
                      {' · '}
                      {routine.exercises
                        .map((e) => e.muscleGroup)
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
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

                {/* Exercise preview */}
                <div className="space-y-1 mb-3">
                  {routine.exercises.slice(0, 4).map((ex, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-300 truncate">{ex.name}</span>
                      <span className="text-neutral-500 ml-2 flex-shrink-0">
                        {ex.sets}×{ex.reps}
                      </span>
                    </div>
                  ))}
                  {routine.exercises.length > 4 && (
                    <div className="text-xs text-neutral-600">
                      +{routine.exercises.length - 4} more
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onLoadPlan(routineToPlan(routine))}
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

      {/* ── Edit Routine Bottom Sheet ── */}
      {editingRoutine && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingRoutine(null)}
          />
          <div className="relative bg-neutral-900 rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="w-10 h-1 rounded-full bg-neutral-700 mx-auto mt-4 mb-1 flex-shrink-0" />
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

            <div className="overflow-y-auto flex-1 px-6 py-4">
              {!showAddExercise ? (
                <div className="space-y-4">
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
                  <div>
                    <span className="text-sm text-neutral-400 block mb-2">
                      Exercises ({editExercises.length})
                    </span>
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
                  <button
                    onClick={() => setShowAddExercise(true)}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-blue-500/40 hover:border-blue-500/70 text-blue-400 hover:text-blue-300 rounded-xl py-3 text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Exercise
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
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
                            onClick={() => { if (!alreadyAdded) handleAddExercise(template); }}
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

      {/* ── Delete confirmation dialog ── */}
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
