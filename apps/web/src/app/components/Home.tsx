import { Dumbbell, History, TrendingUp, Headphones, User } from 'lucide-react';

interface HomeProps {
  onStartWorkout: () => void;
  onGoToProfile: () => void;
}

export function Home({ onStartWorkout, onGoToProfile }: HomeProps) {
  const recentWorkouts = [
    { date: 'Today', type: 'Lower Body Strength', duration: '45 min', exercises: 5 },
    { date: 'Yesterday', type: 'Upper Body Strength', duration: '32 min', exercises: 5 },
    { date: 'Apr 26', type: 'Full Body Endurance', duration: '30 min', exercises: 4 },
  ];

  return (
    <div className="size-full flex flex-col bg-gradient-to-b from-[#0a0a0a] from-[8%] to-[#707070] to-[95%] overflow-auto">
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

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 shadow-xl border border-neutral-800/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold">Your Progress</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
              <div className="text-2xl font-bold text-blue-400">12</div>
              <div className="text-xs text-neutral-400 mt-1">This Week</div>
            </div>
            <div className="text-center bg-green-500/5 rounded-xl p-3 border border-green-500/10">
              <div className="text-2xl font-bold text-green-400">48</div>
              <div className="text-xs text-neutral-400 mt-1">This Month</div>
            </div>
            <div className="text-center bg-purple-500/5 rounded-xl p-3 border border-purple-500/10">
              <div className="text-2xl font-bold text-purple-400">127</div>
              <div className="text-xs text-neutral-400 mt-1">Total</div>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl p-6 border border-blue-500/20 shadow-xl overflow-hidden" style={{ backgroundImage: "linear-gradient(129.61deg, rgba(22, 36, 86, 0.4) 0%, rgb(23, 23, 23) 50%, rgb(10, 10, 10) 100%)" }}>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ backgroundImage: "linear-gradient(129.593deg, rgba(43, 127, 255, 0.05) 0%, rgba(0, 0, 0, 0) 100%)" }} />
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
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" style={{ animationDelay: '0.15s' }} />
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
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-0.5 text-sm">Triple Tap</div>
                  <div className="text-xs text-neutral-400">Move to next position (machine occupied)</div>
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

        <div className="flex-1 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl p-6 shadow-xl border border-neutral-800/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
              <History className="w-5 h-5 text-neutral-400" />
            </div>
            <h2 className="text-lg font-semibold">Recent Workouts</h2>
          </div>
          <div className="space-y-3">
            {recentWorkouts.map((workout, index) => (
              <div
                key={index}
                className="glass-dark rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-all group shadow-lg"
              >
                <div>
                  <div className="font-medium mb-1 group-hover:text-blue-400 transition-colors">{workout.type}</div>
                  <div className="text-sm text-neutral-400">
                    {workout.duration} • {workout.exercises} exercises
                  </div>
                </div>
                <div className="text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors">{workout.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
