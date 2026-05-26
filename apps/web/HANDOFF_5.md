# FiTech Development Progress — 5th Team Handoff

배포 URL: https://angellashin.github.io/FiTech/  
작업 브랜치: `main` 로컬 작업 중  
작업 범위: Plan Preview UX 우선순위 조정 및 이후 수정사항 온보딩 기록

---

## 이번 세션 기록 방식

- 수정사항은 이 파일에 온보딩용으로 짧게 누적 기록한다.
- 각 항목은 “무엇을 업데이트했는지 / 어떤 파일을 수정했는지 / 검증 결과” 중심으로만 남긴다.
- 세부 디버깅 로그는 남기지 않고, 다음 작업자가 바로 이어받을 수 있는 정보만 기록한다.

---

## 1. Plan Preview — 추천 이유 섹션 하단 이동

**사용자 의도:** 생성된 운동 플랜에서는 추천 이유보다 “어떤 운동이 들어갔는지”가 더 중요함.

**업데이트 내용:**

- `Why this recommendation?` 카드를 `Exercise List` 위에서 화면 콘텐츠 하단으로 이동.
- 일반 모드 표시 순서를 `Plan Summary → Exercise List → Hands-Free Workout → Why this recommendation?`로 정리.
- 추천 이유 카드의 기존 스타일, 문구, 조건부 표시 로직은 그대로 유지.

**수정 파일:**

- `src/app/components/PlanPreview.tsx`

**검증:**

- `npm run typecheck` ✅
- `npm run build` ✅

---

## 2. Workout Session — 운동 중 기구 변경 + 무게 안내 개선

**사용자 의도:** 운동 중 실제 헬스장 상황에 맞게 기구가 막히면 바로 다른 운동으로 바꾸고, 오디오가 목표 무게를 말해줘야 함.

**업데이트 내용:**

- 운동 진행 화면에 현재 세트의 목표 무게를 표시하는 `Weight` 카드 추가.
- 휴식 화면에도 다음 세트의 운동명과 목표 무게/반복수를 표시.
- 오디오 안내 문구에 “몇 kg × 몇 reps”를 포함하도록 변경. 시작/휴식 종료/다음 운동 전환/스킵/슈퍼세트 전환 모두 현재 세트 목표를 읽어줌.
- 운동 중 `Machine busy? Change exercise` / `Change next exercise` 버튼 추가.
- 대체 운동 선택 시트를 추가해 같은 근육군 우선, 필요 시 전체 운동 중 선택 가능하게 함.
- 대체 운동으로 바꾸면 기존 운동은 `equipment_occupied` 이벤트로 기록되어 이후 추천에서 회피 신호로 활용됨.
- 이미 완료한 세트가 있는 상태에서 바꾸면 기존 세트 기록을 보존하고 새 운동을 바로 다음 순서로 삽입함.
- Triple Tap이 마지막 운동에서 더 이상 순서 변경을 못 할 때는 대체 운동 선택 시트를 열도록 변경.
- lint 통과를 위해 `Home.tsx`의 미사용 import 제거.
- GIF/JPG/WebP 운동 가이드 에셋을 허용하도록 stale 테스트 기대값 수정.

**수정 파일:**

- `src/app/components/WorkoutSession.tsx`
- `src/app/components/Home.tsx`
- `src/app/services/exerciseGuide.test.ts`

**검증:**

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 7 files / 50 tests passed
- `npm run build` ✅

---

## 3. Workout Setup — My Gym Equipment helper copy 영어화

**사용자 의도:** `My Gym Equipment` 선택 안내 문구에 남아 있던 한국어를 영어 UI 문구로 통일.

**업데이트 내용:**

- 기존 문구 `체크한 기구만 사용하는 운동으로 AI가 구성해줘요. 미선택 시 전체 대상.`를 영어로 변경.
- 새 문구: `AI will build workouts using only the equipment you select. If none are selected, all exercises are available.`

**수정 파일:**

- `src/app/components/WorkoutSetup.tsx`

**검증:**

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run build` ✅

## 4. Workout Session — kg 표시 카드 제거/축소

**사용자 의도:** 운동 중 화면에서 목표 kg가 버튼/카드처럼 크게 보여 UI가 무거워짐. 오디오에서 이미 kg를 안내하므로 화면 표시는 작게만 남기거나 제거해도 됨.

**업데이트 내용:**

- 일반 운동 화면의 큰 `Weight` 카드를 제거하고 `Sets / Reps / Rest` 3개 카드 구조로 복구.
- 슈퍼세트 진행 화면의 큰 `Weight` 카드를 제거하고 `Sets / Reps` 중심으로 단순화.
- 목표 kg/반복수는 운동명 아래의 작은 `Target:` 보조 텍스트로만 표시.
- 휴식 화면의 다음 세트 목표도 큰 강조 텍스트에서 작은 보조 텍스트로 축소.
- 오디오의 kg 안내 로직은 그대로 유지.

**수정 파일:**

- `src/app/components/WorkoutSession.tsx`

**검증:**

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 7 files / 50 tests passed
- `npm run build` ✅

## 5. CI — npm lockfile 동기화

**사용자 의도:** 배포 후 GitHub에서 바로 확인 가능해야 하므로 main push 이후 설치 단계 CI 실패도 같이 정리.

**업데이트 내용:**

- `package.json`과 불일치하던 `package-lock.json`을 동기화.
- lockfile에 누락되어 CI `npm ci`를 막던 `@capacitor/app`, `@dnd-kit/*` 의존성 항목을 반영.
- 현재 `package.json`에 없는 stale `@capacitor-community/text-to-speech` root lock entry 제거.
- CI `format:check`에서 경고가 나던 파일만 Prettier로 정리해 다음 main 체크가 설치 이후 단계도 통과하도록 맞춤.

**수정 파일:**

- `package-lock.json`
- `HANDOFF_4.md`, `HANDOFF_5.md`
- `src/app/components/ExerciseGuideSheet.tsx`
- `src/app/components/Home.tsx`
- `src/app/components/PlanPreview.tsx`
- `src/app/components/RoutineLibrary.tsx`
- `src/app/components/WorkoutHistory.tsx`
- `src/app/components/WorkoutSetup.tsx`
- `src/app/services/exerciseGuide.ts`

**검증:**

- `npm ci --cache .npm-cache` ✅
- `npm audit --audit-level=critical` ✅ — critical 기준 통과
- `npm run format:check` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 7 files / 50 tests passed
- `npm run typecheck` ✅
- `npm run build` ✅

## 6. Workout Session — 운동 중 kg 조정

**사용자 의도:** 운동 진행 중에도 실제로 들 무게를 바꿀 수 있어야 하지만, kg 표시가 큰 카드처럼 보여 UI를 깨면 안 됨.

**업데이트 내용:**

- 운동 중 현재 세트의 kg를 바로 조정할 수 있는 작은 pill 형태의 `kg` 컨트롤 추가.
- `- / 직접 입력 / +` 방식으로 2.5kg 단위 빠른 조정과 직접 입력을 모두 지원.
- 일반 운동, 슈퍼세트 현재 운동, 휴식 중 다음 세트 화면에서 같은 작은 컨트롤 사용.
- 조정값은 현재 세트의 `setDetails.weight`에 저장되어 작은 `Target:` 표시, 다음 오디오 안내, 완료 기록이 같은 값으로 이어짐.
- `Weight / Reps`, `Machine / Reps` 운동에만 노출하고 bodyweight/hold 운동은 숨겨 불필요한 화면 요소를 만들지 않음.

**수정 파일:**

- `src/app/components/WorkoutSession.tsx`

**검증:**

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 7 files / 50 tests passed
- `npm run build` ✅
- `npm run format:check` ✅

## 7. Workout Session — .5kg 입력칸 잘림 수정

**사용자 의도:** 운동 중 kg 조정 시 `37.5`처럼 `.5` 단위가 입력칸 안에서 잘려 보이면 안 됨.

**업데이트 내용:**

- kg 입력칸을 브라우저 기본 number input에서 decimal text input으로 변경해 숫자 스피너/잘림 영향을 제거.
- 입력폭을 `w-14`에서 `w-20`으로 넓혀 `100.5` 같은 값도 안정적으로 보이게 함.
- `,` 입력은 `.`로 정규화하고, 숫자/소수점만 입력되도록 정리.
- 포커스 중에는 사용자가 입력 중인 draft 값을 유지하고, blur/Enter 시 정규화된 kg로 저장.

**수정 파일:**

- `src/app/components/WorkoutSession.tsx`

**검증:**

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 7 files / 50 tests passed
- `npm run build` ✅
- `npm run format:check` ✅

## 8. Workout Session — 남은 세트 kg 자동 반영 + 탭 UI 중복 제거

**사용자 의도:** 운동 중 한 세트에서 kg를 바꿨다면 같은 운동의 남은 세트에도 자연스럽게 반영되어야 함. 매 세트마다 폰을 다시 수정하게 만들면 핸즈프리 운동 앱 취지와 맞지 않음. 하단 탭 안내도 `Single Tap` 같은 문구가 중복되어 산만함.

**업데이트 내용:**

- kg 변경 시 현재 세트와 아직 완료하지 않은 같은 운동의 남은 세트에 기본 반영되도록 변경.
- 남은 세트 자동 반영 후 작은 피드백을 표시: `Remaining sets updated...` + `This set only` + `Undo`.
- `This set only`를 누르면 현재 세트 kg만 유지하고 이후 세트는 이전 계획값으로 복구.
- `Undo`를 누르면 해당 kg 변경 전체를 이전 계획값으로 복구.
- `Target ... Plan`을 누르면 현재 운동의 전체 세트 계획 bottom sheet를 열어 완료/현재/예정 세트와 kg·reps를 확인할 수 있음.
- 하단 이어폰 탭 UI는 버튼과 설명 카드가 따로 반복되지 않도록, 각 버튼 안에 액션명과 gesture를 한 번만 표시하는 구조로 통합.

**수정 파일:**

- `src/app/components/WorkoutSession.tsx`

**검증:**

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 7 files / 50 tests passed
- `npm run build` ✅
- `npm run format:check` ✅

## 9. Exercise Guide — Dumbbell Shoulder Press 이미지 매핑 정리

**사용자 의도:** `Dumbbell Shoulder Press` 가이드 이미지가 다른 운동들과 혼자 다른 스타일/비율로 보이는 원인을 확인하고 정리.

**업데이트 내용:**

- 원인: `getExerciseImageSrc()`가 slug를 만들고 `gifExercises → webpExercises → jpg fallback` 순서로 확장자를 고르는데, `dumbbell-shoulder-press`가 webp 목록에 없어 850×567 `.jpg` fallback을 사용하고 있었음.
- 이미 존재하던 512×512 `.webp` 에셋을 사용하도록 `webpExercises`에 `dumbbell-shoulder-press`를 추가.
- 해당 매핑이 다시 `.jpg`로 돌아가지 않도록 테스트를 추가.

**수정 파일:**

- `src/app/services/exerciseGuide.ts`
- `src/app/services/exerciseGuide.test.ts`

**검증:**

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 7 files / 51 tests passed
- `npm run build` ✅
- `npm run format:check` ✅

## 10. Workout Session — kg 변경 피드백 문구 명확화

**사용자 의도:** 운동 중 kg 변경 후 뜨는 안내 박스의 `Set 1+` 표현이 무엇을 뜻하는지 이해하기 어려움.

**업데이트 내용:**

- `Set 1+` 축약 문구를 제거.
- 안내 제목을 `Updated current + 2 remaining sets to 37.5kg`처럼 현재 세트와 남은 적용 세트 수가 바로 보이도록 변경.
- 보조 문구는 `Sets 1–3`처럼 실제 적용되는 세트 범위를 표시하도록 변경.

**수정 파일:**

- `src/app/components/WorkoutSession.tsx`

**검증:**

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 7 files / 51 tests passed
- `npm run build` ✅
- `npm run format:check` ✅

## 11. Android App — 하드웨어 뒤로가기 네비게이션 스택화

**사용자 의도:** 안드로이드 앱에서 폰의 시스템 뒤로가기 버튼을 눌렀을 때 무조건 Home으로 가지 않고, 실제 직전 화면으로 돌아가야 함.

**업데이트 내용:**

- 원인: `App.tsx`의 Capacitor `backButton` 핸들러가 `previewSource`와 화면별 고정 규칙만 사용해 `History/Routines/Progress → Plan Preview` 같은 실제 진입 경로를 잃고 있었음.
- `currentScreen` 단일 상태를 `appNavigationReducer` 기반의 `{ current, stack }` 네비게이션 상태로 변경.
- Home 위젯/카드에서 들어간 `History`, `Progress`, `Routines`, `Profile` 및 그 안에서 연 `PlanPreview`가 하드웨어 뒤로가기/앱 UI 뒤로가기 모두 실제 이전 화면으로 돌아가도록 정리.
- Home/Login에서는 기존처럼 Android 앱 종료 동작 유지.
- Workout Complete는 완료된 세션으로 되돌아가지 않도록 하드웨어 뒤로가기 시 Home으로 보내는 예외를 유지.
- 네비게이션 스택 회귀 테스트 추가: `History → Preview → Back`이 Home이 아니라 History로 돌아가는지 검증.

**수정 파일:**

- `src/app/App.tsx`
- `src/app/utils/appNavigation.ts`
- `src/app/utils/appNavigation.test.ts`

**검증:**

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 8 files / 55 tests passed
- `npm run build` ✅
- `npm run format:check` ✅

## 12. Workout Session — 현재 운동 전체 세트 편집 팝업 재구성

**사용자 의도:** 운동 중 kg/reps 수정은 해당 세트 하나만 바꾸는 방식이나 자동 저장 방식이 아니라, 현재 진행 중인 운동의 전체 세트를 팝업에서 보고 세트별/일괄로 수정한 뒤 명시적으로 저장하는 흐름이어야 함.

**업데이트 내용:**

- 이전에 추가했던 운동 중 inline kg 조절 버튼, 남은 세트 자동 반영, `Undo`/`This set only` 피드백 박스를 제거.
- `Target ... Edit sets` 버튼을 누르면 현재 운동의 전체 세트가 bottom sheet로 열리도록 재구성.
- 팝업 안에서 세트별 kg와 reps/sec를 각각 수정할 수 있게 함.
- 상단 `Apply to all sets` 영역에서 kg 또는 reps/sec를 현재 운동의 모든 세트에 일괄 적용할 수 있게 함.
- 변경값은 팝업 내부 draft 상태로만 유지하고, `Save changes`를 눌렀을 때만 실제 세션 플랜에 반영되도록 변경.
- `.5` kg 입력이 중간에 사라지거나 잘리지 않도록 decimal text 입력값을 문자열 draft로 관리.
- 생성된 운동 플랜의 각 운동이 `sets`와 동일한 개수의 `setDetails`를 갖고, 세션 중 표시할 kg/reps 타깃이 유효한지 회귀 테스트 추가.

**수정 파일:**

- `src/app/components/WorkoutSession.tsx`
- `src/app/services/workoutPlanner.test.ts`

**검증:**

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 8 files / 56 tests passed
- `npm run build` ✅
- `npm run format:check` ✅

**참고:**

- 이제 kg/reps는 운동 중 화면에서 자동 저장되지 않으며, 팝업의 `Save changes`가 명시적 저장 기준이다.
- 로컬에 기존 미추적 파일 `reference 1.png`, `reference 2.png`가 남아 있음. 이번 수정과 무관.
