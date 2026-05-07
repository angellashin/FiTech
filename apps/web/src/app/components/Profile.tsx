import {
  ArrowLeft,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Headphones,
  Bell,
  Moon,
  ChevronRight,
  LogOut,
  Edit,
} from 'lucide-react';
import { getLastCloudSyncStatus } from '../services/cloudSyncStatus';
import { getAllHistory, getAllSessions } from '../utils/workoutHistory';

interface ProfileProps {
  onBackToHome: () => void;
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(date),
  );

const getCurrentStreak = (sessionDates: string[]) => {
  const uniqueDays = Array.from(new Set(sessionDates.map((date) => date.slice(0, 10))))
    .sort()
    .reverse();
  if (uniqueDays.length === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  for (const day of uniqueDays) {
    const expected = cursor.toISOString().slice(0, 10);
    if (day === expected) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      if (day === cursor.toISOString().slice(0, 10)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
};

export function Profile({ onBackToHome }: ProfileProps) {
  const sessions = getAllSessions();
  const history = getAllHistory();
  const userName = localStorage.getItem('fitech_user_name') || 'Kim Minji';
  const initials =
    userName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'FT';
  const now = new Date();
  const sessionsThisMonth = sessions.filter((session) => {
    const completedAt = new Date(session.completedAt);
    return (
      completedAt.getFullYear() === now.getFullYear() && completedAt.getMonth() === now.getMonth()
    );
  });
  const currentStreak = getCurrentStreak(sessions.map((session) => session.completedAt));
  const bestByExercise = Array.from(
    history
      .reduce((records, item) => {
        const topSet = item.setDetails.reduce(
          (best, set) => (set.weight > best.weight ? set : best),
          item.setDetails[0],
        );
        const existing = records.get(item.exerciseName);
        if (!existing || topSet.weight > existing.weight) {
          records.set(item.exerciseName, {
            exercise: item.exerciseName,
            weight: topSet.weight,
            reps: topSet.reps,
            date: item.date,
          });
        }
        return records;
      }, new Map<string, { exercise: string; weight: number; reps: number; date: string }>())
      .values(),
  ).slice(0, 3);

  const stats = [
    {
      label: 'Total Workouts',
      value: sessions.length.toString(),
      icon: TrendingUp,
      color: 'text-blue-500',
    },
    {
      label: 'Current Streak',
      value: `${currentStreak} days`,
      icon: Target,
      color: 'text-green-500',
    },
    {
      label: 'Achievements',
      value: bestByExercise.length.toString(),
      icon: Award,
      color: 'text-yellow-500',
    },
    {
      label: 'This Month',
      value: sessionsThisMonth.length.toString(),
      icon: Calendar,
      color: 'text-purple-500',
    },
  ];

  const lastCloudSync = getLastCloudSyncStatus();
  const cloudSyncLabel = lastCloudSync
    ? lastCloudSync.ok
      ? `Synced ${formatDate(lastCloudSync.syncedAt ?? new Date().toISOString())}`
      : lastCloudSync.message
    : 'Complete a workout to sync';

  const settings = [
    { label: 'Audio Guidance', icon: Headphones, enabled: true },
    { label: 'Rest Notifications', icon: Bell, enabled: true },
    { label: 'Dark Mode', icon: Moon, enabled: true },
  ];

  const personalRecords =
    bestByExercise.length > 0
      ? bestByExercise.map((record) => ({
          exercise: record.exercise,
          record:
            record.weight > 0 ? `${record.weight} kg × ${record.reps}` : `${record.reps} reps`,
          date: formatDate(record.date),
        }))
      : [
          { exercise: 'Squats', record: 'No record yet', date: 'Complete a workout' },
          { exercise: 'Bench Press', record: 'No record yet', date: 'Complete a workout' },
          { exercise: 'Deadlift', record: 'No record yet', date: 'Complete a workout' },
        ];

  return (
    <div className="size-full flex flex-col bg-neutral-950 overflow-auto">
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-neutral-950/95 backdrop-blur-sm z-10">
        <button
          onClick={onBackToHome}
          className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Profile</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 pb-8">
        <div className="relative bg-gradient-to-br from-blue-950/50 via-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 border border-blue-500/20 shadow-2xl overflow-hidden card-glow">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-2xl font-bold shadow-xl shadow-blue-900/50">
                {initials}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{userName}</h2>
                <p className="text-sm text-neutral-400">Strength Training • 6 months</p>
              </div>
              <button className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center hover:bg-neutral-700 transition-colors">
                <Edit className="w-5 h-5" />
              </button>
            </div>
            <div className="glass-dark rounded-xl p-4 shadow-lg">
              <div className="text-sm text-neutral-400 mb-2">Current Goal</div>
              <div className="text-lg font-semibold text-blue-300">
                Build Muscle & Stay Consistent
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="glass-dark rounded-2xl p-4 shadow-lg hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                    <div className="text-xs text-neutral-400">{stat.label}</div>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50">
          <h3 className="text-lg font-semibold mb-4">Cloud Sync</h3>
          <div className="glass-dark rounded-xl p-4 shadow-lg">
            <div className="text-sm text-neutral-400 mb-1">Supabase status</div>
            <div
              className={lastCloudSync?.ok ? 'text-green-400 font-semibold' : 'text-neutral-300'}
            >
              {cloudSyncLabel}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50">
          <h3 className="text-lg font-semibold mb-4">Personal Records</h3>
          <div className="space-y-3">
            {personalRecords.map((record, index) => (
              <div
                key={index}
                className="glass-dark rounded-xl p-4 flex items-center justify-between shadow-lg hover:bg-white/5 transition-all"
              >
                <div>
                  <div className="font-medium mb-1">{record.exercise}</div>
                  <div className="text-sm text-neutral-400">{record.date}</div>
                </div>
                <div className="text-lg font-bold text-blue-400">{record.record}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="space-y-1">
            {settings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <button
                  key={index}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-neutral-400" />
                    <span className="font-medium">{setting.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        setting.enabled ? 'bg-blue-600' : 'bg-neutral-700'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          setting.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors">
            <span className="font-medium">About FiTech</span>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors">
            <span className="font-medium">Help & Support</span>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </button>
          <button className="w-full flex items-center justify-center gap-3 p-4 bg-red-950/30 border border-red-900/30 rounded-xl hover:bg-red-950/50 transition-colors text-red-400">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>FiTech v1.0.0</p>
          <p className="mt-1">A Screenless Fitness Experience</p>
        </div>
      </div>
    </div>
  );
}
