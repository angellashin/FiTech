# FiTech Web App

This is the FiTech React/Vite web app. It started as a Figma Make prototype and is now organized as the deployable web application for the team repository.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Key implementation areas

- `src/app/services/workoutPlanner.ts` — rule-based adaptive plan generation.
- `src/app/hooks/useAudioCoach.ts` — Web Speech API audio guidance wrapper.
- `src/app/utils/workoutHistory.ts` — local session/event/exercise history repository.
- `src/app/components/WorkoutSession.tsx` — screenless session controls.
- `src/app/components/WorkoutComplete.tsx` — real local post-workout analytics.

## Notes

- Browser speech synthesis support varies by browser/device. When unsupported, FiTech still shows text guidance.
- Real Bluetooth earbud tap events are outside the current web MVP scope; the UI simulates GA5 tap semantics for portfolio/demo purposes.
