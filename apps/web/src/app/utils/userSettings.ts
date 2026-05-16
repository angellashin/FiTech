export interface UserSettings {
  audioGuidance: boolean;
  restNotifications: boolean;
  darkMode: boolean;
}

const SETTINGS_KEY = 'fitech_user_settings';
const defaults: UserSettings = { audioGuidance: true, restNotifications: true, darkMode: true };

export function getUserSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

export function setUserSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
  const current = getUserSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, [key]: value }));
}

export function applyDarkMode(dark: boolean): void {
  document.documentElement.classList.toggle('light-mode', !dark);
}
