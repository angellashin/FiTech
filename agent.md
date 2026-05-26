# agent.md — Claude-to-Claude relay log

다음 작업자의 Claude가 먼저 읽고 컨텍스트 잡으라고 두는 파일. 매 작업자가 끝에 자기 섹션을 append.

---

## 2026-05-21 — 이윤제 (branch: `main`, 기반: `junseo`)

**한 줄 요약**: Saved Routines 편집 기능(운동 추가/삭제) 구현 완료. Home 화면 루틴 카드에 Edit 버튼 추가.

**상세 핸드오프**: [`apps/web/HANDOFF_4.md`](apps/web/HANDOFF_4.md)

**구현한 기능**:
- Saved Routines 편집 바텀 시트 — 루틴명 수정, 운동 삭제(X 버튼), 운동 추가(라이브러리에서 선택)
- 운동 추가 화면: 근육 그룹 필터 pill (All / Chest / Back 등 7개), 이미 추가된 운동은 + 비활성화
- Save Changes 즉시 localStorage 저장 + 홈 카드 카운트 실시간 반영
- X/Cancel 버튼으로 변경 취소
- **운동 캘린더 뷰** — WorkoutHistory 화면 상단에 월간 달력 추가
  - 운동한 날에 파란 점, 오늘은 초록 링 표시
  - `<` `>` 로 월 이동, 하단에 "N workouts this month"
  - 날짜 탭 → 해당 날 세션만 필터링, 뱃지+X로 해제

**수정 파일**:
- `apps/web/src/app/components/Home.tsx` — Saved Routines 편집 기능
- `apps/web/src/app/components/WorkoutHistory.tsx` — 캘린더 뷰 (+133줄)

**다음 사람이 할 일**:
1. 현재 CSS invert 방식의 Dark Mode를 Tailwind `dark:` 클래스로 고도화
2. 프로필 사진 업로드 (현재 이니셜+색상만 지원)
3. Saved Routines에 드래그로 순서 변경 기능 추가 (선택사항)
4. GIF 잔여 4개 추가 — Dumbbell Shoulder Press, Machine Shoulder Press, JM Press, Single Arm Pushdown (`exerciseGuide.ts`의 `gifExercises` Set에 슬러그 추가 + public/exercise-guides/ 에 gif 파일 배치)

**현재 브랜치 상태**:
- `main` 직접 push (junseo와 동일한 방식)
- `npm run build` ✅ (vite build 성공)
- TypeScript 에러: pre-existing 에러 8개 (이전 팀 상속분, 본 PR 무관)

---

## 2026-05-16 — 이윤제 (branch: `yunje`, 기반: `sangjun`)

**한 줄 요약**: sangjun의 이어폰 기능이 APK에서 작동하지 않던 근본 원인들을 전부 잡고, 실기기에서 싱글·더블·트리플 탭 전부 동작 확인까지 완료했다.

**상세 핸드오프**: [`docs/handoff/2026-05-16-yunje-earbud-fix.md`](docs/handoff/2026-05-16-yunje-earbud-fix.md)

**최종 동작 상태** (실기기 검증 완료):
- 이어폰 1번 탭 → 세트 완료 / 휴식 스킵
- 이어폰 2번 탭 → 운동 스킵
- 이어폰 3번 탭 → 기구 선점 → 순서 변경
- 진단 오버레이 (`ⓘ` 버튼): platform / active / rawEventCount / errors 실시간 표시

**버그 수정 내역 (오늘 발견·수정한 것들)**:

1. **Capacitor JS 브리지 오류** — `window.CapacitorGlobal` 없는 객체 참조 → `registerPlugin()` API로 교체 (`lib/mediaButton.ts` 신규)
2. **Kotlin 미컴파일** — Capacitor 생성 Android 프로젝트에 Kotlin 컴파일러 미설정 → `.kt` 파일 전부 `.java`로 전환 (`android-src/MainActivity.java`, `android-src/MediaButtonPlugin.java`)
3. **APK 크래시** — 위 원인으로 `MainActivity` 클래스가 APK에 없었음 → Java 전환으로 해결
4. **raw events = 0** — Android가 오디오 재생 중인 앱에만 미디어 버튼 라우팅 → `AudioTrack` 무음 루프 추가
5. **더블·트리플 탭 미인식** — BT 이어폰은 버튼 카운팅을 자체 처리 후 AVRCP 커맨드로 전송 (NEXT/PREVIOUS). 기존 코드는 PLAY_PAUSE만 카운팅 → `onSkipToNext` → doubleTap, `onSkipToPrevious` → tripleTap 직접 매핑

**다음 사람 (원준서)이 할 일**:
1. 이어폰 기능은 완성됨. 백로그 다음 항목 (workout setup UI 개편 / Exercise 리스트 / plan 프리뷰 UX) 진행 가능.
2. sangjun에서 상속된 TypeScript 에러 8개 (`MuscleGroup → MuscleGroup[]` 미완성 마이그레이션) — 제대로 고쳐야 함. 임시방편 금지.
3. **하지 말 것**: main 직접 푸시, 상속 에러 `as any`로 덮기.

**현재 브랜치 상태**:
- `npm run build` ✅
- 실기기 이어폰 싱글·더블·트리플 탭 ✅
- pre-existing lint 2개 / TS 에러 8개 (sangjun 상속분, 본 PR 무관)

---

## 2026-05-23 — Codex (branch: `main`, local)

**한 줄 요약**: Plan Preview에서 운동 목록을 추천 이유보다 먼저 보이도록 UX 우선순위를 조정했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**구현한 기능**:
- `Why this recommendation?` 섹션을 `Exercise List` 위에서 콘텐츠 하단으로 이동
- 표시 순서: `Plan Summary → Exercise List → Hands-Free Workout → Why this recommendation?`
- 추천 이유 카드의 기존 스타일/문구/조건부 렌더링은 유지

**수정 파일**:
- `apps/web/src/app/components/PlanPreview.tsx`
- `apps/web/HANDOFF_5.md` — 이번 세션 온보딩 기록 시작

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run build` ✅

**참고**:
- 로컬에 기존 미추적 파일 `reference 1.png`, `reference 2.png`가 남아 있음. 이번 수정과 무관.

---

## 2026-05-24 — Codex (branch: `main`, local)

**한 줄 요약**: Workout Session에서 운동 중 기구가 막히면 대체 운동으로 바꾸고, 화면/오디오가 현재 세트 목표 무게를 안내하도록 개선했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**구현한 기능**:
- 운동 진행 화면에 현재 세트 `Weight` 카드 추가 (`kg`, bodyweight, hold 구분)
- 휴식 화면에 다음 운동/다음 세트 목표 무게·반복수 표시
- 오디오 안내가 시작/휴식 종료/운동 전환/스킵/슈퍼세트 전환 시 “몇 kg × 몇 reps”를 말하도록 변경
- `Machine busy? Change exercise` / `Change next exercise` 버튼과 대체 운동 선택 시트 추가
- 대체 운동은 같은 근육군을 우선 보여주고, `All options`에서 전체 운동으로 확장 가능
- 대체 선택 시 기존 운동은 `equipment_occupied` 이벤트로 남겨 이후 추천 회피 신호에 반영
- 이미 완료한 세트가 있으면 기존 기록은 보존하고 대체 운동을 다음 순서로 삽입
- 마지막 운동에서 Triple Tap 시 대체 운동 선택 시트를 열도록 보완

**수정 파일**:
- `apps/web/src/app/components/WorkoutSession.tsx` — 운동 중 무게 안내, 대체 운동 선택/교체 UX
- `apps/web/src/app/components/Home.tsx` — 미사용 import 제거로 lint 통과
- `apps/web/src/app/services/exerciseGuide.test.ts` — GIF/WebP/JPG 가이드 에셋 확장자 허용
- `apps/web/HANDOFF_5.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (7 files / 50 tests)
- `cd apps/web && npm run build` ✅

**참고**:
- 배포/push는 아직 하지 않음. 로컬 변경 상태.
- 로컬에 기존 미추적 파일 `reference 1.png`, `reference 2.png`가 남아 있음. 이번 수정과 무관.

---

## 2026-05-24 — Codex follow-up (branch: `main`, local)

**한 줄 요약**: Workout Setup의 `My Gym Equipment` 안내 문구를 영어로 통일했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/src/app/components/WorkoutSetup.tsx` — 한국어 helper copy를 영어로 변경
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run build` ✅

---

## 2026-05-24 — Codex follow-up 2 (branch: `main`, local)

**한 줄 요약**: Workout Session의 큰 kg/Weight 카드를 제거하고, 목표 무게는 작은 보조 텍스트와 오디오 안내로만 남겼다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/src/app/components/WorkoutSession.tsx` — 큰 `Weight` 카드 제거, 작은 `Target:` 텍스트로 축소, 오디오 kg 안내 유지
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (7 files / 50 tests)
- `cd apps/web && npm run build` ✅

**참고**:
- 로컬에 기존 미추적 파일 `reference 1.png`, `reference 2.png`가 남아 있음. 이번 수정과 무관.

---

## 2026-05-24 — Codex follow-up 3 (branch: `main`, local)

**한 줄 요약**: GitHub CI가 `npm ci`/`format:check` 단계에서 깨지던 lockfile·format 상태를 동기화했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/package-lock.json` — `package.json` 기준으로 누락 의존성 lock entry 반영 및 stale entry 정리
- `apps/web/HANDOFF_4.md`, `apps/web/src/app/components/*`, `apps/web/src/app/services/exerciseGuide.ts` — CI `format:check` 경고 파일만 Prettier 정리
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm ci --cache .npm-cache` ✅
- `cd apps/web && npm audit --audit-level=critical` ✅
- `cd apps/web && npm run format:check` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (7 files / 50 tests)
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run build` ✅

**참고**:
- npm 전역 캐시에 권한 문제가 있어 CI 동작 검증은 프로젝트 로컬 임시 캐시로 수행했고, 검증 후 `.npm-cache`는 삭제함.

---

## 2026-05-24 — Codex follow-up 4 (branch: `main`, local)

**한 줄 요약**: Workout Session에서 UI를 깨지 않는 작은 컨트롤로 현재 세트 kg를 운동 중 조정할 수 있게 했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/src/app/components/WorkoutSession.tsx` — 현재 세트 kg pill 조정 UI, `setDetails.weight` 반영 로직
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (7 files / 50 tests)
- `cd apps/web && npm run build` ✅
- `cd apps/web && npm run format:check` ✅

**참고**:
- kg 변경은 현재 세트에만 적용된다. 다음 세트부터는 각 세트의 기존 계획값을 유지한다.
- 로컬에 기존 미추적 파일 `reference 1.png`, `reference 2.png`가 남아 있음. 이번 수정과 무관.

---

## 2026-05-24 — Codex follow-up 5 (branch: `main`, local)

**한 줄 요약**: Workout Session의 kg 입력칸에서 `.5` 단위가 잘려 보이지 않도록 decimal 입력 UX를 정리했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/src/app/components/WorkoutSession.tsx` — kg 입력칸 폭 확대, decimal text input, 입력 draft/정규화 처리
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (7 files / 50 tests)
- `cd apps/web && npm run build` ✅
- `cd apps/web && npm run format:check` ✅

**참고**:
- 다음 UX 개선 후보: kg 변경 시 현재 세트만이 아니라 같은 운동의 남은 세트까지 기본 반영하되, 사용자에게 명확한 undo/적용 범위 표시 제공.

---

## 2026-05-24 — Codex follow-up 6 (branch: `main`, local)

**한 줄 요약**: Workout Session에서 kg 변경을 같은 운동의 남은 세트에 자동 반영하고, 전체 세트 계획 확인 및 하단 탭 UI 중복 제거를 적용했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/src/app/components/WorkoutSession.tsx` — kg 변경 범위 확대, Undo/This set only 피드백, 세트 계획 bottom sheet, 하단 탭 UI 통합
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (7 files / 50 tests)
- `cd apps/web && npm run build` ✅
- `cd apps/web && npm run format:check` ✅

**참고**:
- 기본 동작은 “현재 세트 + 아직 완료하지 않은 남은 세트” 반영이다.
- 완료된 세트의 기록은 kg 자동 반영에서 제외한다.
- 로컬에 기존 미추적 파일 `reference 1.png`, `reference 2.png`가 남아 있음. 이번 수정과 무관.

---

## 2026-05-24 — Codex follow-up 7 (branch: `main`, local)

**한 줄 요약**: Dumbbell Shoulder Press가 `.jpg` fallback 대신 기존 512×512 `.webp` 가이드 이미지를 사용하도록 매핑을 정리했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/src/app/services/exerciseGuide.ts` — `dumbbell-shoulder-press`를 webp 이미지 매핑에 추가
- `apps/web/src/app/services/exerciseGuide.test.ts` — Dumbbell Shoulder Press 이미지 경로 회귀 테스트 추가
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (7 files / 51 tests)
- `cd apps/web && npm run build` ✅
- `cd apps/web && npm run format:check` ✅

**참고**:
- 원인은 `gifExercises → webpExercises → jpg` 확장자 선택 로직에서 해당 slug가 webp 목록에 빠져 있었기 때문.

---

## 2026-05-24 — Codex follow-up 8 (branch: `main`, local)

**한 줄 요약**: 운동 중 kg 변경 안내 박스의 `Set 1+` 축약 표현을 명확한 적용 범위 문구로 바꿨다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/src/app/components/WorkoutSession.tsx` — kg 변경 피드백 제목/세트 범위 표시 개선
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (7 files / 51 tests)
- `cd apps/web && npm run build` ✅
- `cd apps/web && npm run format:check` ✅

**참고**:
- 새 문구 예시: `Updated current + 2 remaining sets to 37.5kg` / `Sets 1–3`.

---

## 2026-05-25 — Codex follow-up 9 (branch: `main`, local)

**한 줄 요약**: Android 하드웨어 뒤로가기가 Home으로 고정되지 않고 실제 앱 화면 스택을 따라가도록 네비게이션을 정리했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/src/app/App.tsx` — `currentScreen` 단일 상태를 네비게이션 스택/reducer 기반으로 전환, Capacitor `backButton`을 실제 이전 화면 기준으로 처리
- `apps/web/src/app/utils/appNavigation.ts` — 앱 화면 스택 reducer 추가
- `apps/web/src/app/utils/appNavigation.test.ts` — Home 위젯/History 진입 후 Preview에서 뒤로가기 회귀 테스트 추가
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (8 files / 55 tests)
- `cd apps/web && npm run build` ✅
- `cd apps/web && npm run format:check` ✅

**참고**:
- Home/Login에서 Android 하드웨어 뒤로가기는 기존처럼 앱 종료.
- Workout Complete는 완료된 세션으로 되돌아가지 않도록 하드웨어 뒤로가기 시 Home으로 복귀하는 예외 유지.

---

## 2026-05-26 — Codex follow-up 10 (branch: `main`, local)

**한 줄 요약**: 운동 중 kg/reps 수정을 현재 운동 전체 세트 편집 팝업으로 다시 만들고, 이전 자동 저장/남은 세트 자동 반영 UX를 제거했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/src/app/components/WorkoutSession.tsx` — inline kg 조절/자동 반영/피드백 제거, 전체 세트 편집 bottom sheet, 세트별 및 전체 적용 kg/reps 편집, 명시적 Save 저장 흐름
- `apps/web/src/app/services/workoutPlanner.test.ts` — 생성 플랜의 세션 타깃 setDetails 일관성 회귀 테스트 추가
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (8 files / 56 tests)
- `cd apps/web && npm run build` ✅
- `cd apps/web && npm run format:check` ✅

**참고**:
- 팝업에서 `Cancel`/닫기를 누르면 변경 draft는 폐기되고, `Save changes`만 현재 세션 플랜에 반영한다.
- `.5` kg 입력은 문자열 draft로 유지해 모바일 입력 중 값이 잘리지 않도록 처리했다.
- 로컬에 기존 미추적 파일 `reference 1.png`, `reference 2.png`가 남아 있음. 이번 수정과 무관.

---

## 2026-05-26 — Codex follow-up 11 (branch: `main`, local)

**한 줄 요약**: 운동 중 세트 편집을 저장/취소 없는 즉시 반영 UX로 단순화하고, 세트 추가/삭제 및 커스텀 숫자패드를 추가했다.

**상세 핸드오프**: [`apps/web/HANDOFF_5.md`](apps/web/HANDOFF_5.md)

**수정 파일**:
- `apps/web/src/app/components/WorkoutSession.tsx` — `Apply to all sets`/저장 footer 제거, 즉시 반영 세트 편집, `+ Add set`/`− Remove last`, kg/reps용 커스텀 숫자패드
- `apps/web/HANDOFF_5.md` / `agent.md` — 온보딩 기록 업데이트

**검증**:
- `cd apps/web && npm run typecheck` ✅
- `cd apps/web && npm run lint` ✅
- `cd apps/web && npm run test` ✅ (8 files / 56 tests)
- `cd apps/web && npm run build` ✅
- `cd apps/web && npm run format:check` ✅

**참고**:
- 값은 숫자패드 입력/`+5`/`−5`/`Clear` 순간 바로 현재 세션 플랜에 반영된다.
- 체크 버튼은 숫자패드를 닫는 확인 버튼이며, 별도 저장 단계는 없다.
- 로컬에 기존 미추적 파일 `reference 1.png`, `reference 2.png`가 남아 있음. 이번 수정과 무관.
