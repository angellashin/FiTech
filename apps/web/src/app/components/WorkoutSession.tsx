import { useCallback, useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  Bell,
  Link2,
  ArrowLeft,
  Dumbbell,
  RefreshCw,
  Check,
  Minus,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { WorkoutPlan, Exercise } from '../domain/workout';
import {
  getExerciseEquipment,
  getExerciseImageSrc,
  getExerciseType,
} from '../services/exerciseGuide';
import { ExerciseGuideSheet } from './ExerciseGuideSheet';
import {
  getRecommendedSets,
  saveWorkoutHistory,
  updateWorkoutSession,
  type WorkoutSessionEvent,
  type WorkoutSessionEventType,
} from '../utils/workoutHistory';
import { useAudioCoach } from '../hooks/useAudioCoach';
import { useEarbudControls } from '../hooks/useEarbudControls';
import { getUserSettings, setUserSetting } from '../utils/userSettings';
import { buildSessionAnalytics } from '../services/workoutAnalytics';
import { adaptForGoal, exerciseLibrary, type ExerciseTemplate } from '../services/workoutPlanner';

interface WorkoutSessionProps {
  plan: WorkoutPlan;
  onComplete: (sessionId: string, exercises: Exercise[]) => void;
  onBack: () => void;
}

const formatKg = (weight: number) =>
  Number.isInteger(weight) ? `${weight}` : weight.toFixed(1).replace(/\.0$/, '');

const normalizeWeight = (weight: number) => Math.max(0, Math.round(weight * 10) / 10);

const getSetTarget = (exercise: Exercise | undefined, setNumber: number) => {
  const plannedSet = exercise?.setDetails?.[Math.max(0, setNumber - 1)];
  return {
    weight: plannedSet?.weight ?? 0,
    reps: plannedSet?.reps ?? exercise?.reps ?? 0,
    setType: plannedSet?.setType,
  };
};

const getRepDisplay = (exercise: Exercise | undefined, setNumber: number) => {
  const target = getSetTarget(exercise, setNumber);
  if (!exercise) return '—';
  return getExerciseType(exercise.name) === 'Hold / Time' ? `${target.reps}s` : target.reps;
};

const getSetTargetDisplay = (exercise: Exercise | undefined, setNumber: number) => {
  if (!exercise) return '—';
  const target = getSetTarget(exercise, setNumber);
  if (getExerciseType(exercise.name) === 'Hold / Time') {
    return `${target.reps}s hold`;
  }
  if (target.weight > 0) {
    return `${formatKg(target.weight)}kg · ${target.reps} reps`;
  }
  return `Bodyweight · ${target.reps} reps`;
};

const getSetTargetSpeech = (exercise: Exercise | undefined, setNumber: number) => {
  if (!exercise) return '';
  const target = getSetTarget(exercise, setNumber);
  const setTypeCue =
    target.setType === 'failure'
      ? ' to failure'
      : target.setType === 'dropset'
        ? ' as a drop set'
        : '';

  if (getExerciseType(exercise.name) === 'Hold / Time') {
    return `hold for ${target.reps} seconds${setTypeCue}`;
  }

  if (target.weight > 0) {
    return `${formatKg(target.weight)} kilograms for ${target.reps} reps${setTypeCue}`;
  }

  return `bodyweight for ${target.reps} reps${setTypeCue}`;
};

const getExerciseStartSpeech = (exercise: Exercise | undefined, setNumber: number) => {
  if (!exercise) return 'No exercise selected.';
  return `Set ${setNumber} of ${exercise.name}: ${getSetTargetSpeech(exercise, setNumber)}.`;
};

const canAdjustWeight = (exercise: Exercise | undefined) => {
  if (!exercise) return false;
  const exerciseType = getExerciseType(exercise.name);
  return exerciseType === 'Weight / Reps' || exerciseType === 'Machine / Reps';
};

const allExerciseTemplates = Object.values(exerciseLibrary).flat();

interface WeightAdjusterProps {
  exercise: Exercise | undefined;
  setNumber: number;
  onChange: (weight: number) => void;
}

const WeightAdjuster = ({ exercise, setNumber, onChange }: WeightAdjusterProps) => {
  if (!canAdjustWeight(exercise)) return null;

  const currentWeight = getSetTarget(exercise, setNumber).weight;
  const currentValue = currentWeight > 0 ? formatKg(currentWeight) : '';
  const updateBy = (delta: number) => onChange(normalizeWeight(currentWeight + delta));

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 px-2 py-1 text-xs text-neutral-500">
      <span className="pl-1 font-medium">kg</span>
      <button
        type="button"
        onClick={() => updateBy(-2.5)}
        disabled={currentWeight <= 0}
        aria-label="Decrease current set weight by 2.5 kilograms"
        className="h-7 w-7 rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-35 disabled:hover:bg-neutral-800 flex items-center justify-center transition-colors"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.5"
        value={currentValue}
        onChange={(event) => onChange(normalizeWeight(parseFloat(event.target.value) || 0))}
        aria-label="Current set weight in kilograms"
        placeholder="0"
        className="h-7 w-14 rounded-full bg-neutral-950/70 px-2 text-center text-sm font-semibold text-white outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => updateBy(2.5)}
        aria-label="Increase current set weight by 2.5 kilograms"
        className="h-7 w-7 rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 flex items-center justify-center transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

interface ReplacementPickerProps {
  currentExercise: Exercise;
  plannedExercises: Exercise[];
  onReplace: (template: ExerciseTemplate) => void;
  onClose: () => void;
}

const ReplacementPicker = ({
  currentExercise,
  plannedExercises,
  onReplace,
  onClose,
}: ReplacementPickerProps) => {
  const [showAll, setShowAll] = useState(false);
  const alreadyPlanned = new Set(
    plannedExercises
      .filter((exercise) => exercise.id !== currentExercise.id)
      .map((exercise) => exercise.name),
  );
  const availableTemplates = allExerciseTemplates.filter(
    (template) => template.name !== currentExercise.name && !alreadyPlanned.has(template.name),
  );
  const sameGroupTemplates = availableTemplates.filter(
    (template) => template.muscleGroup === currentExercise.muscleGroup,
  );
  const visibleTemplates =
    showAll || sameGroupTemplates.length === 0 ? availableTemplates : sameGroupTemplates;

  return (
    <div className="absolute inset-0 z-30 bg-neutral-950 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-300 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Change exercise</h2>
            <p className="text-xs text-neutral-500 mt-0.5 truncate">
              Replace {currentExercise.name} if the machine is busy.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close replacement picker"
          className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 px-4 py-3 border-b border-neutral-800">
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !showAll ? 'bg-white text-neutral-950' : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          Same muscle
        </button>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            showAll ? 'bg-white text-neutral-950' : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          All options
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {visibleTemplates.length === 0 ? (
          <div className="px-6 py-10 text-center text-neutral-500">
            No replacement exercises available outside the current plan.
          </div>
        ) : (
          visibleTemplates.map((template) => (
            <button
              key={`${template.muscleGroup}-${template.name}`}
              type="button"
              onClick={() => onReplace(template)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-neutral-800/60 text-left hover:bg-neutral-800/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex-shrink-0">
                <img
                  src={getExerciseImageSrc(template.name)}
                  alt={template.name}
                  className="w-full h-full object-contain p-0.5"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white">{template.name}</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {template.muscleGroup} · {getExerciseEquipment(template.name)} · {template.sets}×
                  {template.reps}
                </div>
              </div>
              <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export function WorkoutSession({ plan, onComplete, onBack }: WorkoutSessionProps) {
  const [exercises, setExercises] = useState<Exercise[]>(plan.exercises);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [audioMessage, setAudioMessage] = useState<string>(
    `Audio guidance active. ${getExerciseStartSpeech(plan.exercises[0], 1)} Single tap when the set is complete.`,
  );
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [events, setEvents] = useState<WorkoutSessionEvent[]>([]);
  const [startedAt] = useState(() => new Date().toISOString());
  const { audioGuidance: savedAudioGuidance, restNotifications: restNotificationsEnabled } =
    getUserSettings();
  const [audioEnabled, setAudioEnabled] = useState(savedAudioGuidance);
  const [flashTap, setFlashTap] = useState<'singleTap' | 'doubleTap' | 'tripleTap' | null>(null);
  const [supersetAIndex, setSupersetAIndex] = useState<number | null>(null);
  const [guideExercise, setGuideExercise] = useState<{ name: string; muscleGroup: string } | null>(
    null,
  );
  const [showReplacementPicker, setShowReplacementPicker] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const { isSupported: _isAudioSupported, speak, stop } = useAudioCoach(audioEnabled);

  // 모바일 브라우저 오디오 잠금 해제 — 화면 첫 터치 시 AudioContext + speechSynthesis 활성화
  useEffect(() => {
    const unlock = () => {
      if (audioUnlocked) return;
      // AudioContext 잠금 해제
      try {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') void ctx.resume();
        void ctx.close();
      } catch {
        // Some browsers block AudioContext until a stronger user gesture; safe to ignore.
      }
      // speechSynthesis 잠금 해제 (무음 utterance)
      if ('speechSynthesis' in window) {
        const silent = new SpeechSynthesisUtterance('');
        silent.volume = 0;
        window.speechSynthesis.speak(silent);
      }
      setAudioUnlocked(true);
    };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, [audioUnlocked]);

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length || 1;
  const progress = (completedExercises.length / totalExercises) * 100;

  useEffect(() => {
    if (audioMessage) {
      speak(audioMessage);
    }
  }, [audioMessage, speak]);

  const playTone = useCallback((frequency: number, duration: number, volume = 0.35) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio feedback is best-effort; the session flow must continue silently if blocked.
    }
  }, []);

  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      const timer = setTimeout(() => {
        setRestTimeLeft(restTimeLeft - 1);
        if (restNotificationsEnabled) {
          if (restTimeLeft === 11) playTone(880, 0.35); // 10s: 띵!
          if (restTimeLeft === 4) playTone(660, 0.25); // 3s: 띵
          if (restTimeLeft === 3) playTone(880, 0.25); // 2s: 띵
          if (restTimeLeft === 2) playTone(1100, 0.25); // 1s: 띵
        }
        if (restTimeLeft === 1) {
          if (restNotificationsEnabled) playTone(440, 1.2, 0.5); // 0s: 땅!
          setAudioMessage(
            `Rest complete. ${getExerciseStartSpeech(currentExercise, currentSet)} Single tap when the set is complete.`,
          );
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isResting && restTimeLeft === 0) {
      setIsResting(false);
    }
  }, [currentExercise, currentSet, isResting, playTone, restNotificationsEnabled, restTimeLeft]);

  const createEvent = (
    type: WorkoutSessionEventType,
    message: string,
    exercise: Exercise | null = currentExercise,
    setNumber: number | null = currentSet,
  ): WorkoutSessionEvent => ({
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    timestamp: new Date().toISOString(),
    exerciseId: exercise?.id,
    exerciseName: exercise?.name,
    setNumber: setNumber ?? undefined,
    message,
  });

  const markSetCompleted = (source: Exercise[], exerciseIndex: number, setNumber: number) => {
    return source.map((exercise, index) => {
      if (index !== exerciseIndex || !exercise.setDetails) return exercise;

      return {
        ...exercise,
        setDetails: exercise.setDetails.map((set, setIndex) =>
          setIndex === setNumber - 1 ? { ...set, completed: true } : set,
        ),
      };
    });
  };

  const updateCurrentSetWeight = (weight: number) => {
    if (!currentExercise || !canAdjustWeight(currentExercise)) return;

    const nextWeight = normalizeWeight(weight);
    setExercises((previousExercises) =>
      previousExercises.map((exercise, index) => {
        if (index !== currentExerciseIndex) return exercise;

        const setDetails =
          exercise.setDetails?.map((set) => ({ ...set })) ??
          Array.from({ length: exercise.sets }, () => ({
            weight: 0,
            reps: exercise.reps,
            completed: false,
          }));

        while (setDetails.length < exercise.sets) {
          setDetails.push({
            weight: 0,
            reps: exercise.reps,
            completed: false,
          });
        }

        return {
          ...exercise,
          setDetails: setDetails.map((set, setIndex) =>
            setIndex === currentSet - 1 ? { ...set, weight: nextWeight } : set,
          ),
        };
      }),
    );
  };

  const completeSession = (finalExercises: Exercise[], finalEvents: WorkoutSessionEvent[]) => {
    const completionEvent = createEvent(
      'session_completed',
      'Workout complete. Great job staying focused.',
      null,
      null,
    );
    const savedEvents = [...finalEvents, completionEvent];
    const savedSession = saveWorkoutHistory(finalExercises, savedEvents, startedAt, {
      goal: plan.goal,
      muscleGroup: plan.muscleGroup,
      duration: plan.duration,
      planSnapshot: plan,
    });
    const enrichedSession = savedSession
      ? (updateWorkoutSession(savedSession.id, {
          analytics: buildSessionAnalytics(savedSession),
        }) ?? savedSession)
      : null;
    void import('../services/supabaseWorkoutSync')
      .then(({ syncWorkoutSessionToSupabase }) => syncWorkoutSessionToSupabase(enrichedSession))
      .catch((error) => console.warn('Unable to load Supabase workout sync:', error));
    setEvents(savedEvents);
    setAudioMessage(completionEvent.message);
    onComplete(enrichedSession?.id ?? '', finalExercises);
  };

  const rememberCompletedExercise = (exerciseId: string) => {
    setCompletedExercises((previous) =>
      previous.includes(exerciseId) ? previous : [...previous, exerciseId],
    );
  };

  const handleSingleTap = () => {
    if (!currentExercise) return;

    if (isResting) {
      const message = `${getExerciseStartSpeech(currentExercise, currentSet)} Single tap when the set is complete.`;
      const restSkippedEvent = createEvent('rest_skipped', message);
      setEvents((previous) => [...previous, restSkippedEvent]);
      setIsResting(false);
      setRestTimeLeft(0);
      setAudioMessage(message);
      return;
    }

    const nextExercises = markSetCompleted(exercises, currentExerciseIndex, currentSet);
    setExercises(nextExercises);

    const setCompleteMessage = `Set ${currentSet} complete.`;
    const setCompletedEvent = createEvent('set_completed', setCompleteMessage);

    // ── Superset: A phase → jump to B, no rest ──────────────────────────
    const isOnA = currentExercise.isSuperset === true && supersetAIndex === null;
    if (isOnA && currentExerciseIndex + 1 < nextExercises.length) {
      const bIndex = currentExerciseIndex + 1;
      const bExercise = nextExercises[bIndex];
      const message = `${setCompleteMessage} Superset — ${getExerciseStartSpeech(bExercise, currentSet)}`;
      setEvents((previous) => [...previous, setCompletedEvent]);
      setSupersetAIndex(currentExerciseIndex);
      setCurrentExerciseIndex(bIndex);
      // currentSet stays — B does the same round number
      setIsResting(false);
      setRestTimeLeft(0);
      setAudioMessage(message);
      return;
    }

    // ── Superset: B phase → rest, then back to A's next round ───────────
    const isOnB = supersetAIndex !== null;
    if (isOnB) {
      const aIdx = supersetAIndex!;
      const aExercise = nextExercises[aIdx];
      const nextRound = currentSet + 1;
      setSupersetAIndex(null);

      if (nextRound <= aExercise.sets) {
        const restMessage = `Round ${currentSet} done. Rest ${aExercise.restTime} seconds, then ${getExerciseStartSpeech(aExercise, nextRound)}`;
        setEvents((previous) => [...previous, setCompletedEvent]);
        setCurrentExerciseIndex(aIdx);
        setCurrentSet(nextRound);
        setIsResting(true);
        setRestTimeLeft(aExercise.restTime);
        setAudioMessage(restMessage);
      } else {
        const bExercise = nextExercises[currentExerciseIndex];
        const doneEvent = createEvent(
          'exercise_completed',
          `Superset complete: ${aExercise.name} + ${bExercise.name}.`,
        );
        rememberCompletedExercise(aExercise.id);
        rememberCompletedExercise(bExercise.id);
        const afterBIndex = currentExerciseIndex + 1;
        if (afterBIndex < nextExercises.length) {
          const nextEx = nextExercises[afterBIndex];
          const message = `Superset done. Next: ${nextEx.name}. Rest ${aExercise.restTime} seconds, then ${getExerciseStartSpeech(nextEx, 1)}`;
          setEvents((previous) => [...previous, setCompletedEvent, doneEvent]);
          setCurrentExerciseIndex(afterBIndex);
          setCurrentSet(1);
          setIsResting(true);
          setRestTimeLeft(aExercise.restTime);
          setAudioMessage(message);
        } else {
          completeSession(nextExercises, [...events, setCompletedEvent, doneEvent]);
        }
      }
      return;
    }

    // ── Normal (non-superset) flow ───────────────────────────────────────
    const hasNextExercise = currentExerciseIndex < nextExercises.length - 1;

    if (currentSet < currentExercise.sets) {
      const restMessage = `${setCompleteMessage} Rest for ${currentExercise.restTime} seconds, then ${getExerciseStartSpeech(currentExercise, currentSet + 1)}`;
      const restEvent = createEvent('rest_started', restMessage, currentExercise, currentSet + 1);
      setEvents((previous) => [...previous, setCompletedEvent, restEvent]);
      setIsResting(true);
      setRestTimeLeft(currentExercise.restTime);
      setCurrentSet(currentSet + 1);
      setAudioMessage(restMessage);
      return;
    }

    const exerciseCompleteEvent = createEvent(
      'exercise_completed',
      `${currentExercise.name} complete.`,
    );
    rememberCompletedExercise(currentExercise.id);

    if (hasNextExercise) {
      const nextExercise = nextExercises[currentExerciseIndex + 1];
      const transitionMessage = `Exercise complete. Next: ${nextExercise.name}. Rest for ${currentExercise.restTime} seconds, then ${getExerciseStartSpeech(nextExercise, 1)}`;
      const restEvent = createEvent('rest_started', transitionMessage, nextExercise, 1);
      setEvents((previous) => [...previous, setCompletedEvent, exerciseCompleteEvent, restEvent]);
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setIsResting(true);
      setRestTimeLeft(currentExercise.restTime);
      setAudioMessage(transitionMessage);
      return;
    }

    completeSession(nextExercises, [...events, setCompletedEvent, exerciseCompleteEvent]);
  };

  const handleDoubleTap = () => {
    if (!currentExercise) return;

    const skipMessage = `Skipping ${currentExercise.name}.`;
    const skipEvent = createEvent('exercise_skipped', skipMessage);
    rememberCompletedExercise(currentExercise.id);

    if (currentExerciseIndex < exercises.length - 1) {
      const nextExercise = exercises[currentExerciseIndex + 1];
      const message = `${skipMessage} Next: ${getExerciseStartSpeech(nextExercise, 1)}`;
      setEvents((previous) => [...previous, skipEvent]);
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setIsResting(false);
      setRestTimeLeft(0);
      setAudioMessage(message);
      return;
    }

    completeSession(exercises, [...events, skipEvent]);
  };

  const handleTripleTap = () => {
    if (!currentExercise) return;

    if (currentExerciseIndex >= exercises.length - 1) {
      setShowReplacementPicker(true);
      setAudioMessage(
        `${currentExercise.name} is the last planned exercise. Choose a replacement on screen if this machine is busy.`,
      );
      return;
    }

    const newExercises = [...exercises];
    const currentEx = newExercises[currentExerciseIndex];

    newExercises.splice(currentExerciseIndex, 1);
    newExercises.push(currentEx);

    const nextExercise = newExercises[currentExerciseIndex];
    const message = `${currentEx.name} marked occupied and moved to end. Next: ${getExerciseStartSpeech(nextExercise, 1)}`;
    const occupiedEvent = createEvent('equipment_occupied', message, currentEx, undefined);

    setExercises(newExercises);
    setEvents((previous) => [...previous, occupiedEvent]);
    setCurrentSet(1);
    setIsResting(false);
    setRestTimeLeft(0);
    setAudioMessage(message);
  };

  const handleReplaceCurrentExercise = (template: ExerciseTemplate) => {
    if (!currentExercise) return;

    const previousExercise = currentExercise;
    const hasLoggedSets = previousExercise.setDetails?.some((set) => set.completed) ?? false;
    const adapted = adaptForGoal(template, plan.goal);
    const replacement: Exercise = {
      id: `swap-${Date.now()}-${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: adapted.name,
      sets: adapted.sets,
      reps: adapted.reps,
      restTime: adapted.restTime,
      muscleGroup: adapted.muscleGroup,
      isSuperset: hasLoggedSets ? false : previousExercise.isSuperset,
      setDetails: getRecommendedSets(adapted.name, adapted.sets, adapted.reps, adapted.muscleGroup),
    };
    const nextExercises = hasLoggedSets
      ? [
          ...exercises.slice(0, currentExerciseIndex),
          { ...previousExercise, isSuperset: false },
          replacement,
          ...exercises.slice(currentExerciseIndex + 1),
        ]
      : exercises.map((exercise, index) =>
          index === currentExerciseIndex ? replacement : exercise,
        );
    const replacementIndex = hasLoggedSets ? currentExerciseIndex + 1 : currentExerciseIndex;
    const message = `${previousExercise.name} marked unavailable. Switched to ${getExerciseStartSpeech(replacement, 1)} Single tap when the set is complete.`;
    const swapEvent = createEvent('equipment_occupied', message, previousExercise, undefined);

    setExercises(nextExercises);
    setEvents((previous) => [...previous, swapEvent]);
    setCurrentExerciseIndex(replacementIndex);
    setCurrentSet(1);
    setSupersetAIndex(null);
    setIsResting(false);
    setRestTimeLeft(0);
    setShowReplacementPicker(false);
    setAudioMessage(message);
  };

  // Short acknowledgement ticks so the user can hear that the earbud tap
  // was recognized before the speech/beep audio kicks in.
  const playAckTone = (kind: 'singleTap' | 'doubleTap' | 'tripleTap') => {
    const ticks = kind === 'singleTap' ? 1 : kind === 'doubleTap' ? 2 : 3;
    for (let i = 0; i < ticks; i++) {
      setTimeout(() => playTone(1500, 0.06, 0.25), i * 90);
    }
  };

  const flashAndRun = (kind: 'singleTap' | 'doubleTap' | 'tripleTap', run: () => void) => {
    setFlashTap(kind);
    setTimeout(() => setFlashTap((current) => (current === kind ? null : current)), 350);
    playAckTone(kind);
    run();
  };

  useEarbudControls(
    {
      onSingleTap: () => flashAndRun('singleTap', handleSingleTap),
      onDoubleTap: () => flashAndRun('doubleTap', handleDoubleTap),
      onTripleTap: () => flashAndRun('tripleTap', handleTripleTap),
    },
    true,
  );

  const toggleAudio = () => {
    setAudioEnabled((previous) => {
      const next = !previous;
      setUserSetting('audioGuidance', next);
      if (!next) {
        stop();
      }
      return next;
    });
  };

  return (
    <div className="size-full relative overflow-hidden flex flex-col bg-neutral-950">
      {/* Progress bar */}
      <div className="h-1 bg-neutral-800">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="px-4 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back to plan"
          className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-neutral-400">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
            <span className="text-neutral-600 ml-2">({completedExercises.length} completed)</span>
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">{plan.muscleGroup}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            aria-label={audioEnabled ? 'Disable audio guidance' : 'Enable audio guidance'}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${audioEnabled ? 'bg-blue-600 hover:bg-blue-500' : 'bg-neutral-800 hover:bg-neutral-700'}`}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={onBack}
            aria-label="Exit workout session"
            className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content — vertically centered */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {isResting ? (
            /* Rest view */
            <motion.div
              key="rest"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-5">
                <Bell
                  className={`w-5 h-5 ${restTimeLeft === 0 ? 'text-orange-500 animate-bounce' : 'text-neutral-500'}`}
                />
                <div className="text-neutral-400">Rest Time</div>
              </div>
              <div className="w-44 h-44 rounded-full bg-neutral-900 flex items-center justify-center mb-6 relative">
                {restTimeLeft === 0 && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-orange-500/20"
                    animate={{ scale: [1, 1.14, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-neutral-800"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-blue-600"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - restTimeLeft / (currentExercise?.restTime || 1))}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-6xl font-bold">{restTimeLeft}</div>
              </div>
              <div className="text-base text-neutral-300 mb-1">Next: {currentExercise?.name}</div>
              <div className="text-sm text-neutral-500 mb-2">
                Target: {getSetTargetDisplay(currentExercise, currentSet)}
              </div>
              {canAdjustWeight(currentExercise) && (
                <div className="mb-3">
                  <WeightAdjuster
                    exercise={currentExercise}
                    setNumber={currentSet}
                    onChange={updateCurrentSetWeight}
                  />
                </div>
              )}
              <div className="text-sm text-neutral-500 mb-4">Single tap to skip rest</div>
              <button
                type="button"
                onClick={() => setShowReplacementPicker(true)}
                className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200 hover:bg-orange-500/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Change next exercise
              </button>
            </motion.div>
          ) : (
            (() => {
              const isOnA = currentExercise?.isSuperset === true && supersetAIndex === null;
              const isOnB = supersetAIndex !== null;
              const isInSuperset = isOnA || isOnB;
              const partnerExercise = isOnA
                ? exercises[currentExerciseIndex + 1]
                : isOnB
                  ? exercises[supersetAIndex!]
                  : null;
              const supersetTotalRounds = isOnA
                ? currentExercise?.sets
                : isOnB
                  ? exercises[supersetAIndex!]?.sets
                  : 1;

              return (
                <motion.div
                  key={`ex-${currentExerciseIndex}-${supersetAIndex ?? 'a'}`}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="w-full"
                >
                  {isInSuperset && partnerExercise ? (
                    /* Superset dual-card view */
                    <div className="w-full px-1">
                      <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 rounded-full px-4 py-1.5">
                          <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-300">
                            SUPERSET · Round {currentSet} / {supersetTotalRounds}
                          </span>
                        </div>
                      </div>

                      {/* Active exercise */}
                      <div className="bg-neutral-900 border border-emerald-500/40 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="text-[10px] font-bold text-emerald-400 tracking-widest">
                            NOW
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowReplacementPicker(true)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-medium text-orange-200 hover:bg-orange-500/20 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Change
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            type="button"
                            onClick={() =>
                              setGuideExercise({
                                name: currentExercise!.name,
                                muscleGroup: currentExercise!.muscleGroup,
                              })
                            }
                            className="w-14 h-14 rounded-xl bg-neutral-950 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-blue-500 transition-all active:scale-95"
                          >
                            <img
                              src={getExerciseImageSrc(currentExercise!.name)}
                              alt={currentExercise!.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </button>
                          <div className="min-w-0">
                            <div className="font-bold text-base leading-tight">
                              {currentExercise!.name}
                            </div>
                            <div className="text-xs text-neutral-400 mt-0.5">
                              {currentExercise!.muscleGroup}
                            </div>
                            <div className="text-xs text-neutral-500 mt-1">
                              Target: {getSetTargetDisplay(currentExercise, currentSet)}
                            </div>
                            {canAdjustWeight(currentExercise) && (
                              <div className="mt-2">
                                <WeightAdjuster
                                  exercise={currentExercise}
                                  setNumber={currentSet}
                                  onChange={updateCurrentSetWeight}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="glass-dark rounded-xl p-3 text-center">
                            <AnimatePresence mode="popLayout">
                              <motion.div
                                key={currentSet}
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.7, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                className="text-2xl font-bold text-blue-400"
                              >
                                {currentSet}/{currentExercise!.sets}
                              </motion.div>
                            </AnimatePresence>
                            <div className="text-xs text-neutral-400">Sets</div>
                          </div>
                          <div className="glass-dark rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-white">
                              {getRepDisplay(currentExercise, currentSet)}
                            </div>
                            <div className="text-xs text-neutral-400">Reps</div>
                          </div>
                        </div>
                      </div>

                      {/* Chain connector */}
                      <div className="flex items-center justify-center my-2 gap-2">
                        <div className="flex-1 h-px bg-emerald-800/50" />
                        <Link2 className="w-4 h-4 text-emerald-700" />
                        <div className="flex-1 h-px bg-emerald-800/50" />
                      </div>

                      {/* Partner exercise (dimmed) */}
                      <div className="bg-neutral-900/60 border border-neutral-700/50 rounded-2xl p-4 opacity-55">
                        <div className="text-[10px] font-bold text-neutral-500 mb-2 tracking-widest">
                          NEXT
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-white overflow-hidden flex-shrink-0">
                            <img
                              src={getExerciseImageSrc(partnerExercise.name)}
                              alt={partnerExercise.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-base leading-tight">
                              {partnerExercise.name}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {partnerExercise.muscleGroup}
                            </div>
                            <div className="text-xs text-blue-300/80 mt-1">
                              {getSetTargetDisplay(partnerExercise, currentSet)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Normal single exercise view */
                    <div className="text-center w-full">
                      {currentExercise && (
                        <button
                          type="button"
                          onClick={() =>
                            setGuideExercise({
                              name: currentExercise.name,
                              muscleGroup: currentExercise.muscleGroup,
                            })
                          }
                          className="w-36 h-36 rounded-3xl bg-white mx-auto mb-5 overflow-hidden shadow-lg block hover:ring-2 hover:ring-blue-500 transition-all active:scale-95"
                          aria-label={`Open ${currentExercise.name} guide`}
                        >
                          <img
                            src={getExerciseImageSrc(currentExercise.name)}
                            alt={currentExercise.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </button>
                      )}
                      <h2 className="text-3xl font-bold mb-1">{currentExercise?.name}</h2>
                      <p className="text-base text-neutral-400 mb-3">
                        {currentExercise?.muscleGroup}
                      </p>
                      {currentExercise && (
                        <div className="mb-4 flex flex-col items-center gap-2 text-xs text-neutral-500">
                          <div>Target: {getSetTargetDisplay(currentExercise, currentSet)}</div>
                          <WeightAdjuster
                            exercise={currentExercise}
                            setNumber={currentSet}
                            onChange={updateCurrentSetWeight}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowReplacementPicker(true)}
                        className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200 hover:bg-orange-500/20 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Machine busy? Change exercise
                      </button>
                      <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                        <div className="glass-dark rounded-2xl p-4 shadow-lg text-center">
                          <AnimatePresence mode="popLayout">
                            <motion.div
                              key={currentSet}
                              initial={{ scale: 1.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.7, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                              className="text-4xl font-bold text-blue-400 mb-1"
                            >
                              {currentSet}/{currentExercise?.sets}
                            </motion.div>
                          </AnimatePresence>
                          <div className="text-sm text-neutral-400">Sets</div>
                        </div>
                        <div className="glass-dark rounded-2xl p-4 shadow-lg text-center">
                          <div className="text-4xl font-bold text-white mb-1">
                            {getRepDisplay(currentExercise, currentSet)}
                          </div>
                          <div className="text-sm text-neutral-400">Reps</div>
                        </div>
                        <div className="glass-dark rounded-2xl p-4 shadow-lg text-center">
                          <div
                            className={`font-bold text-orange-400 mb-1 leading-tight ${(currentExercise?.restTime ?? 0) >= 100 ? 'text-2xl' : 'text-4xl'}`}
                          >
                            {currentExercise?.restTime}s
                          </div>
                          <div className="text-sm text-neutral-400">Rest</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>
      </div>

      {/* Tap buttons + earbud guide */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={handleSingleTap}
            className={`flex flex-col items-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-900/50 active:scale-[0.97] ${
              flashTap === 'singleTap' ? 'ring-4 ring-emerald-400 scale-[1.04]' : ''
            }`}
          >
            <div className="w-11 h-11 rounded-full glass flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-white" />
            </div>
            <div className="text-xs font-medium">Single Tap</div>
          </button>
          <button
            onClick={handleDoubleTap}
            className={`flex flex-col items-center gap-2 py-4 rounded-2xl glass-dark hover:bg-white/10 transition-all shadow-lg active:scale-[0.97] ${
              flashTap === 'doubleTap' ? 'ring-4 ring-emerald-400 scale-[1.04]' : ''
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center gap-1">
              <div className="w-3 h-3 rounded-full bg-neutral-300" />
              <div className="w-3 h-3 rounded-full bg-neutral-300" />
            </div>
            <div className="text-xs font-medium">Double Tap</div>
          </button>
          <button
            onClick={handleTripleTap}
            className={`flex flex-col items-center gap-2 py-4 rounded-2xl glass-dark hover:bg-white/10 transition-all shadow-lg active:scale-[0.97] ${
              flashTap === 'tripleTap' ? 'ring-4 ring-emerald-400 scale-[1.04]' : ''
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            </div>
            <div className="text-xs font-medium">Triple Tap</div>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="glass-dark rounded-xl p-2.5">
            <div className="font-medium text-white mb-0.5">Single Tap</div>
            <div className="text-neutral-500">{isResting ? 'Skip rest' : 'Complete set'}</div>
          </div>
          <div className="glass-dark rounded-xl p-2.5">
            <div className="font-medium text-white mb-0.5">Double Tap</div>
            <div className="text-neutral-500">Skip exercise</div>
          </div>
          <div className="glass-dark rounded-xl p-2.5">
            <div className="font-medium text-white mb-0.5">Triple Tap</div>
            <div className="text-neutral-500">Move to end</div>
          </div>
        </div>
      </div>

      <ExerciseGuideSheet exercise={guideExercise} onClose={() => setGuideExercise(null)} />
      {showReplacementPicker && currentExercise && (
        <ReplacementPicker
          currentExercise={currentExercise}
          plannedExercises={exercises}
          onReplace={handleReplaceCurrentExercise}
          onClose={() => setShowReplacementPicker(false)}
        />
      )}
    </div>
  );
}
