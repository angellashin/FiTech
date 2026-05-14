import { useState, useEffect, useRef } from 'react';
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
  History,
  Volume2,
} from 'lucide-react';
import type { WorkoutPlan, Exercise, ExerciseSet } from '../domain/workout';
import {
  getExerciseHistory,
  applyProgressiveOverload,
  getRecommendedSets,
} from '../utils/workoutHistory';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface PlanPreviewProps {
  plan: WorkoutPlan;
  onStartSession: (updatedPlan?: WorkoutPlan) => void;
  onBack: () => void;
}

interface DraggableExerciseItemProps {
  exercise: Exercise;
  index: number;
  isEditing: boolean;
  editingExercise: string | null;
  editForm: any;
  onEditExercise: (exercise: Exercise) => void;
  onDeleteExercise: (id: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onUpdateSetDetail: (index: number, field: 'weight' | 'reps', value: number) => void;
  onAddSet: () => void;
  onRemoveSet: (index: number) => void;
  onLoadFromHistory: () => void;
  setEditForm: (form: any) => void;
  moveExercise: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableExerciseItem = ({
  exercise,
  index,
  isEditing,
  editingExercise,
  editForm,
  onEditExercise,
  onDeleteExercise,
  onCancelEdit,
  onSaveEdit,
  onUpdateSetDetail,
  onAddSet,
  onRemoveSet,
  onLoadFromHistory,
  setEditForm,
  moveExercise,
}: DraggableExerciseItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    { index: number },
    void,
    { handlerId: string | symbol | null }
  >({
    accept: 'exercise',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveExercise(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'exercise',
    item: () => {
      return { id: exercise.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEditing && editingExercise !== exercise.id,
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId ? String(handlerId) : undefined}
      className={`glass-dark rounded-2xl p-4 border transition-all shadow-lg hover:bg-white/5 ${
        editingExercise === exercise.id
          ? 'border-blue-500 shadow-blue-900/30'
          : 'border-neutral-700/50'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {editingExercise === exercise.id ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Edit Exercise</h4>
            <button
              onClick={onCancelEdit}
              className="w-8 h-8 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Exercise name"
            />
            {editForm.name && (
              <button
                onClick={onLoadFromHistory}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 text-blue-400"
              >
                <History className="w-4 h-4" />
                Load from Previous Workout
              </button>
            )}
          </div>
          <input
            type="text"
            value={editForm.muscleGroup}
            onChange={(e) => setEditForm({ ...editForm, muscleGroup: e.target.value })}
            className="w-full px-3 py-2 bg-neutral-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Muscle group"
          />

          <div>
            <label className="text-xs text-neutral-400 mb-2 block">Rest Time (seconds)</label>
            <input
              type="number"
              value={editForm.restTime}
              onChange={(e) =>
                setEditForm({ ...editForm, restTime: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-neutral-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="bg-neutral-900/50 rounded-xl p-3">
            <div className="text-sm text-neutral-400 mb-3">Set Details</div>

            <div className="grid grid-cols-[40px_1fr_1fr_36px] gap-1.5 mb-2 text-xs text-neutral-500 px-1">
              <div>Set</div>
              <div>kg</div>
              <div>Reps</div>
              <div></div>
            </div>

            <div className="space-y-1.5">
              {editForm.setDetails.map((set: ExerciseSet, idx: number) => (
                <div key={idx} className="grid grid-cols-[40px_1fr_1fr_36px] gap-1.5 items-center">
                  <div className="bg-neutral-800 rounded-lg py-1.5 text-center font-medium text-sm">
                    {idx + 1}
                  </div>
                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) =>
                      onUpdateSetDetail(idx, 'weight', parseInt(e.target.value) || 0)
                    }
                    className="min-w-0 w-full px-2 py-1.5 bg-neutral-800 rounded-lg text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="0"
                  />
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => onUpdateSetDetail(idx, 'reps', parseInt(e.target.value) || 0)}
                    className="min-w-0 w-full px-2 py-1.5 bg-neutral-800 rounded-lg text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="0"
                  />
                  <button
                    onClick={() => onRemoveSet(idx)}
                    disabled={editForm.setDetails.length <= 1}
                    className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={onAddSet}
              className="w-full mt-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Set
            </button>
          </div>

          <button
            onClick={() => onSaveEdit(exercise.id)}
            className="w-full py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all shadow-lg"
          >
            Save Changes
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              {isEditing && (
                <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-neutral-400 cursor-move flex-shrink-0">
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">{exercise.name}</h4>
                <p className="text-sm text-neutral-400">{exercise.muscleGroup}</p>
              </div>
            </div>
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditExercise(exercise)}
                  className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteExercise(exercise.id)}
                  className="w-9 h-9 rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {exercise.setDetails && exercise.setDetails.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[40px_1fr_1fr] gap-2 text-xs text-neutral-500 px-2">
                <div>Set</div>
                <div>kg</div>
                <div>Reps</div>
              </div>
              <div className="space-y-1.5">
                {exercise.setDetails.map((set, idx) => (
                  <div key={idx} className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center">
                    <div className="glass-dark rounded-lg px-2 py-1.5 text-center text-sm font-medium">
                      {idx + 1}
                    </div>
                    <div className="glass-dark rounded-lg px-2 py-1.5 text-center text-sm">
                      {set.weight > 0 ? `${set.weight} kg` : '-'}
                    </div>
                    <div className="glass-dark rounded-lg px-2 py-1.5 text-center text-sm">
                      {set.reps}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center glass-dark rounded-xl p-2 mt-2">
                <div className="text-sm text-neutral-400">
                  Rest: <span className="text-orange-400 font-semibold">{exercise.restTime}s</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center glass-dark rounded-xl p-3 shadow-inner">
                <div className="text-2xl font-bold text-blue-400 mb-1">{exercise.sets}</div>
                <div className="text-xs text-neutral-500">Sets</div>
              </div>
              <div className="text-center glass-dark rounded-xl p-3 shadow-inner">
                <div className="text-2xl font-bold text-white mb-1">{exercise.reps}</div>
                <div className="text-xs text-neutral-500">Reps</div>
              </div>
              <div className="text-center glass-dark rounded-xl p-3 shadow-inner">
                <div className="text-2xl font-bold text-orange-400 mb-1">{exercise.restTime}s</div>
                <div className="text-xs text-neutral-500">Rest</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export function PlanPreview({ plan, onStartSession, onBack }: PlanPreviewProps) {
  const [exercises, setExercises] = useState(plan.exercises);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    sets: 0,
    reps: 0,
    restTime: 0,
    muscleGroup: '',
    setDetails: [] as ExerciseSet[],
  });

  const [audioMessage, setAudioMessage] = useState<string>('');

  useEffect(() => {
    if (audioMessage) {
      const timer = setTimeout(() => setAudioMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [audioMessage]);

  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const estimatedTime = plan.duration;

  const goalLabels = {
    strength: 'Strength',
    endurance: 'Endurance',
    flexibility: 'Flexibility',
    'weight-loss': 'Weight Loss',
  };

  const muscleGroupLabels = {
    chest: '가슴',
    back: '등',
    shoulder: '어깨',
    triceps: '삼두',
    biceps: '이두',
    core: '복근',
    'lower-body': '하체',
  };

  const handleDeleteExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise.id);

    const setDetails =
      exercise.setDetails ||
      Array.from({ length: exercise.sets }, () => ({
        weight: 0,
        reps: exercise.reps,
        completed: false,
      }));

    setEditForm({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      restTime: exercise.restTime,
      muscleGroup: exercise.muscleGroup,
      setDetails,
    });
  };

  const handleSaveEdit = (id: string) => {
    setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, ...editForm } : ex)));
    setEditingExercise(null);
  };

  const handleCancelEdit = () => {
    setEditingExercise(null);
  };

  const handleAddExercise = () => {
    if (!editForm.name) return;

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: editForm.name,
      sets: editForm.setDetails.length || 3,
      reps: editForm.reps || 10,
      restTime: editForm.restTime || 60,
      muscleGroup: editForm.muscleGroup || 'General',
      setDetails: editForm.setDetails.length > 0 ? editForm.setDetails : undefined,
    };

    setExercises([...exercises, newExercise]);
    setShowAddExercise(false);
    setEditForm({
      name: '',
      sets: 3,
      reps: 10,
      restTime: 60,
      muscleGroup: '',
      setDetails: Array.from({ length: 3 }, () => ({ weight: 0, reps: 10, completed: false })),
    });
  };

  const handleStartWorkout = () => {
    const updatedPlan = { ...plan, exercises };
    onStartSession(updatedPlan);
  };

  const handleAddSet = () => {
    const recommendedSets = getRecommendedSets(editForm.name, 1, editForm.reps || 10);
    const newSet: ExerciseSet = recommendedSets[0];
    setEditForm({
      ...editForm,
      sets: editForm.sets + 1,
      setDetails: [...editForm.setDetails, newSet],
    });
  };

  const handleRemoveSet = (index: number) => {
    if (editForm.setDetails.length <= 1) return;
    const newSetDetails = editForm.setDetails.filter((_, i) => i !== index);
    setEditForm({
      ...editForm,
      sets: editForm.sets - 1,
      setDetails: newSetDetails,
    });
  };

  const handleUpdateSetDetail = (index: number, field: 'weight' | 'reps', value: number) => {
    const newSetDetails = [...editForm.setDetails];
    newSetDetails[index] = { ...newSetDetails[index], [field]: value };
    setEditForm({
      ...editForm,
      setDetails: newSetDetails,
    });
  };

  const handleLoadFromHistory = () => {
    if (!editForm.name) return;

    const history = getExerciseHistory(editForm.name);
    if (history && history.setDetails.length > 0) {
      const recommendedSets = applyProgressiveOverload(history.setDetails);
      setEditForm({
        ...editForm,
        sets: recommendedSets.length,
        setDetails: recommendedSets,
        restTime: history.restTime,
      });
      setAudioMessage(`Loaded previous workout with +2.5% weight increase`);
    } else {
      setAudioMessage(`No history found for ${editForm.name}`);
    }
  };

  const moveExercise = (dragIndex: number, hoverIndex: number) => {
    const draggedExercise = exercises[dragIndex];
    const updatedExercises = [...exercises];
    updatedExercises.splice(dragIndex, 1);
    updatedExercises.splice(hoverIndex, 0, draggedExercise);
    setExercises(updatedExercises);
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
                {isEditing ? 'Edit your plan' : 'Review before starting'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
              isEditing
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span className="text-sm font-medium">{isEditing ? 'Done' : 'Edit'}</span>
          </button>
        </header>

        <div className="flex-1 px-6 overflow-auto pb-32">
          {audioMessage && (
            <div className="mb-4 px-6 py-3 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
              <Volume2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="text-sm text-blue-100">{audioMessage}</div>
            </div>
          )}

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
                  <span className="text-neutral-300">{muscleGroupLabels[plan.muscleGroup]}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-neutral-400" />
                Exercise List
              </h3>
              {isEditing && (
                <button
                  onClick={() => {
                    setShowAddExercise(true);
                    setEditForm({
                      name: '',
                      sets: 3,
                      reps: 10,
                      restTime: 60,
                      muscleGroup: '',
                      setDetails: getRecommendedSets('', 3, 10),
                    });
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Exercise</span>
                </button>
              )}
            </div>

            {showAddExercise && (
              <div className="bg-neutral-800 rounded-2xl p-4 border-2 border-blue-600 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">New Exercise</h4>
                  <button
                    onClick={() => setShowAddExercise(false)}
                    className="w-8 h-8 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Exercise name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-900 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {editForm.name && (
                      <button
                        onClick={handleLoadFromHistory}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 text-blue-400"
                      >
                        <History className="w-4 h-4" />
                        Load from Previous Workout
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Muscle group"
                    value={editForm.muscleGroup}
                    onChange={(e) => setEditForm({ ...editForm, muscleGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-900 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />

                  <div>
                    <label className="text-xs text-neutral-400 mb-1 block">
                      Rest Time (seconds)
                    </label>
                    <input
                      type="number"
                      value={editForm.restTime}
                      onChange={(e) =>
                        setEditForm({ ...editForm, restTime: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 bg-neutral-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="bg-neutral-900/50 rounded-xl p-3">
                    <div className="text-sm text-neutral-400 mb-3">Set Details</div>

                    <div className="grid grid-cols-[50px_1fr_1fr_40px] gap-2 mb-2 text-xs text-neutral-500 px-2">
                      <div>Set</div>
                      <div>kg</div>
                      <div>Reps</div>
                      <div></div>
                    </div>

                    <div className="space-y-2">
                      {editForm.setDetails.map((set, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[50px_1fr_1fr_40px] gap-2 items-center"
                        >
                          <div className="bg-neutral-800 rounded-lg px-3 py-2 text-center font-medium text-sm">
                            {idx + 1}
                          </div>
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) =>
                              handleUpdateSetDetail(idx, 'weight', parseInt(e.target.value) || 0)
                            }
                            className="px-3 py-2 bg-neutral-800 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="0"
                          />
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleUpdateSetDetail(idx, 'reps', parseInt(e.target.value) || 0)
                            }
                            className="px-3 py-2 bg-neutral-800 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="0"
                          />
                          <button
                            onClick={() => handleRemoveSet(idx)}
                            disabled={editForm.setDetails.length <= 1}
                            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleAddSet}
                      className="w-full mt-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Set
                    </button>
                  </div>

                  <button
                    onClick={handleAddExercise}
                    className="w-full py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all shadow-lg"
                  >
                    Add Exercise
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {exercises.length === 0 ? (
                <div className="bg-neutral-800 rounded-2xl p-8 text-center">
                  <Dumbbell className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 mb-4">No exercises in your plan yet</p>
                  <button
                    onClick={() => {
                      setShowAddExercise(true);
                      setEditForm({
                        name: '',
                        sets: 3,
                        reps: 10,
                        restTime: 60,
                        muscleGroup: '',
                        setDetails: getRecommendedSets('', 3, 10),
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Your First Exercise</span>
                  </button>
                </div>
              ) : (
                exercises.map((exercise, index) => (
                  <DraggableExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    isEditing={isEditing}
                    editingExercise={editingExercise}
                    editForm={editForm}
                    onEditExercise={handleEditExercise}
                    onDeleteExercise={handleDeleteExercise}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onUpdateSetDetail={handleUpdateSetDetail}
                    onAddSet={handleAddSet}
                    onRemoveSet={handleRemoveSet}
                    onLoadFromHistory={handleLoadFromHistory}
                    setEditForm={setEditForm}
                    moveExercise={moveExercise}
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
                  Audio guidance will guide you through each exercise. Use earbud taps to control
                  your workout.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent px-6 pt-8 pb-6">
          {!isEditing ? (
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
          ) : (
            <div className="bg-neutral-900 rounded-2xl p-4">
              <div className="text-sm text-neutral-400 text-center">
                Editing mode • Tap "Done" when finished
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
