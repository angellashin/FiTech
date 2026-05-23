import type { Exercise } from '../domain/workout';

export type ExerciseIllustrationVariant =
  | 'squat'
  | 'hinge'
  | 'horizontal-press'
  | 'vertical-press'
  | 'row'
  | 'pulldown'
  | 'fly'
  | 'curl'
  | 'triceps'
  | 'raise'
  | 'lunge'
  | 'leg-machine'
  | 'push-up'
  | 'dip'
  | 'plank'
  | 'core'
  | 'leg-raise'
  | 'hip-thrust'
  | 'calf'
  | 'generic';

export interface ExerciseGuide {
  name: string;
  equipment: string;
  type: string;
  primaryFocus: string;
  variant: ExerciseIllustrationVariant;
  instructions: string[];
  safetyCues: string[];
  beginnerTip: string;
  imageSrc: string;
}

const hasAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

const normalize = (name: string) => name.trim().toLowerCase();

const slugExerciseName = (name: string) =>
  normalize(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const withAppBasePath = (assetPath: string): string => {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;
};

const gifExercises = new Set([
  'barbell-bench-press',
  'decline-bench-press',
  'dumbbell-fly',
  'deadlift',
  'pull-up',
  'barbell-row',
  'lat-pulldown',
  'seated-cable-row',
  't-bar-row',
  'straight-arm-pulldown',
  'hyperextension',
  'overhead-press',
  'lateral-raise',
  'front-raise',
  'reverse-fly',
  'arnold-press',
  'upright-row',
  'cable-lateral-raise',
  'shrugs',
  'tricep-pushdown',
  'skull-crusher',
  'overhead-tricep-extension',
  'tricep-dips',
  'cable-kickback',
  'tate-press',
  'barbell-curl',
  'hammer-curl',
  'concentration-curl',
  'cable-curl',
  'preacher-curl',
  'spider-curl',
  'reverse-curl',
  'leg-raise',
  'russian-twist',
  'ab-wheel-rollout',
  'hanging-knee-raise',
  'dead-bug',
  'bicycle-crunch',
  'mountain-climber',
  'romanian-deadlift',
  'lunges',
  'leg-extension',
  'sumo-deadlift',
  'calf-raise',
  'incline-dumbbell-press',
  'cable-fly',
  'push-up',
  'incline-cable-fly',
  'dips',
  'dumbbell-row',
  'face-pull',
  'diamond-push-up',
  'dumbbell-curl',
  'incline-dumbbell-curl',
  'chin-up',
  'plank',
  'crunch',
  'cable-crunch',
  'back-squat',
  'hip-thrust',
  'leg-press',
  'leg-curl',
  'step-up',
  'close-grip-bench-press',
]);

const webpExercises = new Set(['pec-deck-machine', 'landmine-press']);

export const getExerciseImageSrc = (exerciseName: string): string => {
  const slug = slugExerciseName(exerciseName);
  const ext = gifExercises.has(slug) ? 'gif' : webpExercises.has(slug) ? 'webp' : 'jpg';
  return withAppBasePath(`exercise-guides/${slug}.${ext}`);
};

const titleCaseMuscle = (muscleGroup?: string) => {
  if (!muscleGroup) return 'Full body';
  return muscleGroup
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const getExerciseEquipment = (exerciseName: string): string => {
  const name = normalize(exerciseName);

  if (
    hasAny(name, [
      'push up',
      'diamond push up',
      'plank',
      'crunch',
      'dead bug',
      'mountain climber',
      'bicycle',
    ])
  ) {
    return 'Bodyweight';
  }
  if (hasAny(name, ['pull up', 'chin up', 'hanging knee raise'])) return 'Pull-up bar';
  if (hasAny(name, ['dip'])) return 'Dip bars / bench';
  if (hasAny(name, ['cable', 'pulldown', 'pushdown', 'face pull'])) return 'Cable machine';
  if (hasAny(name, ['machine', 'pec deck', 'leg press', 'leg extension', 'leg curl'])) {
    return 'Machine';
  }
  if (hasAny(name, ['dumbbell', 'arnold', 'hammer', 'concentration', 'tate'])) {
    return 'Dumbbells';
  }
  if (hasAny(name, ['lunge', 'step up', 'raise', 'reverse fly'])) return 'Dumbbells optional';
  if (hasAny(name, ['landmine'])) return 'Landmine / barbell';
  if (hasAny(name, ['hyperextension'])) return 'Hyperextension bench';
  if (hasAny(name, ['hip thrust'])) return 'Barbell + bench';
  if (
    hasAny(name, [
      'barbell',
      'bench press',
      'close grip',
      'jm press',
      'skull crusher',
      'deadlift',
      'squat',
      'overhead press',
      'row',
      'curl',
    ])
  ) {
    return 'Barbell';
  }
  if (hasAny(name, ['calf raise'])) return 'Machine or dumbbells';
  return 'Gym equipment';
};

export const getExerciseType = (exerciseName: string): string => {
  const name = normalize(exerciseName);
  if (hasAny(name, ['plank'])) return 'Hold / Time';
  if (
    getExerciseEquipment(exerciseName) === 'Bodyweight' ||
    hasAny(name, ['pull up', 'chin up', 'dip'])
  ) {
    return 'Bodyweight / Reps';
  }
  if (
    hasAny(name, [
      'cable',
      'machine',
      'pulldown',
      'pushdown',
      'pec deck',
      'leg press',
      'leg extension',
      'leg curl',
    ])
  ) {
    return 'Machine / Reps';
  }
  return 'Weight / Reps';
};

export const getExerciseIllustrationVariant = (
  exerciseName: string,
): ExerciseIllustrationVariant => {
  const name = normalize(exerciseName);
  if (hasAny(name, ['back squat', 'squat'])) return 'squat';
  if (hasAny(name, ['deadlift', 'romanian deadlift', 'hyperextension'])) return 'hinge';
  if (hasAny(name, ['bench press', 'landmine press', 'close grip', 'jm press'])) {
    return 'horizontal-press';
  }
  if (hasAny(name, ['overhead press', 'shoulder press', 'arnold press'])) return 'vertical-press';
  if (hasAny(name, ['row', 't-bar'])) return 'row';
  if (hasAny(name, ['pulldown', 'pull up', 'chin up', 'straight arm'])) return 'pulldown';
  if (hasAny(name, ['fly', 'pec deck'])) return 'fly';
  if (hasAny(name, ['curl', 'preacher', 'spider'])) return 'curl';
  if (hasAny(name, ['tricep', 'skull crusher', 'kickback', 'pushdown'])) return 'triceps';
  if (hasAny(name, ['raise', 'shrug', 'face pull', 'upright row', 'reverse fly'])) return 'raise';
  if (hasAny(name, ['lunge', 'step up'])) return 'lunge';
  if (hasAny(name, ['leg press', 'leg extension', 'leg curl'])) return 'leg-machine';
  if (hasAny(name, ['push up'])) return 'push-up';
  if (hasAny(name, ['dip'])) return 'dip';
  if (hasAny(name, ['plank'])) return 'plank';
  if (hasAny(name, ['leg raise', 'hanging knee'])) return 'leg-raise';
  if (hasAny(name, ['crunch', 'twist', 'dead bug', 'mountain climber', 'bicycle'])) return 'core';
  if (hasAny(name, ['hip thrust'])) return 'hip-thrust';
  if (hasAny(name, ['calf'])) return 'calf';
  return 'generic';
};

const focusForVariant: Record<ExerciseIllustrationVariant, string> = {
  squat: 'Quads, glutes, core brace',
  hinge: 'Hamstrings, glutes, back brace',
  'horizontal-press': 'Chest, triceps, front shoulders',
  'vertical-press': 'Shoulders, triceps, upper chest',
  row: 'Upper back, lats, biceps',
  pulldown: 'Lats, upper back, biceps',
  fly: 'Chest stretch and squeeze',
  curl: 'Biceps',
  triceps: 'Triceps',
  raise: 'Shoulders and upper back',
  lunge: 'Quads, glutes, balance',
  'leg-machine': 'Lower-body target muscle',
  'push-up': 'Chest, triceps, core',
  dip: 'Chest and triceps',
  plank: 'Core brace',
  core: 'Abs and obliques',
  'leg-raise': 'Lower abs and hip flexors',
  'hip-thrust': 'Glutes and hamstrings',
  calf: 'Calves',
  generic: 'Main target muscle',
};

const instructionsByVariant: Record<ExerciseIllustrationVariant, string[]> = {
  squat: [
    'Set your feet about shoulder-width and keep the whole foot planted.',
    'Brace your core, sit down between your hips, and keep knees tracking over toes.',
    'Stand by pushing the floor away; finish tall without leaning back.',
  ],
  hinge: [
    'Start tall with the weight close to your body and ribs stacked over hips.',
    'Push your hips back while keeping your spine long and the bar or dumbbells close.',
    'Drive through the floor and squeeze glutes to return to standing.',
  ],
  'horizontal-press': [
    'Set your shoulder blades back and down before the first rep.',
    'Lower the weight with control toward mid-chest while elbows stay slightly tucked.',
    'Press up smoothly and keep wrists stacked over elbows.',
  ],
  'vertical-press': [
    'Stand or sit tall, brace your ribs down, and start with weights near shoulder height.',
    'Press overhead in a straight path without shrugging early.',
    'Lower under control until elbows return below the wrists.',
  ],
  row: [
    'Brace your torso and start with arms long without rounding your back.',
    'Pull elbows back toward your ribs and squeeze shoulder blades together.',
    'Return slowly; do not let the weight yank your shoulders forward.',
  ],
  pulldown: [
    'Set your grip, sit tall, and keep ribs controlled.',
    'Pull elbows down toward your sides, leading with the back instead of the hands.',
    'Pause briefly, then let the arms reach up under control.',
  ],
  fly: [
    'Keep a small bend in your elbows and open the arms until you feel a chest stretch.',
    'Bring the handles or dumbbells together by squeezing the chest.',
    'Move slowly; avoid turning it into a press.',
  ],
  curl: [
    'Stand tall with elbows close to your sides.',
    'Curl without swinging your torso or letting elbows drift forward.',
    'Lower slowly until arms are nearly straight.',
  ],
  triceps: [
    'Keep upper arms stable and ribs controlled.',
    'Extend the elbows until the triceps squeeze at the end of the rep.',
    'Return with control and stop before shoulders take over.',
  ],
  raise: [
    'Use a light load and keep your neck relaxed.',
    'Raise with control until arms reach the intended line.',
    'Lower slowly; stop if you need momentum to lift.',
  ],
  lunge: [
    'Step into a stable split stance and keep your torso tall.',
    'Lower until both knees bend comfortably while the front knee tracks over toes.',
    'Push through the front foot to stand and reset balance before the next rep.',
  ],
  'leg-machine': [
    'Adjust the seat so the machine joint lines up with your knee or hip path.',
    'Move through a comfortable range without bouncing at the bottom.',
    'Control the return so the weight stack does not slam.',
  ],
  'push-up': [
    'Set hands under shoulders and create a straight line from head to heels.',
    'Lower chest toward the floor while elbows angle slightly back.',
    'Press the floor away and keep your hips from sagging.',
  ],
  dip: [
    'Set shoulders down and keep elbows pointing back.',
    'Lower only as far as your shoulders feel stable.',
    'Press back up without shrugging or swinging.',
  ],
  plank: [
    'Set elbows under shoulders and gently tuck ribs toward hips.',
    'Squeeze glutes and keep a straight line from head to heels.',
    'Breathe slowly; stop before your lower back sags.',
  ],
  core: [
    'Start with ribs down and lower back controlled.',
    'Move from your abs rather than pulling with the neck or hip flexors.',
    'Pause at the hardest point, then return with control.',
  ],
  'leg-raise': [
    'Hold a stable support and keep shoulders packed.',
    'Lift knees or legs without swinging your body.',
    'Lower slowly and stop before your lower back arches.',
  ],
  'hip-thrust': [
    'Set upper back on the bench and feet flat under your knees.',
    'Drive through heels and lift hips until ribs and pelvis stay stacked.',
    'Squeeze glutes at the top, then lower with control.',
  ],
  calf: [
    'Stand tall with the balls of your feet planted securely.',
    'Rise onto toes and pause briefly at the top.',
    'Lower slowly through a comfortable stretch.',
  ],
  generic: [
    'Set up with a stable stance and a comfortable range of motion.',
    'Move the weight smoothly while keeping the target muscle engaged.',
    'Stop the set if form changes or joint discomfort appears.',
  ],
};

const safetyCuesByVariant: Record<ExerciseIllustrationVariant, string[]> = {
  squat: ['Brace before descending', 'Knees track over toes', 'Keep heels planted'],
  hinge: ['Neutral spine', 'Weight stays close', 'Hips move first'],
  'horizontal-press': ['Shoulders packed', 'Wrists stacked', 'Controlled lowering'],
  'vertical-press': ['Ribs down', 'No low-back arch', 'Smooth lockout'],
  row: ['Do not round back', 'Pull with elbows', 'No jerking'],
  pulldown: ['Chest tall', 'Elbows down', 'Avoid neck pulling'],
  fly: ['Soft elbows', 'Light load', 'No shoulder pinch'],
  curl: ['Elbows quiet', 'No swing', 'Full controlled lower'],
  triceps: ['Upper arms stable', 'No shoulder shrug', 'Control the return'],
  raise: ['Light and strict', 'Relax neck', 'No momentum'],
  lunge: ['Stable foot', 'Tall torso', 'Control knee path'],
  'leg-machine': ['Adjust seat first', 'No bouncing', 'Slow return'],
  'push-up': ['Straight body line', 'Elbows angled back', 'No hip sag'],
  dip: ['Stable shoulders', 'Comfortable depth', 'No swinging'],
  plank: ['Ribs tucked', 'Glutes on', 'Breathe'],
  core: ['Do not pull neck', 'Slow reps', 'Control low back'],
  'leg-raise': ['No swinging', 'Shoulders packed', 'Slow lower'],
  'hip-thrust': ['Chin tucked', 'Ribs down', 'Glute squeeze'],
  calf: ['Full foot pressure', 'Pause at top', 'Slow eccentric'],
  generic: ['Stable setup', 'Smooth tempo', 'Stop on pain'],
};

const beginnerTipByVariant: Record<ExerciseIllustrationVariant, string> = {
  squat: 'Start with a light warm-up set and treat depth as “as low as you can control.”',
  hinge: 'If your back position changes, reduce weight and shorten the range.',
  'horizontal-press':
    'Ask for a spotter or use dumbbells/machine if the bar path feels unfamiliar.',
  'vertical-press': 'Use a lighter weight than you expect; strict control matters more than load.',
  row: 'Think “elbows to pockets” instead of pulling with your hands.',
  pulldown: 'Keep the bar path in front of you; do not pull behind the neck.',
  fly: 'This should feel like a controlled stretch, not a heavy max effort.',
  curl: 'Pick a load that lets you lower for about two seconds.',
  triceps: 'If elbows ache, reduce range and choose cable pushdowns first.',
  raise: 'Small weights are normal here; clean reps beat heavy swinging.',
  lunge: 'Hold a rail or rack lightly if balance limits the movement.',
  'leg-machine': 'Spend time setting the seat and pads before adding weight.',
  'push-up': 'Use an incline surface if floor reps break your body line.',
  dip: 'Keep depth conservative until shoulders feel stable.',
  plank: 'End the hold before your hips drop; quality beats time.',
  core: 'Slow down and make each rep feel controlled.',
  'leg-raise': 'Bent-knee reps are the beginner-friendly version.',
  'hip-thrust': 'Start without heavy load to learn the top glute squeeze.',
  calf: 'Pause at the top and bottom instead of bouncing.',
  generic: 'Use the first set as a form check before pushing effort.',
};

const specificInstructionOverrides: Record<
  string,
  Partial<Pick<ExerciseGuide, 'instructions' | 'safetyCues' | 'beginnerTip'>>
> = {
  'back squat': {
    instructions: [
      'Place the bar on your upper back, grip evenly, and set feet about shoulder-width.',
      'Brace your core, sit down between your hips, and keep knees tracking over toes.',
      'Stand by driving through mid-foot and keep your chest from collapsing forward.',
    ],
    beginnerTip: 'Practice with the empty bar first; stop the descent where you can still brace.',
  },
  'barbell bench press': {
    instructions: [
      'Lie with eyes under the bar, feet planted, and shoulder blades pulled back.',
      'Lower the bar to mid-chest with elbows slightly tucked.',
      'Press up until arms are straight while keeping shoulders pinned to the bench.',
    ],
    beginnerTip: 'Use a spotter or safety arms if the set might get hard.',
  },
  deadlift: {
    instructions: [
      'Stand with the bar over mid-foot and grip just outside your legs.',
      'Brace, push the floor away, and keep the bar close as you stand.',
      'Return the bar by pushing hips back first, then bending knees after the bar passes them.',
    ],
    beginnerTip: 'The bar should travel close to your legs; if it drifts forward, reduce load.',
  },
  'lat pulldown': {
    instructions: [
      'Sit tall with thighs secured and hands slightly wider than shoulders.',
      'Pull elbows down toward your ribs until the bar reaches upper chest height.',
      'Let the bar rise slowly without losing shoulder control.',
    ],
  },
};

export const getExerciseGuide = (
  exercise: Pick<Exercise, 'name' | 'muscleGroup'> | string,
): ExerciseGuide => {
  const name = typeof exercise === 'string' ? exercise : exercise.name;
  const muscleGroup = typeof exercise === 'string' ? undefined : exercise.muscleGroup;
  const variant = getExerciseIllustrationVariant(name);
  const override = specificInstructionOverrides[normalize(name)] ?? {};

  return {
    name,
    equipment: getExerciseEquipment(name),
    type: getExerciseType(name),
    primaryFocus: focusForVariant[variant] ?? titleCaseMuscle(muscleGroup),
    variant,
    instructions: override.instructions ?? instructionsByVariant[variant],
    safetyCues: override.safetyCues ?? safetyCuesByVariant[variant],
    beginnerTip: override.beginnerTip ?? beginnerTipByVariant[variant],
    imageSrc: getExerciseImageSrc(name),
  };
};
