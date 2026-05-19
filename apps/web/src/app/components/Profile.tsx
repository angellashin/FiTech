import { useState } from 'react';
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
  ChevronDown,
  LogOut,
  Edit,
  Info,
  HelpCircle,
} from 'lucide-react';
import { getLastCloudSyncStatus } from '../services/cloudSyncStatus';
import { clearWorkoutData, getAllSessions } from '../utils/workoutHistory';
import { getUserSettings, setUserSetting, applyDarkMode } from '../utils/userSettings';
import { getPersonalRecords } from '../services/workoutAnalytics';

interface ProfileProps {
  onBackToHome: () => void;
  onLogout: () => void;
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

export function Profile({ onBackToHome, onLogout }: ProfileProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const savedSettings = getUserSettings();
  const [audioGuidance, setAudioGuidance] = useState(savedSettings.audioGuidance);
  const [restNotifications, setRestNotifications] = useState(savedSettings.restNotifications);
  const [darkMode, setDarkMode] = useState(savedSettings.darkMode);

  const toggleAudioGuidance = () => {
    const next = !audioGuidance;
    setAudioGuidance(next);
    setUserSetting('audioGuidance', next);
  };

  const toggleRestNotifications = () => {
    const next = !restNotifications;
    setRestNotifications(next);
    setUserSetting('restNotifications', next);
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    setUserSetting('darkMode', next);
    applyDarkMode(next);
  };

  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editColorIndex, setEditColorIndex] = useState(0);

  const faqs = [
    {
      q: 'How do earbud controls work?',
      a: 'During a workout session, press your earbud button once to complete a set, twice to skip to the next exercise, and three times to mark a machine as occupied and move on. On Android, the native media button is detected automatically. In a browser, the Web MediaSession API is used as a fallback — keep the tab active for best results.',
    },
    {
      q: 'Why is audio guidance not speaking?',
      a: 'Make sure Audio Guidance is enabled in Settings. On first load, your browser may require a user interaction before allowing speech synthesis — tap anywhere on the screen to unlock it. Also check that your device volume is not muted.',
    },
    {
      q: 'How are weights recommended?',
      a: "FiTech uses a conservative 3-step system: (1) If you've done this exercise before, it carries forward the last completed working sets instead of assuming overnight strength gains. (2) If the exercise is new but you've trained the same muscle group, it estimates from your recent strength base and scales by movement type, so a fly or raise does not copy a bench-press weight. (3) If this is your first time, it defaults to 20 kg (0 kg for bodyweight exercises). Workout intensity and recovery signals can still adjust the final load.",
    },
    {
      q: 'What does Workout Intensity do?',
      a: 'Intensity scales the recommended weight by a multiplier: Very Light ×0.80, Light ×0.90, Normal ×1.00, Hard ×1.10, Very Hard ×1.20. The result is always rounded to the nearest 2.5 kg to match standard plate increments. Bodyweight exercises always stay at 0 kg regardless of intensity.',
    },
    {
      q: 'How do I load a previous workout?',
      a: "On the Home screen, tap any session under Recent Workouts to expand it and see the exercise list. Then tap 'Load This Workout' to go directly to the Plan Preview with that exact exercise lineup — weights are carried over from when you last did it.",
    },
    {
      q: 'Where is my workout data stored?',
      a: "All data is saved locally in your browser's localStorage under the keys fitech_workout_sessions and fitech_workout_history. If Supabase cloud sync is active, a backup is also written to the cloud. Clearing your browser data will erase local history.",
    },
    {
      q: 'Can I edit my workout plan before starting?',
      a: 'Yes. On the Plan Preview screen you can directly edit the weight, reps, and rest time for each set inline. Tap Edit to switch to list mode where you can reorder exercises by dragging or delete them. Use + Add Exercise to pick additional exercises from the full library, filtered by muscle group.',
    },
    {
      q: 'Does FiTech work without internet?',
      a: 'Yes. All core features — workout generation, session tracking, audio guidance, and history — work fully offline. Cloud sync to Supabase is optional and the app falls back to local-only mode automatically if no connection is available.',
    },
  ];

  const avatarColors = [
    'from-blue-600 to-blue-400',
    'from-violet-600 to-violet-400',
    'from-emerald-600 to-emerald-400',
    'from-rose-600 to-rose-400',
    'from-orange-500 to-amber-400',
  ];

  const [userName, setUserName] = useState(
    () => localStorage.getItem('fitech_user_name') || 'Kim Minji',
  );
  const [userGoal, setUserGoal] = useState(
    () => localStorage.getItem('fitech_user_goal') || 'Build Muscle & Stay Consistent',
  );
  const [avatarColorIndex, setAvatarColorIndex] = useState(() =>
    Number(localStorage.getItem('fitech_avatar_color') ?? 0),
  );

  const openEditModal = () => {
    setEditName(userName);
    setEditGoal(userGoal);
    setEditColorIndex(avatarColorIndex);
    setShowEditModal(true);
  };

  const saveProfile = () => {
    const trimmedName = editName.trim() || userName;
    const trimmedGoal = editGoal.trim() || userGoal;
    setUserName(trimmedName);
    setUserGoal(trimmedGoal);
    setAvatarColorIndex(editColorIndex);
    localStorage.setItem('fitech_user_name', trimmedName);
    localStorage.setItem('fitech_last_user_name', trimmedName);
    localStorage.setItem('fitech_user_goal', trimmedGoal);
    localStorage.setItem('fitech_avatar_color', String(editColorIndex));
    setShowEditModal(false);
  };

  const sessions = getAllSessions();
  // dataVersion forces this screen to re-read localStorage after destructive data actions.
  void dataVersion;
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
  const allPersonalRecords = getPersonalRecords(sessions);
  const visiblePersonalRecords = showAllRecords
    ? allPersonalRecords
    : allPersonalRecords.slice(0, 3);

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
      value: allPersonalRecords.length.toString(),
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
    {
      label: 'Audio Guidance',
      icon: Headphones,
      enabled: audioGuidance,
      onToggle: toggleAudioGuidance,
    },
    {
      label: 'Rest Notifications',
      icon: Bell,
      enabled: restNotifications,
      onToggle: toggleRestNotifications,
    },
    { label: 'Dark Mode', icon: Moon, enabled: darkMode, onToggle: toggleDarkMode },
  ];

  const personalRecords =
    visiblePersonalRecords.length > 0
      ? visiblePersonalRecords.map((record) => ({
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

  const handleClearHistory = () => {
    clearWorkoutData();
    setDataVersion((current) => current + 1);
    setShowClearConfirm(false);
  };

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
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarColors[avatarColorIndex]} flex items-center justify-center text-2xl font-bold shadow-xl shadow-blue-900/50`}
              >
                {initials}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{userName}</h2>
                <p className="text-sm text-neutral-400">Strength Training</p>
              </div>
              <button
                onClick={openEditModal}
                className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center hover:bg-neutral-700 transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
            <div className="glass-dark rounded-xl p-4 shadow-lg">
              <div className="text-sm text-neutral-400 mb-2">Current Goal</div>
              <div className="text-lg font-semibold text-blue-300">{userGoal}</div>
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

        {lastCloudSync && (
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50">
            <h3 className="text-lg font-semibold mb-4">Cloud Sync</h3>
            <div className="glass-dark rounded-xl p-4 shadow-lg">
              <div className="text-sm text-neutral-400 mb-1">Supabase status</div>
              <div
                className={lastCloudSync.ok ? 'text-green-400 font-semibold' : 'text-neutral-300'}
              >
                {cloudSyncLabel}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50">
          <h3 className="text-lg font-semibold mb-4">Personal Records</h3>

          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-red-900/30">
            <h3 className="text-lg font-semibold mb-2 text-red-200">Data Management</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Clear local workout sessions and set history when you want a fresh training baseline.
              Saved routines stay available.
            </p>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 py-3 text-sm font-semibold text-red-200 transition-colors"
            >
              Clear Workout History
            </button>
          </div>

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
          {allPersonalRecords.length > 3 && (
            <button
              onClick={() => setShowAllRecords((current) => !current)}
              className="w-full mt-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-3 text-sm text-neutral-200 transition-colors"
            >
              {showAllRecords ? 'Show top 3' : `View all ${allPersonalRecords.length} records`}
            </button>
          )}
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-6 mb-6 shadow-2xl border border-neutral-800/50">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="space-y-1">
            {settings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <button
                  key={index}
                  onClick={setting.onToggle}
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
          {/* About FiTech */}
          <div className="bg-neutral-900 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAbout((v) => !v)}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-neutral-400" />
                <span className="font-medium">About FiTech</span>
              </div>
              {showAbout ? (
                <ChevronDown className="w-5 h-5 text-neutral-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              )}
            </button>
            {showAbout && (
              <div className="px-4 pb-5 space-y-4 border-t border-neutral-800">
                <div className="pt-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-900/40">
                    F
                  </div>
                  <div>
                    <div className="font-bold text-lg">FiTech</div>
                    <div className="text-sm text-neutral-400">Version 1.0.0</div>
                  </div>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  FiTech is a screenless, voice-first workout app designed for the gym floor.
                  Control your entire session with earbud taps — no screen-glancing required.
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Platform', value: 'Web + Android APK (Capacitor)' },
                    { label: 'Audio', value: 'Web Speech API + Web Audio API' },
                    { label: 'Storage', value: 'localStorage + Supabase (optional)' },
                    { label: 'Earbud control', value: 'Android MediaSession / Web MediaSession' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-neutral-500">{label}</span>
                      <span className="text-neutral-300">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-600 pt-1">
                  Built as an HCI course project · Korea University
                </p>
              </div>
            )}
          </div>

          {/* Help & Support */}
          <div className="bg-neutral-900 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowHelp((v) => !v)}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-neutral-400" />
                <span className="font-medium">Help & Support</span>
              </div>
              {showHelp ? (
                <ChevronDown className="w-5 h-5 text-neutral-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              )}
            </button>
            {showHelp && (
              <div className="border-t border-neutral-800 divide-y divide-neutral-800">
                {faqs.map((faq, i) => (
                  <div key={i}>
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                      className="w-full flex items-start justify-between gap-3 px-4 py-4 text-left hover:bg-neutral-800/60 transition-colors"
                    >
                      <span className="text-sm font-medium leading-snug">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-500 shrink-0 mt-0.5 transition-transform ${
                          openFaqIndex === i ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFaqIndex === i && (
                      <div className="px-4 pb-4 text-sm text-neutral-400 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-3 p-4 bg-red-950/30 border border-red-900/30 rounded-xl hover:bg-red-950/50 transition-colors text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>FiTech v1.0.0</p>
          <p className="mt-1">A Screenless Fitness Experience</p>
        </div>
      </div>

      {showClearConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="relative bg-neutral-900 rounded-2xl p-6 w-full shadow-2xl animate-fade-in border border-red-500/30">
            <h3 className="text-lg font-semibold mb-2">Clear workout history?</h3>
            <p className="text-sm text-neutral-400 mb-6">
              This removes local sessions and set history. Saved routines stay available.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm Dialog */}
      {showLogoutConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-neutral-900 rounded-2xl p-6 w-full shadow-2xl animate-fade-in">
            <h3 className="text-lg font-semibold mb-2">Log Out</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Your workout history stays saved on this device. You'll need to enter your name again
              on next launch.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 transition-colors font-medium"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Bottom Sheet */}
      {showEditModal && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          {/* sheet */}
          <div className="relative bg-neutral-900 rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl animate-fade-in">
            <div className="w-10 h-1 rounded-full bg-neutral-700 mx-auto mb-6" />
            <h2 className="text-lg font-semibold mb-6">Edit Profile</h2>

            {/* Avatar color picker */}
            <div className="mb-6">
              <div className="text-sm text-neutral-400 mb-3">Avatar Color</div>
              <div className="flex gap-3">
                {avatarColors.map((gradient, i) => (
                  <button
                    key={i}
                    onClick={() => setEditColorIndex(i)}
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold transition-all ${
                      editColorIndex === i
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110'
                        : 'opacity-60 hover:opacity-90'
                    }`}
                  >
                    {editColorIndex === i ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div className="mb-5">
              <label className="text-sm text-neutral-400 block mb-2">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                maxLength={30}
                className="w-full bg-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Goal input */}
            <div className="mb-8">
              <label className="text-sm text-neutral-400 block mb-2">Current Goal</label>
              <input
                type="text"
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                placeholder="e.g. Build Muscle & Stay Consistent"
                maxLength={60}
                className="w-full bg-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
