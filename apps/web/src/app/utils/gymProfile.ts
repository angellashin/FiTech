const GYM_PROFILE_KEY = 'fitech_gym_profile';

export type Equipment =
  | 'barbell'
  | 'dumbbells'
  | 'ez-bar'
  | 'kettlebell'
  | 'cable-machine'
  | 'lat-pulldown'
  | 'leg-press'
  | 'pec-deck'
  | 'smith-machine'
  | 'leg-extension-curl'
  | 'pullup-bar'
  | 'dip-station';

export interface GymProfile {
  equipment: Equipment[];
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  'barbell':           'Barbell',
  'dumbbells':         'Dumbbells',
  'ez-bar':            'EZ Bar',
  'kettlebell':        'Kettlebell',
  'cable-machine':     'Cable Machine',
  'lat-pulldown':      'Lat Pulldown Machine',
  'leg-press':         'Leg Press Machine',
  'pec-deck':          'Pec Deck Machine',
  'smith-machine':     'Smith Machine',
  'leg-extension-curl':'Leg Extension / Curl Machine',
  'pullup-bar':        'Pull-up Bar',
  'dip-station':       'Dip Station',
};

export const EQUIPMENT_CATEGORIES: { label: string; items: Equipment[] }[] = [
  {
    label: 'Free Weights',
    items: ['barbell', 'dumbbells', 'ez-bar', 'kettlebell'],
  },
  {
    label: 'Machines & Cable',
    items: ['cable-machine', 'lat-pulldown', 'leg-press', 'pec-deck', 'smith-machine', 'leg-extension-curl'],
  },
  {
    label: 'Bodyweight Stations',
    items: ['pullup-bar', 'dip-station'],
  },
];

export function getGymProfile(): GymProfile {
  try {
    const raw = localStorage.getItem(GYM_PROFILE_KEY);
    if (raw) return JSON.parse(raw) as GymProfile;
  } catch {
    // ignore
  }
  return { equipment: [] };
}

export function saveGymProfile(profile: GymProfile): void {
  localStorage.setItem(GYM_PROFILE_KEY, JSON.stringify(profile));
}

export function toggleEquipment(equipment: Equipment[]): void {
  saveGymProfile({ equipment });
}
