# FiTech Development Brief

> 작성일: 2026-05-07  
> 기준 폴더: `/Users/shinminseo/Desktop/FiTech`  
> 협업/포트폴리오 GitHub Repo: <https://github.com/angellashin/FiTech>

이 문서는 FiTech 웹앱을 앞으로 개발·협업·배포하기 위해 알아야 할 제품 배경, Figma Make 프론트 코드 구조, 코드 리뷰 결과, 그리고 구체적인 개발 로드맵을 한 곳에 정리한 기준 문서다.

## 1. 읽은 자료와 근거

- `docs/references/Team FiTech GA4.pdf`
  - 제목: `Group Assignment 4 : Ideation`
  - 핵심 내용: 페르소나, 문제 정의, HMW 질문, 12개 아이디어, Top 3 솔루션, 사용 시나리오.
- `docs/references/FiTech GA5 Report.pdf`
  - 제목: `FiTech GA5 Project Report`
  - 핵심 내용: 문제/해결책, Core Tasks, Specific Implementation, 이어버드 탭 컨트롤 정의.
- `apps/web/` (원본 Figma Make 폴더를 제품용 경로로 이동)
  - Figma Make AI가 생성한 React/Vite 프론트 코드 번들.
  - 현재 앱 플로우, 화면 컴포넌트, mock 데이터, localStorage 기반 운동 기록 로직 확인.

## 2. 제품 핵심 요약

FiTech는 운동 중 휴대폰 화면을 보거나 만지는 일을 최소화하는 **screenless, voice-first workout assistant**다. 목표는 사용자가 운동 흐름을 끊지 않고 루틴 안내, 세트 기록, 대체 운동 선택, 운동 후 분석까지 이어가도록 만드는 것이다.

### 2.1 문제 정의

헬스장 사용자는 기존 피트니스 앱을 운동 중 사용할 때 다음 문제를 겪는다.

- 숙련자: 리프팅 스트랩, 장갑, 땀 때문에 터치스크린 조작이 어렵고 세트 기록이 운동 몰입을 깨뜨린다.
- 초보자: 휴대폰을 열면 SNS/메신저로 쉽게 산만해지고, 사람이 많은 시간대에는 사용 중인 기구 때문에 다음 운동을 어떻게 바꿔야 할지 막힌다.
- 공통: 운동 루틴 관리와 대체 운동 탐색을 화면 없이 처리하고 싶다.

### 2.2 주요 페르소나

#### Persona 1: Kim Minji, 23세

- 학생이자 꾸준한 헬스장 이용자.
- 주 4~5회 운동, 계획된 루틴과 정확한 휴식 시간을 중요하게 생각.
- 점진적 과부하(progressive overload), 운동 볼륨, 성장 지표에 민감.
- lifting straps와 땀 때문에 휴대폰 조작이 불편함.
- 목표: 운동 중 **flow state**를 유지하면서 정확히 기록하고 성장 확인.

#### Persona 2: Shin Taehyeong, 28세

- 바쁜 직장인, 최근 운동을 시작한 초보자.
- 주 2~3회, 일정상 peak hour에 자주 운동.
- 기구 사용법과 루틴 설계에 자신이 없음.
- 휴대폰 확인 후 SNS에 빠져 운동 흐름을 잃기 쉬움.
- 목표: 휴대폰 의존 없이 자신감 있게 운동을 끝내기.

## 3. GA4 Ideation에서 선택된 Top 3 솔루션

### 3.1 The Invisible Coach

- 음성 우선, hands-free 운동 보조.
- 이어버드를 통해 다음 운동, 남은 휴식, 목표 반복수/무게를 실시간 안내.
- 백그라운드에서 운동 데이터 자동 기록.
- single/double/triple tap 같은 간단한 물리 컨트롤로 session 진행.

### 3.2 AI-Powered Dynamic Routine Planner

- 운동 시작 전 목표, 근육군, 가능 시간 등을 기반으로 루틴 생성.
- 운동 중 기구가 사용 중이거나 사용자가 skip하면 같은 근육군 대체 운동 제안.
- 루틴을 실시간 재정렬해 흐름을 유지.

### 3.3 Automated Post-Workout Analytics & Progression Tracking

- 자동 수집된 운동 데이터를 운동 후 요약/시각화.
- 총 볼륨, consistency, progressive overload milestone, 최근 세션 대비 증감 표시.
- 숙련자는 성과 추적, 초보자는 이해하기 쉬운 피드백을 얻는다.

## 4. GA5 Core Tasks / Implementation Requirements

### 4.1 Core Tasks

1. **Real-time Audio Guidance**
   - 다음 운동, 목표 무게, 반복수, 남은 휴식 시간을 이어버드로 안내.
2. **Low-Interaction Data Logging and Control**
   - 화면 조작 없이 세트 완료/스킵/기구 사용 중 표시.
3. **Post-Workout Analytics & Progression Tracking**
   - 운동 후 기록을 시각화하고 progressive overload를 보여줌.

### 4.2 GA5 탭 컨트롤 정의

- **Single Tap**: 현재 세트 완료, 다음 세트 또는 휴식으로 진행.
- **Double Tap**: 현재 운동을 skip. “오늘 이 운동은 하지 않겠다.”
- **Triple Tap**: 현재 기구가 사용 중임을 표시. 현재 운동을 다음 순서로 밀고 다음 운동으로 진행.

## 5. 현재 Figma Make 프론트 코드 구조

기준 폴더: `apps/web/` (원본 Figma Make 폴더를 제품용 경로로 이동)

### 5.1 기술 스택

- Vite 6 + React 18 + TypeScript/TSX
- Tailwind CSS v4
- lucide-react icons
- react-dnd / react-dnd-html5-backend: 운동 목록 드래그 정렬
- shadcn/ui 기반 UI 컴포넌트 다수 포함
- localStorage 기반 운동 기록 저장

### 5.2 진입점과 라우팅 방식

- `src/main.tsx`
  - `createRoot(...).render(<App />)`만 수행.
  - `src/styles/index.css`를 전역 import.
- `src/app/App.tsx`
  - 별도 router 없이 `currentScreen` state로 화면 전환.
  - Screen union: `login | home | setup | preview | session | complete | profile`.
  - 핵심 타입 정의: `WorkoutGoal`, `MuscleGroup`, `WorkoutPlan`, `Exercise`, `ExerciseSet`.

### 5.3 주요 화면 컴포넌트

- `Login.tsx`
  - 이름 입력 후 localStorage에 `fitech_user_name` 저장.
  - 실제 인증은 없고 데모용 진입 화면.
- `Home.tsx`
  - 앱 랜딩/홈.
  - Start New Workout, progress 카드, earbud controls 설명, recent workouts mock 표시.
- `WorkoutSetup.tsx`
  - 목표, 근육군, 운동 시간 선택.
  - 현재는 선택값과 무관하게 하체 운동 mock template만 생성.
- `PlanPreview.tsx`
  - 생성된 운동 계획 확인/수정.
  - 운동 추가/삭제/수정, 세트별 kg/reps 수정, previous workout 불러오기, drag-and-drop 순서 변경.
  - 755 lines로 가장 큰 컴포넌트이며 앱 상태/폼/DnD/history 로직이 많이 섞여 있음.
- `WorkoutSession.tsx`
  - single/double/triple tap UI 버튼으로 이어버드 컨트롤 시뮬레이션.
  - 휴식 타이머, audio message banner, 운동 진행률 표시.
  - 운동 완료 시 localStorage history 저장.
- `WorkoutComplete.tsx`
  - 운동 완료 요약.
  - 현재 performance comparison은 실제 기록이 아니라 mock 데이터.
- `Profile.tsx`
  - 사용자 통계, PR, 설정 화면 mock.
  - Kim Minji, stats, personal records 모두 hardcoded.
- `src/app/utils/workoutHistory.ts`
  - localStorage key: `fitech_workout_history`.
  - 운동별 history 저장/조회, 2.5% 무게 증가 추천, 기본 무게 추천.

### 5.4 생성/보조 코드

- `src/app/components/ui/`
  - shadcn/ui 계열 컴포넌트가 대량 포함되어 있으나 현재 앱 화면에서는 거의 직접 사용하지 않음.
- `src/imports/랜딩페이지/`
  - Figma에서 export된 랜딩페이지 컴포넌트.
  - 현재 `App.tsx` 플로우에는 연결되어 있지 않음.
  - absolute/fixed pixel 기반 코드라 실제 제품 코드로는 재구성 필요.
- `src/styles/`
  - `index.css`, `tailwind.css`, `theme.css`, `globals.css` 존재.
  - 현재 `globals.css`는 import되지 않아 `.glass`, `.glass-dark`, `.animate-fade-in`, `.card-glow` 스타일이 production CSS에 포함되지 않는 문제가 있음.

## 6. 코드 리뷰 결과

### 6.1 검증 결과

원본 프로젝트를 직접 오염시키지 않기 위해 `/tmp/fitech-make-review`로 복사한 뒤 검증했다.

```bash
npm_config_cache=/tmp/fitech-npm-cache npm install --no-audit --no-fund
npm run build
```

결과:

- `npm install`: 성공, 285 packages 설치.
- `npm run build`: 성공.
- 빌드 산출물:
  - `dist/index.html` 약 0.53 kB
  - CSS 약 125.10 kB gzip 19.59 kB
  - JS 약 260.85 kB gzip 73.69 kB
- 임시 `node_modules`: 약 383 MB.

즉, **현재 코드는 빌드 가능하지만 제품화/협업/포트폴리오 공개 전 정리해야 할 문제가 많다.**

### 6.2 Severity-rated Findings

#### HIGH 1. 전역 커스텀 CSS가 앱에 적용되지 않음

- 근거:
  - `src/styles/index.css`는 `fonts.css`, `tailwind.css`, `theme.css`만 import.
  - `.glass`, `.glass-dark`, `.animate-fade-in`, `.card-glow`는 `src/styles/globals.css`에 정의되어 있지만 앱에서 import되지 않음.
  - 빌드된 CSS에서 해당 class들이 발견되지 않음.
- 영향:
  - 코드 곳곳의 glass 카드, fade animation, glow 디자인이 실제 배포 화면에서 빠짐.
  - Figma Make 시안과 실제 배포 UI가 달라질 수 있음.
- 권장 수정:
  - `src/styles/index.css`에 `@import './globals.css';` 추가.
  - 또는 `globals.css` 내용을 `theme.css`/`index.css`로 병합하고 중복 `theme.css` import 제거.

#### HIGH 2. GA4/GA5 핵심인 “voice-first/screenless”가 아직 실제 구현이 아님

- 현재 구현:
  - `WorkoutSession.tsx`의 audio guidance는 `audioMessage` 텍스트 배너.
  - 이어버드 탭은 실제 하드웨어 이벤트가 아니라 화면 버튼 click handler.
- 영향:
  - 제품 컨셉의 핵심 가치를 데모 UI로만 흉내 내는 상태.
- 권장 수정:
  - 1차 MVP: Web Speech API 기반 TTS로 실제 음성 안내 제공.
  - 2차: 키보드 shortcut/Media Session API/웨어러블 입력 가능성 검토.
  - 실제 Bluetooth 이어버드 탭 이벤트는 웹에서 직접 접근 제약이 크므로 “웹 MVP에서는 버튼/키보드/음성명령 시뮬레이션”과 “네이티브 확장 시 실제 이어버드 이벤트”를 구분해 문서화.

#### HIGH 3. 운동 계획 생성이 선택값을 반영하지 않음

- 근거: `WorkoutSetup.tsx`의 `generatePlan()`은 목표, 근육군, 시간 선택과 관계없이 Squats/Lunges/Leg Press/RDL/Calf Raises만 생성.
- 영향:
  - 사용자가 upper-body, core, arms 등을 선택해도 하체 루틴이 나옴.
  - GA5의 AI adaptive planner 요구와 맞지 않음.
- 권장 수정:
  - 운동 데이터베이스를 분리하고 `goal + muscleGroup + duration + level`에 따라 template을 선택.
  - MVP에서는 rule-based planner로 시작하고, 이후 AI planner로 교체 가능한 interface를 둔다.

#### MEDIUM 1. 세션 로직과 기록 저장이 실제 세트 단위 정확성과 맞지 않음

- 근거:
  - `WorkoutSession.tsx`에서 운동의 마지막 세트 완료 시 `currentExercise.setDetails.map(set => ({ ...set, completed: true }))`로 모든 세트를 한 번에 완료 처리.
  - double tap으로 마지막 운동을 skip하면 `onComplete(exercises)`만 호출하고 history 저장이 누락될 수 있음.
  - 운동 중간 완료/skip/occupied 이벤트가 history에 별도 event로 기록되지 않음.
- 영향:
  - post-workout analytics의 신뢰도가 낮아짐.
  - progressive overload 추천도 부정확해짐.
- 권장 수정:
  - `WorkoutSession`을 state machine 또는 reducer로 재작성.
  - `WorkoutEvent` 모델 추가: `set_completed`, `rest_started`, `exercise_skipped`, `equipment_occupied`, `session_completed`.

#### MEDIUM 2. 분석/프로필 화면이 mock/hardcoded 데이터 중심

- 근거:
  - `WorkoutComplete.tsx`의 performance comparison은 mockComparisons.
  - `Profile.tsx`의 이름, 통계, PR, 목표가 hardcoded.
- 영향:
  - 실제 사용 기록과 UI가 불일치.
  - 포트폴리오 시연 시 “실제 동작”보다 “정적 시안”으로 보일 위험.
- 권장 수정:
  - `workoutHistory`에서 session summary와 exercise comparison을 계산.
  - Login에서 저장한 사용자 이름을 Profile/Home에 반영.

#### MEDIUM 3. `PlanPreview.tsx`가 과도하게 커서 유지보수 리스크가 큼

- 근거:
  - `PlanPreview.tsx`는 755 lines.
  - drag/drop, edit form, add form, history loading, summary UI, exercise item UI가 한 파일에 섞임.
  - `editForm: any` 사용.
- 영향:
  - 팀원이 동시에 수정하면 충돌 가능성이 큼.
  - 테스트 작성 및 버그 추적이 어려움.
- 권장 수정:
  - `PlanSummary`, `ExerciseList`, `ExerciseCard`, `ExerciseEditForm`, `usePlanEditor`로 분리.
  - `EditExerciseFormState` 타입 명시.

#### MEDIUM 4. localStorage 데이터 모델이 MVP 이상으로 확장하기 어려움

- 근거:
  - history가 운동별 record 배열로만 저장됨.
  - session 단위 ID, user ID, version, migration, analytics summary가 없음.
- 영향:
  - 협업/멀티디바이스/배포 후 데이터 신뢰성 확보가 어려움.
- 권장 수정:
  - `storage` abstraction 도입.
  - localStorage MVP → Supabase/Firebase/custom API 같은 backend로 교체 가능하게 설계.
  - 저장 schema에 `schemaVersion`, `sessionId`, `userId`, `startedAt`, `completedAt`, `events` 포함.

#### MEDIUM 5. 협업/배포용 프로젝트 메타가 부족함

- 근거:
  - `package.json` name이 `@figma/my-make-file`.
  - lockfile 없음.
  - lint/test/typecheck script 없음.
  - GitHub remote가 현재 로컬 폴더에 설정되어 있지 않음.
- 영향:
  - 팀원이 같은 dependency graph로 설치/빌드하기 어려움.
  - CI에서 품질 검증 불가.
- 권장 수정:
  - package name을 `fitech` 또는 `fitech-web`으로 변경.
  - `pnpm-lock.yaml` 또는 `package-lock.json` 중 하나를 팀 표준으로 커밋.
  - `lint`, `typecheck`, `test` script 추가.
  - GitHub repo remote: `https://github.com/angellashin/FiTech`.

#### LOW 1. dependency와 generated UI 코드가 과하게 많음

- 근거:
  - 앱의 non-ui 실제 외부 import는 `react`, `lucide-react`, `react-dnd`, `react-dnd-html5-backend` 중심.
  - 그러나 `package.json`에는 MUI, Radix, recharts, router, sonner 등 59개 dependency/devDependency가 선언됨.
  - 임시 설치 기준 `node_modules` 약 383 MB.
- 영향:
  - 설치 시간 증가, 취약점 관리 범위 증가, 신규 팀원 진입 부담.
- 권장 수정:
  - 실제 사용할 UI kit을 선택: shadcn/ui 유지 또는 직접 Tailwind 컴포넌트화.
  - 쓰지 않는 MUI/slider/carousel/router 등은 제거.

#### LOW 2. 언어/카피/파일명이 섞여 있음

- 현재 UI는 한국어와 영어가 혼재한다.
- 폴더명과 파일명이 한글 조합형 Unicode라 일부 CLI/OS에서 다루기 불편할 수 있다.
- 권장:
  - repo 내부 앱 폴더를 `apps/web` 또는 `fitech-web`처럼 ASCII path로 옮기는 것을 권장.
  - UI 카피 정책: 포트폴리오가 한국어라면 주요 설명은 한국어, 코드/도메인 타입은 영어로 통일.

## 7. 권장 아키텍처 방향

현재 Figma Make 코드는 “시각 프로토타입 + 일부 상태 로직”이다. 앞으로는 다음 구조로 제품 코드화하는 것이 좋다.

```txt
apps/web/
  src/
    app/
      App.tsx
      routes-or-screens/
    features/
      onboarding/
      workout-setup/
      plan-preview/
      workout-session/
      workout-complete/
      profile/
    domain/
      workout.ts
      user.ts
      session.ts
    services/
      planner/
        planner.types.ts
        ruleBasedPlanner.ts
      audio/
        audioCoach.types.ts
        webSpeechAudioCoach.ts
      storage/
        storage.types.ts
        localStorageWorkoutRepository.ts
    shared/
      ui/
      components/
      hooks/
      utils/
    styles/
```

### 7.1 우선 분리해야 할 도메인 모델

- `UserProfile`
- `WorkoutGoal`
- `MuscleGroup`
- `Exercise`
- `ExerciseSet`
- `WorkoutPlan`
- `WorkoutSession`
- `WorkoutSessionEvent`
- `TapAction = single | double | triple`
- `AudioCue`

### 7.2 핵심 abstraction

- `WorkoutPlanner`
  - 입력: goal, muscleGroup, duration, level, history.
  - 출력: WorkoutPlan.
  - 1차는 rule-based, 2차는 AI planner.
- `WorkoutSessionController`
  - single/double/triple tap을 세션 이벤트로 변환.
  - UI와 비즈니스 로직을 분리.
- `AudioCoach`
  - `speak(cue)` / `stop()` / `setEnabled()`.
  - Web Speech API 구현부터 시작.
- `WorkoutRepository`
  - localStorage 구현부터 시작.
  - 나중에 backend repository로 교체.

## 8. 구체적인 개발 로드맵

### Phase 0. Repo/문서 기반 정리

목표: 팀원이 같은 기준으로 개발할 수 있는 repository foundation 만들기.

- GitHub remote 연결: `https://github.com/angellashin/FiTech`
- 폴더 구조 정리:
  - 현재 Figma Make 폴더를 `apps/web` 또는 repo root web app으로 이동.
  - PDF 자료는 `docs/references/`로 이동.
  - 이 문서는 `docs/fitech-development-brief.md`로 유지.
- README 작성:
  - 프로젝트 소개, 문제 정의, 핵심 기능, 실행 방법, 배포 링크, 스크린샷/GIF, 팀원, 자료 출처.
- 협업 파일 추가:
  - `.gitignore`
  - PR template
  - issue templates
  - `CONTRIBUTING.md`
- package metadata 정리:
  - `name: "fitech-web"`
  - `private: true`
  - package manager 결정 및 lockfile 커밋.

완료 기준:

- 새 팀원이 README만 보고 install/dev/build 가능.
- GitHub repo에서 문서와 코드 위치가 명확함.

### Phase 1. Figma Make 코드 안정화 및 즉시 배포 가능 상태 만들기

목표: 현재 시안을 깨지 않고 배포 가능한 MVP shell 확보.

작업:

1. `globals.css` import 문제 수정.
2. package scripts 추가:
   - `dev`, `build`, `preview`, `typecheck`, `lint`.
3. TypeScript 설정 추가:
   - `tsconfig.json`, `tsconfig.node.json`.
4. 불필요 dependency 1차 정리.
5. Vercel 또는 GitHub Pages 배포 연결.
6. CI 추가:
   - install → typecheck → build.

완료 기준:

- `npm/pnpm install`, `build`, `preview`가 fresh clone에서 성공.
- main branch push 시 자동 build 검증.
- 포트폴리오에 올릴 수 있는 배포 URL 존재.

### Phase 2. 앱 구조 리팩터링

목표: 팀 협업 가능한 코드베이스로 분해.

작업:

1. `App.tsx` 타입을 `domain/workout.ts` 등으로 이동.
2. `PlanPreview.tsx` 분리:
   - `PlanSummary`
   - `ExerciseList`
   - `ExerciseCard`
   - `ExerciseEditForm`
   - `usePlanEditor`
3. `WorkoutSession.tsx` 로직 분리:
   - `useWorkoutSession`
   - reducer/state machine 도입.
4. `workoutHistory.ts`를 repository/service로 승격.
5. mock data를 `fixtures/` 또는 `mocks/`로 분리.

완료 기준:

- 각 주요 컴포넌트가 200~250 lines 이하.
- 핵심 세션 로직이 UI 없이 unit test 가능.

### Phase 3. Screenless MVP 구현

목표: GA5 핵심 과제를 실제 데모 가능한 수준으로 구현.

작업:

1. Real audio guidance:
   - Web Speech API TTS로 다음 운동/세트/휴식 안내.
   - mute/toggle 제공.
2. Tap controls 개선:
   - 화면 버튼 + 키보드 shortcut으로 single/double/triple tap 시뮬레이션.
   - 각 tap action을 session event로 기록.
3. Rule-based planner:
   - muscle group별 exercise database 구축.
   - duration에 따라 운동 수/세트 수 조정.
   - history 기반 2.5% progressive overload 적용.
4. Dynamic re-sequencing:
   - triple tap 시 “기구 사용 중” 이벤트 기록.
   - 같은 muscleGroup 대체 운동 후보 제안 또는 현재 운동 순서 이동.
5. Workout complete analytics:
   - session record 기반 total sets, volume, previous session comparison 계산.

완료 기준:

- 사용자가 화면을 거의 보지 않고 음성 안내/탭 시뮬레이션으로 한 세션을 끝낼 수 있음.
- 운동 후 analytics가 실제 방금 수행한 기록을 반영.

### Phase 4. 포트폴리오 품질 향상

목표: 공개 링크에서 제품 의도와 완성도가 바로 보이게 만들기.

작업:

1. Onboarding/landing page 재구성:
   - Figma generated landing page를 제품 코드로 재작성.
   - 문제 → 해결 → 핵심 기능 → demo CTA.
2. 반응형/모바일 우선 QA.
3. Empty/error/loading state 정리.
4. 접근성:
   - 버튼 aria-label, focus state, keyboard navigation.
5. README에 demo GIF와 architecture diagram 추가.
6. Portfolio narrative:
   - “screenless workout assistant” 문제 해결 흐름 강조.

완료 기준:

- 포트폴리오 방문자가 1분 안에 문제/해결/핵심 기능을 이해.
- 모바일에서 데모 세션 수행 가능.

### Phase 5. AI/Backend 확장

목표: 단순 mock에서 실제 개인화 서비스로 확장.

작업 후보:

1. 사용자 계정/동기화:
   - Supabase/Firebase/custom backend 중 선택.
2. AI planner API:
   - rule-based planner를 fallback으로 유지.
   - AI output schema validation 필수.
3. 운동 데이터 확장:
   - exercise library, substitution map, equipment availability simulation.
4. 장기 analytics:
   - 주간 볼륨, PR, consistency, deload suggestion.
5. PWA:
   - 홈 화면 추가, offline cache, workout 중 화면 lock 방지 UX.

완료 기준:

- demo mode와 authenticated mode를 분리.
- 데이터가 cross-device로 유지.

## 9. 우선순위 Backlog

### P0: 반드시 먼저

- [ ] 현재 앱 폴더를 repo 친화적인 경로로 정리.
- [ ] `globals.css` 적용 누락 수정.
- [ ] package name/lockfile/scripts 정리.
- [ ] README + 실행 방법 + 배포 방법 작성.
- [ ] fresh clone build 검증 CI 추가.

### P1: MVP 제품화

- [ ] WorkoutSetup이 선택값에 맞는 plan을 생성하도록 수정.
- [ ] `PlanPreview.tsx` 분해.
- [ ] `WorkoutSession` reducer/state machine 도입.
- [ ] Web Speech API로 실제 음성 안내 추가.
- [ ] localStorage history를 session/event 기반 schema로 변경.
- [ ] WorkoutComplete analytics를 실제 기록 기반으로 변경.

### P2: 포트폴리오/협업 품질

- [ ] landing/onboarding 페이지 제품화.
- [ ] 모바일 responsive QA.
- [ ] GitHub issue/PR template 추가.
- [ ] 주요 화면 screenshot/GIF를 README에 삽입.
- [ ] dependency pruning.

### P3: 확장 기능

- [ ] AI planner API 연동.
- [ ] 사용자 계정/백엔드 저장.
- [ ] 대체 운동 추천 데이터베이스 고도화.
- [ ] PWA/offline workout support.

## 10. 협업 운영 권장안

- `main`: 항상 배포 가능한 상태.
- feature branch: `feature/session-audio`, `feature/planner-rules`, `refactor/plan-preview-split` 등.
- PR 단위:
  - 한 PR은 한 기능 또는 한 리팩터링 목적만.
  - PR description에 변경 이유, 테스트 결과, 스크린샷 포함.
- GitHub Issues:
  - label: `p0`, `p1`, `bug`, `feature`, `refactor`, `docs`, `design`.
- 커밋 메시지:
  - 왜 바꿨는지 중심으로 작성.
  - 중요한 결정은 `Tested:`, `Not-tested:`, `Directive:` 같은 trailer로 남긴다.

## 11. 다음 실행 추천 순서

1. repo root 정리 및 GitHub remote 연결.
2. 현재 Figma Make 앱을 `apps/web`로 옮기고 README/lockfile/CI 추가.
3. `globals.css` 누락 수정 후 배포.
4. `WorkoutSetup` rule-based planner 구현.
5. `WorkoutSession` state machine + Web Speech TTS 구현.
6. 실제 기록 기반 analytics 구현.
7. landing/README/GIF 정리 후 포트폴리오 링크 공개.


---

## 12. Ralph 실행 업데이트 — 2026-05-08

이번 Ralph 실행에서 위 로드맵의 초기 단계를 실제 코드베이스에 반영했다.

### 완료된 구조 정리

- Git repository 초기화.
- GitHub remote 설정: `https://github.com/angellashin/FiTech.git`.
- Figma Make 앱 폴더를 `apps/web/`로 이동.
- GA4/GA5 PDF를 `docs/references/`로 이동.
- root 협업 문서 추가: `README.md`, `CONTRIBUTING.md`.
- GitHub PR/issue templates 추가.
- CI 및 GitHub Pages workflow 추가.

### 완료된 앱 개선

- `apps/web/src/styles/index.css`에서 `globals.css`를 import하도록 수정하여 `.glass`, `.glass-dark`, `.animate-fade-in`, `.card-glow`가 실제 build CSS에 포함되게 함.
- `apps/web/package.json`을 앱용 metadata/scripts로 정리.
- `tsconfig.json`, `tsconfig.node.json`, `package-lock.json` 추가.
- `workoutPlanner.ts` 추가: goal/muscleGroup/duration 기반 rule-based plan generation.
- `useAudioCoach.ts` 추가: Web Speech API 기반 browser speech guidance.
- `workoutHistory.ts` 확장: session/event/exercise history, volume 계산, previous exercise history 조회.
- `WorkoutSession.tsx` 개선: single/double/triple tap 이벤트 기록, audio toggle, speech guidance, session-level 저장.
- `WorkoutComplete.tsx` 개선: 실제 local history 기반 completed sets, volume score, previous-vs-current comparison.
- `Profile.tsx` 개선: localStorage 사용자 이름 및 local session/history 기반 stats/PR 표시.

### 검증 증거

`apps/web`에서 다음 명령을 실행해 통과를 확인했다.

```bash
npm install --no-audit --no-fund
npm run typecheck
npm run build
```

또한 build 산출 CSS에서 다음 custom classes가 포함됨을 확인했다.

- `.glass-dark`
- `.glass`
- `.animate-fade-in`
- `.card-glow`

### 아직 남은 리스크

- 실제 GitHub push/Pages 활성화는 인증/원격 권한이 필요하므로 로컬에서는 workflow 구성까지만 완료됨.
- 실제 Bluetooth 이어버드 하드웨어 이벤트는 web MVP 범위 밖이며 현재는 버튼/브라우저 speech로 screenless interaction을 시뮬레이션한다.
- `PlanPreview.tsx`는 아직 큰 파일이므로 다음 refactor pass에서 분리하는 것이 좋다.
- dependency pruning은 build 안정화 후 별도 PR로 진행하는 것이 안전하다.

### Architect WATCH follow-up fixes completed

After architect verification returned `WATCH`, the following non-blocking but high-signal issues were fixed in the same Ralph session:

- Domain workout types were extracted from `App.tsx` into `apps/web/src/app/domain/workout.ts` so services/utilities no longer depend on the UI shell.
- `session_completed` events now pass explicit `null` exercise/set metadata, avoiding accidental inheritance of the current exercise and set.
- Exercise history writes now persist only completed set details, preventing skipped or entirely incomplete exercises from polluting future progressive-overload recommendations.

Post-fix verification:

```bash
cd apps/web
npm run typecheck
npm run build
```

Both commands passed.
