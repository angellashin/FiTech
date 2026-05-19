import { useState } from 'react';
import { Dumbbell } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const ACTIVE_USER_NAME_KEY = 'fitech_user_name';
const LAST_USER_NAME_KEY = 'fitech_last_user_name';

const USER_SCOPED_STORAGE_KEYS = [
  'fitech_workout_history',
  'fitech_workout_sessions',
  'fitech_saved_routines',
  'fitech_gym_profile',
  'fitech_user_settings',
  'fitech_user_goal',
  'fitech_avatar_color',
  'fitech_cloud_sync_status',
  'fitech_last_cloud_sync_status',
];

const clearPreviousUserData = () => {
  USER_SCOPED_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = name.trim();
    if (!displayName) return;

    setIsLoading(true);
    setSyncMessage('Preparing cloud sync...');

    // If a different user logs in on the same device, isolate the local-first data set.
    const previousName =
      localStorage.getItem(ACTIVE_USER_NAME_KEY) ?? localStorage.getItem(LAST_USER_NAME_KEY);
    const isUserSwitch = Boolean(previousName && previousName !== displayName);
    if (isUserSwitch) {
      clearPreviousUserData();
    }

    localStorage.setItem(ACTIVE_USER_NAME_KEY, displayName);
    localStorage.setItem(LAST_USER_NAME_KEY, displayName);

    try {
      if (isUserSwitch) {
        const { supabase } = await import('../lib/supabaseClient');
        await supabase?.auth.signOut();
      }
      const { ensureAnonymousFiTechUser } = await import('../services/supabaseAuth');
      const result = await ensureAnonymousFiTechUser(displayName);
      setSyncMessage(result.message);
    } catch (error) {
      console.warn('Failed to initialize Supabase cloud sync:', error);
      setSyncMessage('Cloud sync setup failed. FiTech will continue local-only.');
    }

    window.setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 400);
  };

  return (
    <div className="size-full flex flex-col bg-neutral-950 text-white overflow-auto">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 mb-6 shadow-2xl shadow-blue-900/50">
              <Dumbbell className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              FiTech
            </h1>
            <p className="text-neutral-400">Get Started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            <div>
              <label className="text-sm font-medium text-neutral-300 mb-2 block">
                Enter your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full px-4 py-4 rounded-xl glass-dark border-2 border-neutral-700/50 bg-neutral-900/50 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none transition-all shadow-lg"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 disabled:from-neutral-800 disabled:to-neutral-900 text-white rounded-xl py-4 px-6 font-semibold transition-all disabled:cursor-not-allowed shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting...</span>
                </div>
              ) : (
                <span>Get Started</span>
              )}
            </button>
          </form>

          {syncMessage && (
            <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
              {syncMessage}
            </div>
          )}

          <div className="mt-12 glass-dark rounded-2xl p-6 border border-neutral-800/50 shadow-lg">
            <h3 className="font-semibold mb-3 text-center">AI-Powered Smart Fitness</h3>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Hands-free workout tracking with earbuds
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Conservative weight suggestions from your records
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                AI-generated personalized workout plans
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
