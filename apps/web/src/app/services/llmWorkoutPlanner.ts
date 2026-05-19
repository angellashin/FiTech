import type { WorkoutGoal, WorkoutPlan, WorkoutIntensity, MuscleGroup } from '../domain/workout';
import type { TrainingContext } from './trainingContext';
import { INTENSITY_MULTIPLIER } from '../domain/workout';
import { getRecommendedSets } from '../utils/workoutHistory';
import { exerciseLibrary, adaptForGoal, type ExerciseTemplate } from './workoutPlanner';
import { generateWorkoutPlan } from './workoutPlanner';
import { getGymProfile, EQUIPMENT_LABELS } from '../utils/gymProfile';
import { buildTrainingContext, formatTrainingContextForPrompt } from './trainingContext';

const GEMINI_API_KEYS: string[] = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
].filter(Boolean) as string[];

const MODEL = 'gemini-2.5-flash';
const API_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const DURATION_TO_COUNT: Record<number, number> = { 30: 4, 45: 5, 60: 6 };

const INTENSITY_DESCRIPTION: Record<WorkoutIntensity, string> = {
  'very-light': 'Very Light — recovery/deload day',
  light: 'Light — warm-up or active recovery',
  normal: 'Normal — standard hypertrophy training',
  hard: 'Hard — strength-focused, heavier loads',
  'very-hard': 'Very Hard — peak intensity, near-maximum effort',
};

const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulder: 'Shoulder',
  triceps: 'Triceps',
  biceps: 'Biceps',
  core: 'Core',
  'lower-body': 'Lower Body',
};

// Build a lookup map: exercise name (lowercase) → template + muscle group key
function buildLibraryIndex(
  muscleGroups: MuscleGroup[],
): Map<string, { template: ExerciseTemplate; groupKey: MuscleGroup }> {
  const index = new Map<string, { template: ExerciseTemplate; groupKey: MuscleGroup }>();
  for (const group of muscleGroups) {
    for (const ex of exerciseLibrary[group] ?? []) {
      index.set(ex.name.toLowerCase(), { template: ex, groupKey: group });
    }
  }
  return index;
}

function buildPrompt(
  muscleGroups: MuscleGroup[],
  duration: number,
  intensity: WorkoutIntensity,
  trainingContext: TrainingContext,
): string {
  const count = DURATION_TO_COUNT[duration] ?? 5;
  const groupLabels = muscleGroups.map((g) => MUSCLE_GROUP_LABEL[g]).join(', ');

  // List exercises per muscle group so LLM can choose
  const librarySection = muscleGroups
    .map((g) => {
      const names = (exerciseLibrary[g] ?? []).map((e) => `    - ${e.name}`).join('\n');
      return `  ${MUSCLE_GROUP_LABEL[g]}:\n${names}`;
    })
    .join('\n');

  // Equipment constraint from user's gym profile
  const gymProfile = getGymProfile();
  const equipmentSection =
    gymProfile.equipment.length > 0
      ? `\nUser's gym equipment: ${gymProfile.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', ')}\nOnly select exercises that can be performed with the equipment listed above. Skip any exercise that requires equipment not available.`
      : '';

  const trainingContextSection = formatTrainingContextForPrompt(trainingContext);

  return `You are a professional strength coach. Select exactly ${count} exercises for a ${duration}-minute session.

Intensity: ${INTENSITY_DESCRIPTION[intensity]}
Target muscle groups: ${groupLabels}
${equipmentSection}
Recent training context from FiTech records:
${trainingContextSection}
You MUST choose exercises ONLY from the list below. Do not invent new names.

${librarySection}

Selection guidelines:
- Distribute exercises across all target muscle groups
- For Hard / Very Hard: prioritize compound movements first
- For Very Light / Light: isolation or machine exercises are fine
- If a target muscle group has high fatigue, prefer easier exercises and avoid maximal-loading choices
- Avoid exercises repeatedly marked as occupied in the user's records when alternatives exist
- Do not assume strength increases overnight; FiTech will keep loads close to recent working weights unless the user's own intensity setting changes them
- Order exercises logically (e.g. compound → isolation, or push muscles before pull)

Respond with ONLY a JSON array of exercise names in your chosen order, no explanation:
["Exercise Name 1", "Exercise Name 2", ...]`;
}

async function callGemini(prompt: string): Promise<string> {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  for (const key of GEMINI_API_KEYS) {
    const response = await fetch(`${API_BASE}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.status === 429) {
      console.warn('Gemini key quota exhausted, trying next key...');
      continue;
    }
    if (!response.ok) throw new Error(`Gemini API ${response.status}`);

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  throw new Error('All Gemini API keys exhausted');
}

function parseNameList(text: string): string[] {
  // Extract JSON array from anywhere in the text (handles preamble/postamble from model)
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  const jsonStr = arrayMatch
    ? arrayMatch[0]
    : text
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
  const parsed = JSON.parse(jsonStr) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Response is not an array');
  return parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

export async function generateWorkoutPlanWithLLM(
  goal: WorkoutGoal,
  muscleGroups: MuscleGroup[],
  duration: number,
  intensity: WorkoutIntensity,
): Promise<{ plan: WorkoutPlan; source: 'llm' | 'local' }> {
  const trainingContext = buildTrainingContext();
  if (GEMINI_API_KEYS.length === 0) {
    return {
      plan: generateWorkoutPlan(goal, muscleGroups, duration, intensity, trainingContext),
      source: 'local',
    };
  }

  try {
    const text = await callGemini(buildPrompt(muscleGroups, duration, intensity, trainingContext));
    const names = parseNameList(text);
    if (names.length === 0) throw new Error('LLM returned empty exercise list');

    const libraryIndex = buildLibraryIndex(muscleGroups);
    const rationale = new Set(trainingContext.summary);

    const exercises = names.flatMap((name, index) => {
      // Exact match first, then case-insensitive fallback
      const entry = libraryIndex.get(name.toLowerCase());
      if (!entry) {
        console.warn(`LLM picked unknown exercise "${name}", skipping`);
        return [];
      }

      const adapted = adaptForGoal(entry.template, goal);
      const rawSets = getRecommendedSets(
        adapted.name,
        adapted.sets,
        adapted.reps,
        adapted.muscleGroup,
      );
      const fatigueSignal = trainingContext.muscleFatigue[entry.groupKey];
      const contextMultiplier = fatigueSignal?.recommendedIntensityMultiplier ?? 1;
      if (fatigueSignal && fatigueSignal.recommendedIntensityMultiplier !== 1) {
        rationale.add(
          `${entry.groupKey.replace('-', ' ')}: ${
            fatigueSignal.decision?.type ?? fatigueSignal.level
          } recommendation adjusted loads.`,
        );
      }
      const multiplier = INTENSITY_MULTIPLIER[intensity] * contextMultiplier;
      const setDetails = rawSets.map((s) => ({
        ...s,
        weight: s.weight === 0 ? 0 : Math.round((s.weight * multiplier) / 2.5) * 2.5,
      }));

      return [
        {
          id: `llm-${index}-${adapted.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: adapted.name,
          sets: adapted.sets,
          reps: adapted.reps,
          restTime: adapted.restTime,
          muscleGroup: adapted.muscleGroup,
          setDetails,
        },
      ];
    });

    if (exercises.length === 0) throw new Error('No valid exercises after library matching');

    return {
      plan: {
        goal,
        muscleGroup: muscleGroups,
        duration,
        exercises,
        rationale: Array.from(rationale),
      },
      source: 'llm',
    };
  } catch (err) {
    console.warn('LLM planner failed, falling back to local:', err);
    return {
      plan: generateWorkoutPlan(goal, muscleGroups, duration, intensity, trainingContext),
      source: 'local',
    };
  }
}
