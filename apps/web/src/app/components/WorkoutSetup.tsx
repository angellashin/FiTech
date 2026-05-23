import { useState } from 'react';
import { Sparkles, ArrowLeft, Wifi, WifiOff, ChevronDown, ChevronRight } from 'lucide-react';
import type { WorkoutGoal, MuscleGroup, WorkoutPlan, WorkoutIntensity } from '../domain/workout';
import { generateWorkoutPlanWithLLM } from '../services/llmWorkoutPlanner';
import {
  getGymProfile,
  saveGymProfile,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_LABELS,
  type Equipment,
} from '../utils/gymProfile';

interface WorkoutSetupProps {
  onPlanGenerated: (plan: WorkoutPlan) => void;
  onBack: () => void;
}

export function WorkoutSetup({ onPlanGenerated, onBack }: WorkoutSetupProps) {
  const [goal] = useState<WorkoutGoal>('strength');
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>(['chest']);
  const [duration, setDuration] = useState<number>(45);
  const [intensity, setIntensity] = useState<WorkoutIntensity>('normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [planSource, setPlanSource] = useState<'llm' | 'local' | null>(null);
  const [showGym, setShowGym] = useState(false);
  const [gymEquipment, setGymEquipment] = useState<Equipment[]>(() => getGymProfile().equipment);

  const toggleGymEquipment = (item: Equipment) => {
    const next = gymEquipment.includes(item)
      ? gymEquipment.filter((e) => e !== item)
      : [...gymEquipment, item];
    setGymEquipment(next);
    saveGymProfile({ equipment: next });
  };

  const muscleGroupOptions: { value: MuscleGroup; label: string }[] = [
    { value: 'chest', label: 'Chest' },
    { value: 'back', label: 'Back' },
    { value: 'shoulder', label: 'Shoulder' },
    { value: 'triceps', label: 'Triceps' },
    { value: 'biceps', label: 'Biceps' },
    { value: 'core', label: 'Core' },
    { value: 'lower-body', label: 'Lower Body' },
  ];

  const intensityOptions: { value: WorkoutIntensity; label: string; sub: string; color: string }[] =
    [
      {
        value: 'very-light',
        label: 'Very Light',
        sub: '−20%',
        color: 'from-sky-700 to-sky-800 border-sky-600',
      },
      {
        value: 'light',
        label: 'Light',
        sub: '−10%',
        color: 'from-blue-700 to-blue-800 border-blue-600',
      },
      {
        value: 'normal',
        label: 'Normal',
        sub: '±0%',
        color: 'from-green-700 to-green-800 border-green-600',
      },
      {
        value: 'hard',
        label: 'Hard',
        sub: '+10%',
        color: 'from-orange-700 to-orange-800 border-orange-600',
      },
      {
        value: 'very-hard',
        label: 'Very Hard',
        sub: '+20%',
        color: 'from-red-700 to-red-800 border-red-600',
      },
    ];

  const toggleMuscleGroup = (value: MuscleGroup) => {
    setMuscleGroups((prev) =>
      prev.includes(value)
        ? prev.length > 1
          ? prev.filter((g) => g !== value)
          : prev
        : [...prev, value],
    );
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    setPlanSource(null);
    const { plan, source } = await generateWorkoutPlanWithLLM(
      goal,
      muscleGroups,
      duration,
      intensity,
    );
    setPlanSource(source);
    setIsGenerating(false);
    onPlanGenerated(plan);
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
          {/* Muscle Groups */}
          <div>
            <label className="text-sm font-medium text-neutral-300 mb-3 block">
              Target Muscle Group
            </label>
            <div className="grid grid-cols-2 gap-3">
              {muscleGroupOptions.map((item) => (
                <button
                  key={item.value}
                  onClick={() => toggleMuscleGroup(item.value)}
                  className={`py-4 px-4 rounded-xl border-2 transition-all ${
                    muscleGroups.includes(item.value)
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 text-white shadow-lg shadow-blue-900/50 scale-[1.02]'
                      : 'glass-dark border-neutral-700/50 text-neutral-300 hover:border-neutral-600 hover:bg-white/5 shadow-lg'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm font-medium text-neutral-300 mb-3 block">
              Duration — <span className="text-blue-400 font-bold">{duration} min</span>
            </label>
            <div className="glass-dark rounded-2xl px-4 py-5 border border-neutral-700/50 shadow-lg">
              <input
                type="range"
                min={30}
                max={90}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-2 px-0.5">
                <span>30 min</span>
                <span>60 min</span>
                <span>90 min</span>
              </div>
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="text-sm font-medium text-neutral-300 mb-3 block">
              Workout Intensity
            </label>
            <div className="grid grid-cols-5 gap-2">
              {intensityOptions.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setIntensity(item.value)}
                  className={`py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${
                    intensity === item.value
                      ? `bg-gradient-to-br ${item.color} text-white shadow-lg scale-[1.04]`
                      : 'glass-dark border-neutral-700/50 text-neutral-400 hover:border-neutral-600 hover:bg-white/5'
                  }`}
                >
                  <span className="text-[10px] font-semibold leading-tight text-center px-0.5">
                    {item.label}
                  </span>
                  <span
                    className={`text-[10px] ${intensity === item.value ? 'text-white/70' : 'text-neutral-600'}`}
                  >
                    {item.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* My Gym */}
          <div>
            <button
              onClick={() => setShowGym((v) => !v)}
              className="w-full flex items-center justify-between py-1 mb-1"
            >
              <label className="text-sm font-medium text-neutral-300 cursor-pointer">
                My Gym Equipment
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">
                  {gymEquipment.length === 0 ? 'All exercises' : `${gymEquipment.length} selected`}
                </span>
                {showGym ? (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                )}
              </div>
            </button>
            {showGym && (
              <div className="glass-dark rounded-2xl p-4 space-y-4">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  AI will build workouts using only the equipment you select. If none are selected,
                  all exercises are available.
                </p>
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                      {cat.label}
                    </div>
                    <div className="space-y-1">
                      {cat.items.map((item) => {
                        const checked = gymEquipment.includes(item);
                        return (
                          <button
                            key={item}
                            onClick={() => toggleGymEquipment(item)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                checked ? 'bg-blue-600 border-blue-600' : 'border-neutral-600'
                              }`}
                            >
                              {checked && (
                                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                  <path
                                    d="M2 6l3 3 5-5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-sm ${checked ? 'text-white' : 'text-neutral-400'}`}
                            >
                              {EQUIPMENT_LABELS[item]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {gymEquipment.length > 0 && (
                  <button
                    onClick={() => {
                      setGymEquipment([]);
                      saveGymProfile({ equipment: [] });
                    }}
                    className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-3">
        {planSource === 'local' && (
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
            <WifiOff className="w-3 h-3" />
            <span>AI unavailable — generated with local planner</span>
          </div>
        )}
        <button
          onClick={generatePlan}
          disabled={isGenerating}
          className="w-full bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 disabled:from-neutral-800 disabled:to-neutral-900 text-white rounded-2xl py-5 px-8 flex items-center justify-center gap-3 transition-all disabled:cursor-not-allowed shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold">AI is building your plan...</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-semibold">Generate Plan</span>
              <Wifi className="w-4 h-4 opacity-60" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
