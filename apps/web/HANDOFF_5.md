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
