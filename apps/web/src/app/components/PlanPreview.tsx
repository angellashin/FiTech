import { useState, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Clock,
  Dumbbell,
  TrendingUp,
  Edit3,
  Trash2,
  Plus,
  Check,
  X,
  GripVertical,
  Minus,
  Sparkles,
  Info,
} from 'lucide-react';
import type { WorkoutPlan, Exercise, MuscleGroup } from '../domain/workout';
import { getRecommendedSets } from '../utils/workoutHistory';
import { exerciseLibrary } from '../services/workoutPlanner';
import { getExerciseGuide } from '../services/exerciseGuide';
import { ExerciseGuideSheet } from './ExerciseGuideSheet';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface PlanPreviewProps {
  plan: WorkoutPlan;
  onStartSession: (updatedPlan?: WorkoutPlan) => void;
  onBack: () => void;
}

// ── Normal mode: full card with kg/reps/rest ──────────────────────────────
interface DraggableExerciseItemProps {
  exercise: Exercise;
  index: number;
  onUpdateSet: (id: string, setIndex: number, field: 'weight' | 'reps', value: number) => void;
  onUpdateRestTime: (id: string, value: number) => void;
  onAddSet: (id: string) => void;
  onRemoveSet: (id: string, setIndex: number) => void;
  onOpenGuide: (exercise: Exercise) => void;
}

const ExerciseCard = ({
  exercise,
  index,
  onUpdateSet,
  onUpdateRestTime,
  onAddSet,
  onRemoveSet,
  onOpenGuide,
}: DraggableExerciseItemProps) => {
  const sets = exercise.setDetails ?? [];
  const guide = getExerciseGuide(exercise);

  return (
    <div className="glass-dark rounded-2xl p-4 border border-neutral-700/50 shadow-lg hover:bg-white/5 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <button
          type="button"
          onClick={() => onOpenGuide(exercise)}
          aria-label={`Open ${exercise.name} guide`}
          className="relative w-16 h-16 rounded-2xl bg-white p-1 shadow-inner overflow-hidden flex-shrink-0 ring-1 ring-white/10 hover:ring-blue-400 transition-all"
        >
          <img
            src={guide.imageSrc}
            alt={`${exercise.name} form illustration`}
            className="h-full w-full object-contain"
            loading="lazy"
          />
          <span className="absolute left-1.5 top-1.5 w-5 h-5 rounded-md bg-blue-600 text-[11px] font-bold flex items-center justify-center text-white">
            {index + 1}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-lg mb-1">{exercise.name}</h4>
          <p className="text-sm text-neutral-400">
            {exercise.muscleGroup} · {guide.equipment}
          </p>
          <button
            type="button"
            onClick={() => onOpenGuide(exercise)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200 hover:bg-blue-500/20 transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            Form guide
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[40px_1fr_1fr_36px] gap-1.5 text-xs text-neutral-500 px-1">
          <div>Set</div>
          <div>kg</div>
          <div>Reps</div>
          <div></div>
        </div>
        <div className="space-y-1.5">
          {sets.map((set, idx) => (
            <div key={idx} className="grid grid-cols-[40px_1fr_1fr_36px] gap-1.5 items-center">
              <div className="glass-dark rounded-lg py-1.5 text-center text-sm font-medium">
                {idx + 1}
              </div>
              <input
                type="number"
                value={set.weight || ''}
                onChange={(e) =>
                  onUpdateSet(exercise.id, idx, 'weight', parseInt(e.target.value) || 0)
                }
                className="min-w-0 w-full px-2 py-1.5 bg-neutral-800 rounded-lg text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="-"
              />
              <input
                type="number"
                value={set.reps || ''}
                onChange={(e) =>
                  onUpdateSet(exercise.id, idx, 'reps', parseInt(e.target.value) || 0)
                }
                className="min-w-0 w-full px-2 py-1.5 bg-neutral-800 rounded-lg text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="0"
              />
              <button
                onClick={() => onRemoveSet(exercise.id, idx)}
                disabled={sets.length <= 1}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => onAddSet(exercise.id)}
          className="w-full mt-1 py-1.5 bg-neutral-800/60 hover:bg-neutral-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 text-neutral-400 hover:text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Set
        </button>
        <div className="flex items-center justify-center gap-2 glass-dark rounded-xl px-3 py-2 mt-1">
          <span className="text-sm text-neutral-400">Rest:</span>
          <input
            type="number"
            value={exercise.restTime}
            onChange={(e) => onUpdateRestTime(exercise.id, parseInt(e.target.value) || 0)}
            className="w-16 bg-transparent text-orange-400 font-semibold text-sm text-center focus:outline-none focus:ring-1 focus:ring-orange-500 rounded"
          />
          <span className="text-sm text-neutral-400">s</span>
        </div>
      </div>
    </div>
  );
};

// ── Edit mode: simple draggable row ──────────────────────────────────────
interface EditRowProps {
  exercise: Exercise;
  index: number;
  onDelete: (id: string) => void;
  moveExercise: (from: number, to: number) => void;
}

const EditRow = ({ exercise, index, onDelete, moveExercise }: EditRowProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    { index: number },
    void,
    { handlerId: string | symbol | null }
  >({
    accept: 'exercise',
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const rect = ref.current.getBoundingClientRect();
      const midY = (rect.bottom - rect.top) / 2;
      const clientY = monitor.getClientOffset()!.y - rect.top;
      if (dragIndex < hoverIndex && clientY < midY) return;
      if (dragIndex > hoverIndex && clientY > midY) return;
      moveExercise(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'exercise',
    item: () => ({ id: exercise.id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId ? String(handlerId) : undefined}
      className={`flex items-center gap-3 px-4 py-3.5 border-b border-neutral-800 transition-all ${isDragging ? 'opacity-40' : 'opacity-100'}`}
    >
      <span className="text-sm text-neutral-500 w-5 text-center">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white font-medium">
          {exercise.muscleGroup} | {exercise.name}
        </span>
      </div>
      <button
        onClick={() => onDelete(exercise.id)}
        className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <div className="w-8 h-8 flex items-center justify-center text-neutral-500 cursor-move flex-shrink-0">
        <GripVertical className="w-4 h-4" />
      </div>
    </div>
  );
};

// ── Exercise Picker ───────────────────────────────────────────────────────
const MUSCLE_GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back' },
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'core', label: 'Core' },
  { key: 'lower-body', label: 'Lower Body' },
];

interface ExercisePickerProps {
  existingNames: Set<string>;
  onAdd: (exercises: Exercise[]) => void;
  onClose: () => void;
}

const ExercisePicker = ({ existingNames, onAdd, onClose }: ExercisePickerProps) => {
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allExercises = MUSCLE_GROUPS.flatMap(({ key }) =>
    exerciseLibrary[key].map((ex) => ({ ...ex, groupKey: key })),
  );

  const filtered =
    activeGroup === 'all' ? allExercises : allExercises.filter((ex) => ex.groupKey === activeGroup);

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const toAdd: Exercise[] = allExercises
      .filter((ex) => selected.has(ex.name))
      .map((ex, i) => ({
        id: `picker-${Date.now()}-${i}`,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        restTime: ex.restTime,
        muscleGroup: ex.muscleGroup,
        setDetails: getRecommendedSets(ex.name, ex.sets, ex.reps, ex.muscleGroup),
      }));
    onAdd(toAdd);
  };

  return (
    <div className="absolute inset-0 z-10 bg-neutral-950 flex flex-col">
      {/* header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
        <h2 className="text-lg font-semibold">Select Exercises</h2>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* muscle group tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b border-neutral-800">
        <button
          onClick={() => setActiveGroup('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
            activeGroup === 'all'
              ? 'bg-white text-neutral-950'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          All
        </button>
        {MUSCLE_GROUPS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveGroup(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              activeGroup === key
                ? 'bg-white text-neutral-950'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* exercise list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((ex) => {
          const isAlready = existingNames.has(ex.name);
          const isChecked = selected.has(ex.name);
          return (
            <button
              key={ex.name}
              disabled={isAlready}
              onClick={() => toggleSelect(ex.name)}
              className={`w-full flex items-center gap-4 px-5 py-4 border-b border-neutral-800/60 transition-colors text-left ${
                isAlready ? 'opacity-30 cursor-not-allowed' : 'hover:bg-neutral-800/40'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                  isChecked ? 'bg-blue-600 border-blue-600' : 'border-neutral-600'
                }`}
              >
                {isChecked && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{ex.name}</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {ex.muscleGroup} · {ex.sets} sets × {ex.reps} reps
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* bottom confirm */}
      <div className="px-6 py-4 border-t border-neutral-800">
        <button
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-sm transition-all"
        >
          {selected.size === 0
            ? 'Select exercises'
            : `Add ${selected.size} exercise${selected.size > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────
export function PlanPreview({ plan, onStartSession, onBack }: PlanPreviewProps) {
  const [exercises, setExercises] = useState(plan.exercises);
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<typeof exercises>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [guideExercise, setGuideExercise] = useState<Exercise | null>(null);

  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const estimatedTime = plan.duration;
  const rationaleItems = plan.rationale?.filter(Boolean).slice(0, 5) ?? [];

  const goalLabels: Record<string, string> = {
    strength: 'Strength',
    endurance: 'Endurance',
    flexibility: 'Flexibility',
    'weight-loss': 'Weight Loss',
  };

  const muscleGroupLabels: Record<string, string> = {
    chest: 'Chest',
    back: 'Back',
    shoulder: 'Shoulder',
    triceps: 'Triceps',
    biceps: 'Biceps',
    core: 'Core',
    'lower-body': 'Lower Body',
  };

  const handleDeleteExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const handleUpdateRestTime = (exerciseId: string, value: number) => {
    setExercises(exercises.map((ex) => (ex.id === exerciseId ? { ...ex, restTime: value } : ex)));
  };

  const handleUpdateSet = (
    exerciseId: string,
    setIndex: number,
    field: 'weight' | 'reps',
    value: number,
  ) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id !== exerciseId || !ex.setDetails) return ex;
        return {
          ...ex,
          setDetails: ex.setDetails.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s)),
        };
      }),
    );
  };

  const handleAddSet = (exerciseId: string) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.setDetails?.[ex.setDetails.length - 1] ?? {
          weight: 0,
          reps: 10,
          completed: false,
        };
        return {
          ...ex,
          sets: ex.sets + 1,
          setDetails: [...(ex.setDetails ?? []), { ...lastSet, completed: false }],
        };
      }),
    );
  };

  const handleRemoveSet = (exerciseId: string, setIndex: number) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id !== exerciseId || !ex.setDetails || ex.setDetails.length <= 1) return ex;
        return {
          ...ex,
          sets: ex.sets - 1,
          setDetails: ex.setDetails.filter((_, i) => i !== setIndex),
        };
      }),
    );
  };

  const handlePickerAdd = (picked: Exercise[]) => {
    setExercises((prev) => [...prev, ...picked]);
    setShowPicker(false);
  };

  const handleStartWorkout = () => {
    onStartSession({ ...plan, exercises });
  };

  const moveExercise = (dragIndex: number, hoverIndex: number) => {
    const updated = [...exercises];
    const [dragged] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, dragged);
    setExercises(updated);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="size-full flex flex-col bg-neutral-950">
        <header className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Your Workout Plan</h1>
              <p className="text-sm text-neutral-400">
                {isEditing ? 'Edit exercise list' : 'Review before starting'}
              </p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => {
                setEditSnapshot([...exercises]);
                setIsEditing(true);
                setShowPicker(false);
              }}
              className="px-4 py-2 rounded-xl flex items-center gap-2 transition-colors bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">Edit</span>
            </button>
          )}
        </header>

        {isEditing ? (
          /* ── EDIT MODE: simple list ─────────────────────────────── */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <div className="mx-6 mb-3 bg-neutral-900 rounded-2xl overflow-hidden">
                {exercises.length === 0 ? (
                  <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                    No exercises yet. Add one below.
                  </div>
                ) : (
                  exercises.map((exercise, index) => (
                    <EditRow
                      key={exercise.id}
                      exercise={exercise}
                      index={index}
                      onDelete={handleDeleteExercise}
                      moveExercise={moveExercise}
                    />
                  ))
                )}
              </div>

              <button
                onClick={() => setShowPicker(true)}
                className="mx-6 w-[calc(100%-3rem)] py-3 border-2 border-dashed border-neutral-700 hover:border-neutral-600 rounded-2xl text-sm text-neutral-500 hover:text-neutral-400 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Exercise
              </button>
            </div>

            <div className="px-6 pt-4 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setExercises(editSnapshot);
                  setIsEditing(false);
                  setShowPicker(false);
                }}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-2xl py-4 font-semibold transition-all"
              >
                Undo
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setShowPicker(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-semibold transition-all"
              >
                Confirm
              </button>
            </div>

            {showPicker && (
              <ExercisePicker
                existingNames={new Set(exercises.map((e) => e.name))}
                onAdd={handlePickerAdd}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
        ) : (
          /* ── NORMAL MODE: full cards ────────────────────────────── */
          <>
            <div className="flex-1 px-6 overflow-auto pb-32">
              <div className="relative bg-gradient-to-br from-blue-950/50 via-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 border border-blue-500/20 shadow-2xl overflow-hidden card-glow">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center backdrop-blur-sm">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-lg font-semibold">Plan Summary</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center glass-dark rounded-xl p-4 shadow-lg">
                      <div className="text-3xl font-bold text-blue-400 mb-1">{totalExercises}</div>
                      <div className="text-xs text-neutral-400">Exercises</div>
                    </div>
                    <div className="text-center glass-dark rounded-xl p-4 shadow-lg">
                      <div className="text-3xl font-bold text-white mb-1">{totalSets}</div>
                      <div className="text-xs text-neutral-400">Total Sets</div>
                    </div>
                    <div className="text-center glass-dark rounded-xl p-4 shadow-lg">
                      <div className="text-3xl font-bold text-green-400 mb-1">{estimatedTime}</div>
                      <div className="text-xs text-neutral-400">Minutes</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2 glass-dark px-3 py-1.5 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                      <span className="text-neutral-300">{goalLabels[plan.goal]}</span>
                    </div>
                    <div className="flex items-center gap-2 glass-dark px-3 py-1.5 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
                      <span className="text-neutral-300">
                        {plan.muscleGroup.map((g) => muscleGroupLabels[g] ?? g).join(' · ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {rationaleItems.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-950/40 to-neutral-950 border border-emerald-500/20 rounded-3xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                    <h3 className="text-lg font-semibold">Why this recommendation?</h3>
                  </div>
                  <div className="space-y-2">
                    {rationaleItems.map((item) => (
                      <div key={item} className="flex gap-2 text-sm text-emerald-50/85">
                        <span className="text-emerald-300">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-neutral-900 rounded-3xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Dumbbell className="w-5 h-5 text-neutral-400" />
                  <h3 className="text-lg font-semibold">Exercise List</h3>
                </div>
                <div className="space-y-3">
                  {exercises.length === 0 ? (
                    <div className="bg-neutral-800 rounded-2xl p-8 text-center">
                      <Dumbbell className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-400 mb-4">No exercises in your plan yet</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Exercises</span>
                      </button>
                    </div>
                  ) : (
                    exercises.map((exercise, index) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        index={index}
                        onUpdateSet={handleUpdateSet}
                        onUpdateRestTime={handleUpdateRestTime}
                        onAddSet={handleAddSet}
                        onRemoveSet={handleRemoveSet}
                        onOpenGuide={setGuideExercise}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="bg-blue-950/30 border border-blue-900/30 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-100 mb-1 font-medium">Hands-Free Workout</p>
                    <p className="text-blue-300/70">
                      Audio guidance will guide you through each exercise. Use earbud taps to
                      control your workout.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent px-6 pt-8 pb-6">
              <button
                onClick={handleStartWorkout}
                disabled={exercises.length === 0}
                className="w-full bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 disabled:cursor-not-allowed text-white rounded-2xl py-5 px-8 flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-[1.02] active:scale-[0.98] disabled:shadow-none"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-6 h-6" />
                </div>
                <span className="text-lg font-semibold">
                  {exercises.length === 0 ? 'Add exercises to start' : 'Start Workout'}
                </span>
              </button>
            </div>
          </>
        )}
        <ExerciseGuideSheet exercise={guideExercise} onClose={() => setGuideExercise(null)} />
      </div>
    </DndProvider>
  );
}
