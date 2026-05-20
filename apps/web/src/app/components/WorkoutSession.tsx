import { useCallback, useState, useEffect } from 'react';
import { Volume2, VolumeX, X, Bell, Link2 } from 'lucide-react';
import type { WorkoutPlan, Exercise } from '../domain/workout';
import { getExerciseImageSrc } from '../services/exerciseGuide';
import {
  saveWorkoutHistory,
  updateWorkoutSession,
  type WorkoutSessionEvent,
  type WorkoutSessionEventType,
} from '../utils/workoutHistory';
import { useAudioCoach } from '../hooks/useAudioCoach';
import { useEarbudControls } from '../hooks/useEarbudControls';
import { getUserSettings, setUserSetting } from '../utils/userSettings';
import { buildSessionAnalytics } from '../services/workoutAnalytics';

interface WorkoutSessionProps {
  plan: WorkoutPlan;
  onComplete: (sessionId: string, exercises: Exercise[]) => void;
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
  const { audioGuidance: savedAudioGuidance, restNotifications: restNotificationsEnabled } =
    getUserSettings();
  const [audioEnabled, setAudioEnabled] = useState(savedAudioGuidance);
  const [flashTap, setFlashTap] = useState<'singleTap' | 'doubleTap' | 'tripleTap' | null>(null);
  // null = not in superset; number = index of the A exercise (we're currently on B)
  const [supersetAIndex, setSupersetAIndex] = useState<number | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const { isSupported: isAudioSupported, speak, stop } = useAudioCoach(audioEnabled);

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
          setAudioMessage('Rest complete. Ready for next set.');
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isResting && restTimeLeft === 0) {
      setIsResting(false);
    }
  }, [isResting, playTone, restNotificationsEnabled, restTimeLeft]);

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

    // ── Superset: A phase → jump to B, no rest ──────────────────────────
    const isOnA = currentExercise.isSuperset === true && supersetAIndex === null;
    if (isOnA && currentExerciseIndex + 1 < nextExercises.length) {
      const bIndex = currentExerciseIndex + 1;
      const bExercise = nextExercises[bIndex];
      const message = `${setCompleteMessage} Superset — now ${bExercise.name}!`;
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
        const restMessage = `Round ${currentSet} done. Rest ${aExercise.restTime}s.`;
        setEvents((previous) => [...previous, setCompletedEvent]);
        setCurrentExerciseIndex(aIdx);
        setCurrentSet(nextRound);
        setIsResting(true);
        setRestTimeLeft(aExercise.restTime);
        setAudioMessage(restMessage);
      } else {
        const bExercise = nextExercises[currentExerciseIndex];
        const doneEvent = createEvent('exercise_completed', `Superset complete: ${aExercise.name} + ${bExercise.name}.`);
        rememberCompletedExercise(aExercise.id);
        rememberCompletedExercise(bExercise.id);
        const afterBIndex = currentExerciseIndex + 1;
        if (afterBIndex < nextExercises.length) {
          const nextEx = nextExercises[afterBIndex];
          const message = `Superset done! Next: ${nextEx.name}.`;
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
      const restMessage = `${setCompleteMessage} Rest for ${currentExercise.restTime} seconds.`;
      const restEvent = createEvent('rest_started', restMessage, currentExercise, currentSet + 1);
      setEvents((previous) => [...previous, setCompletedEvent, restEvent]);
      setIsResting(true);
      setRestTimeLeft(currentExercise.restTime);
      setCurrentSet(currentSet + 1);
      setAudioMessage(restMessage);
      return;
    }

    const exerciseCompleteEvent = createEvent('exercise_completed', `${currentExercise.name} complete.`);
    rememberCompletedExercise(currentExercise.id);

    if (hasNextExercise) {
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
    newExercises.push(currentEx);

    const nextExercise = newExercises[currentExerciseIndex];
    const message = `${currentEx.name} marked occupied and moved to end. Next: ${nextExercise.name}.`;
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
    <div className="size-full flex flex-col bg-neutral-950">
      {/* Progress bar */}
      <div className="h-1 bg-neutral-800">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <div>
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
        {isResting ? (
          /* Rest view */
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-5">
              <Bell
                className={`w-5 h-5 ${restTimeLeft === 0 ? 'text-orange-500 animate-bounce' : 'text-neutral-500'}`}
              />
              <div className="text-neutral-400">Rest Time</div>
            </div>
            <div className="w-44 h-44 rounded-full bg-neutral-900 flex items-center justify-center mb-6 relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="8" fill="none" className="text-neutral-800" />
                <circle
                  cx="88" cy="88" r="80"
                  stroke="currentColor" strokeWidth="8" fill="none"
                  className="text-blue-600"
                  strokeDasharray={`${2 * Math.PI * 80}`}
                  strokeDashoffset={`${2 * Math.PI * 80 * (1 - restTimeLeft / (currentExercise?.restTime || 1))}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-6xl font-bold">{restTimeLeft}</div>
            </div>
            <div className="text-base text-neutral-300 mb-1">Next: Set {currentSet}</div>
            <div className="text-sm text-neutral-500">Single tap to skip rest</div>
          </div>
        ) : (() => {
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

          return isInSuperset && partnerExercise ? (
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
                <div className="text-[10px] font-bold text-emerald-400 mb-2 tracking-widest">NOW</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-white overflow-hidden flex-shrink-0">
                    <img
                      src={getExerciseImageSrc(currentExercise!.name)}
                      alt={currentExercise!.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-base leading-tight">{currentExercise!.name}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{currentExercise!.muscleGroup}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="glass-dark rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{currentSet}/{currentExercise!.sets}</div>
                    <div className="text-xs text-neutral-400">Sets</div>
                  </div>
                  <div className="glass-dark rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-white">{currentExercise!.reps}</div>
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
                <div className="text-[10px] font-bold text-neutral-500 mb-2 tracking-widest">NEXT</div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white overflow-hidden flex-shrink-0">
                    <img
                      src={getExerciseImageSrc(partnerExercise.name)}
                      alt={partnerExercise.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-base leading-tight">{partnerExercise.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{partnerExercise.muscleGroup}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Normal single exercise view */
            <div className="text-center w-full">
              {currentExercise && (
                <div className="w-36 h-36 rounded-3xl bg-white mx-auto mb-5 overflow-hidden shadow-lg">
                  <img
                    src={getExerciseImageSrc(currentExercise.name)}
                    alt={currentExercise.name}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <h2 className="text-3xl font-bold mb-1">{currentExercise?.name}</h2>
              <p className="text-base text-neutral-400 mb-6">{currentExercise?.muscleGroup}</p>
              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                <div className="glass-dark rounded-2xl p-4 shadow-lg text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-1">
                    {currentSet}/{currentExercise?.sets}
                  </div>
                  <div className="text-sm text-neutral-400">Sets</div>
                </div>
                <div className="glass-dark rounded-2xl p-4 shadow-lg text-center">
                  <div className="text-4xl font-bold text-white mb-1">{currentExercise?.reps}</div>
                  <div className="text-sm text-neutral-400">Reps</div>
                </div>
                <div className="glass-dark rounded-2xl p-4 shadow-lg text-center">
                  <div className={`font-bold text-orange-400 mb-1 leading-tight ${(currentExercise?.restTime ?? 0) >= 100 ? 'text-2xl' : 'text-4xl'}`}>
                    {currentExercise?.restTime}s
                  </div>
                  <div className="text-sm text-neutral-400">Rest</div>
                </div>
              </div>
            </div>
          );
        })()}
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
    </div>
  );
}
