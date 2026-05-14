import { useState } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import type { WorkoutGoal, MuscleGroup, WorkoutPlan } from '../domain/workout';
import { generateWorkoutPlan } from '../services/workoutPlanner';

interface WorkoutSetupProps {
  onPlanGenerated: (plan: WorkoutPlan) => void;
  onBack: () => void;
}

export function WorkoutSetup({ onPlanGenerated, onBack }: WorkoutSetupProps) {
  const [goal] = useState<WorkoutGoal>('strength');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest');
  const [duration, setDuration] = useState<number>(45);
  const [isGenerating, setIsGenerating] = useState(false);

  const muscleGroups: { value: MuscleGroup; label: string }[] = [
    { value: 'chest', label: 'Chest' },
    { value: 'back', label: 'Back' },
    { value: 'shoulder', label: 'Shoulder' },
    { value: 'triceps', label: 'Triceps' },
    { value: 'biceps', label: 'Biceps' },
    { value: 'core', label: 'Core' },
    { value: 'lower-body', label: 'Lower Body' },
  ];

  const durations = [30, 45, 60];

  const generatePlan = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const plan: WorkoutPlan = generateWorkoutPlan(goal, muscleGroup, duration);
      setIsGenerating(false);
      onPlanGenerated(plan);
    }, 800);
  };

  return (
    <div className="size-full flex flex-col">
      <header className="px-6 py-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Setup Workout</h1>
          <p className="text-sm text-neutral-400">AI will create your plan</p>
        </div>
      </header>

      <div className="flex-1 px-6 pb-6 overflow-auto">
        <div className="space-y-8">
          <div>
            <label className="text-sm font-medium text-neutral-300 mb-3 block">
              Target Muscle Group
            </label>
            <div className="grid grid-cols-2 gap-3">
              {muscleGroups.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setMuscleGroup(item.value)}
                  className={`py-4 px-4 rounded-xl border-2 transition-all ${
                    muscleGroup === item.value
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 text-white shadow-lg shadow-blue-900/50 scale-[1.02]'
                      : 'glass-dark border-neutral-700/50 text-neutral-300 hover:border-neutral-600 hover:bg-white/5 shadow-lg'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-300 mb-3 block">Duration</label>
            <div className="grid grid-cols-3 gap-3">
              {durations.map((min) => (
                <button
                  key={min}
                  onClick={() => setDuration(min)}
                  className={`py-4 px-4 rounded-xl border-2 transition-all ${
                    duration === min
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 text-white shadow-lg shadow-blue-900/50 scale-[1.02]'
                      : 'glass-dark border-neutral-700/50 text-neutral-300 hover:border-neutral-600 hover:bg-white/5 shadow-lg'
                  }`}
                >
                  <div className="text-2xl font-bold">{min}</div>
                  <div className="text-xs mt-1 opacity-80">min</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <button
          onClick={generatePlan}
          disabled={isGenerating}
          className="w-full bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 disabled:from-neutral-800 disabled:to-neutral-900 text-white rounded-2xl py-5 px-8 flex items-center justify-center gap-3 transition-all disabled:cursor-not-allowed shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold">Generating Plan...</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-semibold">Generate Plan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
