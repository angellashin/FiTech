import { useState, useEffect } from 'react';
import { Volume2, VolumeX, X, Bell, Info } from 'lucide-react';
import type { WorkoutPlan, Exercise } from '../domain/workout';
import {
  saveWorkoutHistory,
  type WorkoutSessionEvent,
  type WorkoutSessionEventType,
} from '../utils/workoutHistory';
import { useAudioCoach } from '../hooks/useAudioCoach';
import { useEarbudControls } from '../hooks/useEarbudControls';

interface WorkoutSessionProps {
  plan: WorkoutPlan;
  onComplete: (exercises: Exercise[]) => void;
  onBack: () => void;
}

export function WorkoutSession({ plan, onComplete, onBack }: WorkoutSessionProps) {
  const [exercises, setExercises] = useState<Exercise[]>(plan.exercises);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [audioMessage, setAudioMessage] = useState<string>(
    'Audio guidance active. Single tap when you complete your first set.',
  );
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [events, setEvents] = useState<WorkoutSessionEvent[]>([]);
  const [startedAt] = useState(() => new Date().toISOString());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [flashTap, setFlashTap] = useState<'singleTap' | 'doubleTap' | 'tripleTap' | null>(null);
  const { isSupported: isAudioSupported, speak, stop } = useAudioCoach(audioEnabled);

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length || 1;
  const progress = (completedExercises.length / totalExercises) * 100;

  useEffect(() => {
    if (audioMessage) {
      speak(audioMessage);
    }
  }, [audioMessage, speak]);

  const playTone = (frequency: number, duration: number, volume = 0.35) => {
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
    } catch {}
  };

  useEffect(() => {
    if (isResting && restTimeLeft > 0) {
      const timer = setTimeout(() => {
        setRestTimeLeft(restTimeLeft - 1);
        if (restTimeLeft === 11) playTone(880, 0.35);      // 10s: 띵!
        if (restTimeLeft === 4)  playTone(660, 0.25);      // 3s: 띵
        if (restTimeLeft === 3)  playTone(880, 0.25);      // 2s: 띵
        if (restTimeLeft === 2)  playTone(1100, 0.25);     // 1s: 띵
        if (restTimeLeft === 1) {
          playTone(440, 1.2, 0.5);                         // 0s: 땅!
          setAudioMessage('Rest complete. Ready for next set.');
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isResting && restTimeLeft === 0) {
      setIsResting(false);
    }
  }, [isResting, restTimeLeft]);

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
    });
    void import('../services/supabaseWorkoutSync')
      .then(({ syncWorkoutSessionToSupabase }) => syncWorkoutSessionToSupabase(savedSession))
      .catch((error) => console.warn('Unable to load Supabase workout sync:', error));
    setEvents(savedEvents);
    setAudioMessage(completionEvent.message);
    onComplete(finalExercises);
  };

  const rememberCompletedExercise = (exerciseId: string) => {
    setCompletedExercises((previous) =>
      previous.includes(exerciseId) ? previous : [...previous, exerciseId],
    );
  };

  const handleSingleTap = () => {
    if (!currentExercise) return;

    if (isResting) {
      const message = `Starting set ${currentSet} of ${currentExercise.name}.`;
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

    if (currentSet < currentExercise.sets) {
      const restMessage = `${setCompleteMessage} Rest for ${currentExercise.restTime} seconds.`;
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

    if (currentExerciseIndex < nextExercises.length - 1) {
      const nextExercise = nextExercises[currentExerciseIndex + 1];
      const transitionMessage = `Exercise complete. Next: ${nextExercise.name}. Rest for ${currentExercise.restTime} seconds.`;
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
      const message = `${skipMessage} Next: ${nextExercise.name}.`;
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
      setAudioMessage('Already at the last exercise. No alternative order is available.');
      return;
    }

    const newExercises = [...exercises];
    const currentEx = newExercises[currentExerciseIndex];

    newExercises.splice(currentExerciseIndex, 1);
    newExercises.splice(currentExerciseIndex + 1, 0, currentEx);

    const nextExercise = newExercises[currentExerciseIndex];
    const message = `${currentEx.name} marked occupied and moved down. Next: ${nextExercise.name}.`;
    const occupiedEvent = createEvent('equipment_occupied', message, currentEx, undefined);

    setExercises(newExercises);
    setEvents((previous) => [...previous, occupiedEvent]);
    setCurrentSet(1);
    setIsResting(false);
    setRestTimeLeft(0);
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

  const earbud = useEarbudControls(
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
      if (previous) {
        stop();
      }
      return next;
    });
  };

  return (
    <div className="size-full flex flex-col bg-neutral-950">
      <div className="h-1 bg-neutral-800">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className="px-6 py-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-400">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
            <span className="text-neutral-600 ml-2">({completedExercises.length} completed)</span>
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {plan.goal} • {plan.muscleGroup}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiagnostics((v) => !v)}
            aria-label={showDiagnostics ? 'Hide earbud diagnostics' : 'Show earbud diagnostics'}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              earbud.active
                ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            <Info className="w-5 h-5" />
          </button>
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

      {showDiagnostics && (
        <div className="mx-6 mb-2 px-4 py-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <div className="font-medium">Earbud diagnostics</div>
            <button
              onClick={() => setShowDiagnostics(false)}
              aria-label="Close diagnostics"
              className="text-emerald-200/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>Platform: <span className="font-mono">{earbud.platform}</span></div>
          <div>Active: <span className="font-mono">{String(earbud.active)}</span></div>
          <div>Raw events received: <span className="font-mono">{earbud.rawEventCount}</span></div>
          <div>Last raw event: <span className="font-mono">{earbud.lastRawEvent ?? '—'}</span></div>
          <div>Last tap: <span className="font-mono">{earbud.lastTapKind ?? '—'}</span></div>
          {earbud.errors.length > 0 && (
            <div className="text-red-300">Errors: {earbud.errors.join(' · ')}</div>
          )}
          <div className="text-emerald-200/70 pt-1">
            Press your earbud button to see the counter go up. If "Raw events" stays at 0, the OS
            is not routing media keys to FiTech.
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {audioMessage && (
          <div className="mb-6 px-6 py-3 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
            <Volume2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-sm text-blue-100">{audioMessage}</div>
              <div className="text-xs text-blue-300/70 mt-1">
                {isAudioSupported
                  ? 'Browser speech guidance ready'
                  : 'Speech synthesis unsupported; showing text guidance'}
              </div>
            </div>
          </div>
        )}

        {isResting ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Bell
                className={`w-5 h-5 ${restTimeLeft === 0 ? 'text-orange-500 animate-bounce' : 'text-neutral-500'}`}
              />
              <div className="text-neutral-400">Rest Time</div>
            </div>
            <div className="w-48 h-48 rounded-full bg-neutral-900 flex items-center justify-center mb-8 relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-neutral-800"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-blue-600"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - restTimeLeft / (currentExercise?.restTime || 1))}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-6xl font-bold">{restTimeLeft}</div>
            </div>
            <div className="text-lg text-neutral-300 mb-4">Next: Set {currentSet}</div>
            <div className="text-sm text-neutral-500">Single tap to skip rest</div>
          </div>
        ) : (
          <div className="text-center w-full">
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Volume2 className="w-6 h-6 text-blue-500" />
                <div className="text-sm text-neutral-400">Audio Guidance Active</div>
              </div>
              <h2 className="text-4xl font-bold mb-2">{currentExercise?.name}</h2>
              <p className="text-lg text-neutral-400">{currentExercise?.muscleGroup}</p>
            </div>

            <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-8 mb-8 max-w-md mx-auto shadow-2xl border border-neutral-800/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <div className="relative grid grid-cols-3 gap-6">
                <div className="text-center glass-dark rounded-2xl p-4 shadow-lg">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {currentSet}/{currentExercise?.sets}
                  </div>
                  <div className="text-sm text-neutral-400">Sets</div>
                </div>
                <div className="text-center glass-dark rounded-2xl p-4 shadow-lg">
                  <div className="text-4xl font-bold text-white mb-2">{currentExercise?.reps}</div>
                  <div className="text-sm text-neutral-400">Reps</div>
                </div>
                <div className="text-center glass-dark rounded-2xl p-4 shadow-lg">
                  <div className={`font-bold text-orange-400 mb-2 leading-tight ${(currentExercise?.restTime ?? 0) >= 100 ? 'text-2xl' : 'text-4xl'}`}>
                    {currentExercise?.restTime}s
                  </div>
                  <div className="text-sm text-neutral-400">Rest</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={handleSingleTap}
            className={`flex flex-col items-center gap-2 px-4 py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-[1.02] active:scale-[0.98] ${
              flashTap === 'singleTap' ? 'ring-4 ring-emerald-400 scale-[1.05]' : ''
            }`}
          >
            <div className="w-12 h-12 rounded-full glass flex items-center justify-center shadow-inner">
              <div className="w-4 h-4 rounded-full bg-white shadow-lg shadow-white/50" />
            </div>
            <div className="text-xs font-medium">Single Tap</div>
          </button>
          <button
            onClick={handleDoubleTap}
            className={`flex flex-col items-center gap-2 px-4 py-4 rounded-2xl glass-dark hover:bg-white/10 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
              flashTap === 'doubleTap' ? 'ring-4 ring-emerald-400 scale-[1.05]' : ''
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center gap-1 shadow-inner">
              <div className="w-3 h-3 rounded-full bg-neutral-300 shadow-lg" />
              <div className="w-3 h-3 rounded-full bg-neutral-300 shadow-lg" />
            </div>
            <div className="text-xs font-medium">Double Tap</div>
          </button>
          <button
            onClick={handleTripleTap}
            className={`flex flex-col items-center gap-2 px-4 py-4 rounded-2xl glass-dark hover:bg-white/10 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
              flashTap === 'tripleTap' ? 'ring-4 ring-emerald-400 scale-[1.05]' : ''
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center gap-0.5 shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-lg" />
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-lg" />
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-lg" />
            </div>
            <div className="text-xs font-medium">Triple Tap</div>
          </button>
        </div>
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-4 border border-neutral-800/50 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-neutral-400">Earbud Controls</div>
            <div
              className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${
                earbud.active ? 'text-emerald-400' : 'text-neutral-500'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  earbud.active ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
                }`}
              />
              {earbud.platform === 'capacitor'
                ? 'Native'
                : earbud.platform === 'mediasession'
                  ? 'Browser'
                  : 'Off'}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="glass-dark rounded-lg p-2">
              <div className="font-medium text-white mb-1">Single Tap</div>
              <div className="text-neutral-500">Complete set / Skip rest</div>
            </div>
            <div className="glass-dark rounded-lg p-2">
              <div className="font-medium text-white mb-1">Double Tap</div>
              <div className="text-neutral-500">Skip exercise</div>
            </div>
            <div className="glass-dark rounded-lg p-2">
              <div className="font-medium text-white mb-1">Triple Tap</div>
              <div className="text-neutral-500">Mark occupied / Move down</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
