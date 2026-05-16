# FiTech Development Progress — 3rd Team Handoff

배포 URL: https://angellashin.github.io/FiTech/  
작업 브랜치: `yunje` 기반 로컬 클론 (`C:\Users\USER\Desktop\FiTech`)  
작업 범위: Profile 화면 완성 · 운동 루틴 저장/불러오기 · LLM 기반 운동 계획 생성 · 헬스장 기구 프로필

---

## 주요 변화 (Major Features)

### 1. Settings 토글 — 실제 동작 연결

기존 Profile의 Settings 토글 3개가 하드코딩(`enabled: true`)으로 클릭해도 아무 효과 없었음. 전부 실제 기능에 연결.

| 설정 | 동작 |
|------|------|
| Audio Guidance | OFF 시 운동 세션 TTS 음성 안내 비활성화 |
| Rest Notifications | OFF 시 쉬는시간 카운트다운 beep(띵~/땅!) 전부 무음 |
| Dark Mode | OFF 시 CSS invert 필터로 즉시 라이트 모드 전환 |

**저장 방식:** `localStorage` 키 `fitech_user_settings`에 JSON으로 저장. 앱 재시작 후에도 유지.

**신규 파일:** `src/app/utils/userSettings.ts`
- `getUserSettings()` — 설정 읽기 (기본값: 전부 true)
- `setUserSetting(key, value)` — 개별 설정 쓰기
- `applyDarkMode(dark: boolean)` — `html` 태그에 `light-mode` 클래스 토글

**Dark Mode 구현:** `src/styles/globals.css`에 아래 추가
```css
html.light-mode {
  filter: invert(1) hue-rotate(180deg);
}
html.light-mode img, html.light-mode video, html.light-mode canvas {
  filter: invert(1) hue-rotate(180deg);
}
```
> 프로토타입 수준의 라이트 모드. 컴포넌트별 색상 분기 없이 CSS 필터로 전체 반전.  
> 향후 Tailwind `dark:` 클래스 방식으로 고도화 가능.

**App.tsx 변경:** 앱 초기 마운트 시 `applyDarkMode(getUserSettings().darkMode)` 호출 추가 — 새로고침 후에도 다크/라이트 모드 유지.

---

### 2. WorkoutSession — 설정 값 반영

**Audio Guidance:**
- `WorkoutSession.tsx`의 `audioEnabled` 초기값을 `true` 하드코딩 → `getUserSettings().audioGuidance`로 변경
- Profile에서 설정을 바꾸면 다음 세션부터 반영됨

**Rest Notifications:**
- 쉬는시간 `useEffect` 내 `playTone()` 호출부를 `restNotificationsEnabled` 조건으로 감쌈
- 10초 전 경고음 / 3·2·1초 카운트다운 beep / 완료 땅! 모두 설정 OFF 시 무음

---

### 3. 프로필 편집 — 바텀 시트 모달

연필(✏️) 버튼 클릭 시 바텀 시트가 슬라이드 업.

편집 가능 항목:
- **아바타 색상** — 파랑/보라/초록/빨강/주황 5가지 원형 버튼으로 선택
- **Display Name** — 최대 30자 (빈칸 저장 시 기존 이름 유지)
- **Current Goal** — 최대 60자 자유 입력

**저장 키:**
| 항목 | localStorage 키 |
|------|----------------|
| 이름 | `fitech_user_name` (기존 키 유지) |
| 목표 | `fitech_user_goal` (신규) |
| 아바타 색상 인덱스 | `fitech_avatar_color` (신규) |

Save 버튼 클릭 즉시 카드에 반영. 외부 탭 또는 Cancel로 변경사항 취소.

---

### 4. About FiTech / Help & Support — Accordion 섹션

버튼 클릭 시 아래로 펼쳐지는 구조. 별도 화면 전환 없음.

**About FiTech:**
- 앱 아이콘, 버전(v1.0.0), 소개 문구
- Platform / Audio / Storage / Earbud control 기술 정보 표

**Help & Support — FAQ 8개:**
1. 이어폰 버튼 조작법 (1/2/3탭)
2. 음성 안내가 안 나올 때
3. 무게 추천 로직 3단계
4. Workout Intensity가 하는 일
5. 이전 운동 불러오기 방법
6. 데이터 저장 위치 (localStorage 키 명시)
7. 운동 계획 편집 방법
8. 오프라인 사용 가능 여부

FAQ 각 항목은 내부 accordion으로 하나씩 열고 닫힘.

---

### 5. Log Out — 확인 다이얼로그 포함

Log Out 버튼 클릭 → 중앙 확인 다이얼로그 표시.

**로그아웃 시 삭제되는 데이터:**
- `fitech_user_name`
- `fitech_user_goal`
- `fitech_avatar_color`

**로그아웃 후에도 보존되는 데이터:**
- `fitech_workout_sessions` — 운동 세션 기록
- `fitech_workout_history` — 세트별 무게/반복 기록
- `fitech_user_settings` — 설정값

> 실수로 눌러도 운동 기록이 날아가지 않도록 의도적으로 보존.

로그아웃 완료 후 Login 화면으로 이동 (`App.tsx`의 `handleLogout`).

---

### 6. Cloud Sync 섹션 — 조건부 표시

기존에는 Supabase 연결 없이도 "Complete a workout to sync" 문구가 항상 표시됨.  
→ `getLastCloudSyncStatus()`가 `null`이면 섹션 자체를 숨기도록 변경.  
현재 anon key 미설정 환경에서는 Cloud Sync 섹션이 보이지 않음.

---

### 7. 루틴 저장 & 불러오기 (Saved Routines)

운동 완료 후 해당 루틴에 이름을 붙여 저장하고, Home 화면에서 바로 불러올 수 있는 기능.

#### 저장 흐름 (WorkoutComplete)
- 운동 완료 화면 하단에 **Save Routine** 카드 추가
- 이름 입력 → Save 버튼 클릭 (이름 없으면 비활성화)
- 저장 성공 시 버튼이 BookmarkCheck 아이콘 + "Saved!" 으로 전환

#### 불러오기 흐름 (Home)
- Home 화면에 **My Routines** 섹션 조건부 표시 (저장된 루틴 없으면 미표시)
- 각 루틴: 이름 / 운동 개수 / 사용된 근육 그룹 / Load 버튼 / 삭제(🗑️) 버튼
- Load 버튼 클릭 → 해당 루틴의 운동 목록으로 바로 Plan Preview 진입

**저장 구조 (`fitech_saved_routines`):**
```ts
interface SavedRoutine {
  id: string;       // 저장 시각 기반 uuid
  name: string;     // 사용자 입력 이름
  savedAt: string;  // ISO 날짜 문자열
  exercises: Exercise[];
}
```

**신규 함수 (`src/app/utils/workoutHistory.ts`):**
- `getSavedRoutines()` — 전체 루틴 목록 읽기
- `saveRoutine(name, exercises)` — 루틴 저장 후 반환
- `deleteRoutine(id)` — ID로 삭제

---

### 8. LLM 기반 운동 계획 생성 (Gemini API)

기존 로컬 알고리즘 대신 Gemini AI가 운동 순서를 선택하도록 변경. **기존 로직은 100% 보존**하고 LLM은 오직 "어떤 운동을 어떤 순서로 고를지"만 결정.

#### 아키텍처

```
[사용자 입력: 근육 그룹 / 시간 / 강도]
          ↓
  buildPrompt() → Gemini API 호출
          ↓
  LLM 응답: ["Barbell Bench Press", "Cable Fly", ...]  (이름 배열만)
          ↓
  libraryIndex 매칭 → adaptForGoal() → getRecommendedSets() → 강도 배율 적용
          ↓
  최종 WorkoutPlan (기존 구조 그대로)
```

#### 핵심 설계 원칙
- LLM은 **이미 정의된 exerciseLibrary 목록 안에서만** 선택 가능 (새 운동 발명 불가)
- 모르는 이름이 응답에 포함되면 `console.warn` 후 skip
- API 실패 / 할당량 초과 시 기존 로컬 `generateWorkoutPlan`으로 자동 폴백

#### 사용 모델 및 API 키 관리
| 항목 | 값 |
|------|-----|
| 모델 | `gemini-2.5-flash` |
| API 키 | `.env.local`에 3개 등록 (키 로테이션) |
| 키 소진(429) 시 | 다음 키로 자동 전환 |
| 전체 키 소진 시 | 로컬 플래너로 폴백 |

**`.env.local` 설정:**
```env
VITE_GEMINI_API_KEY=...
VITE_GEMINI_API_KEY_2=...
VITE_GEMINI_API_KEY_3=...
```
> API 키가 하나도 없으면 처음부터 로컬 플래너 사용 (오프라인 완전 동작 보장).

#### 프롬프트 구조 (`buildPrompt`)
1. 강도 설명 (Very Light / Light / Normal / Hard / Very Hard)
2. 대상 근육 그룹
3. **헬스장 기구 제약** (My Gym 설정 시 자동 포함)
4. 근육 그룹별 운동 전체 목록 (LLM이 여기서만 고름)
5. 선택 가이드라인 (복합운동 우선, 논리적 순서 등)
6. 응답 형식: JSON 배열 `["운동명1", "운동명2", ...]` 만 출력

#### UI 변경 (`WorkoutSetup.tsx`)
- Generate Plan 버튼 클릭 시 "AI is building your plan..." 로딩 표시
- API 실패 후 폴백 시 하단에 "AI unavailable — generated with local planner" 문구 표시
- **My Gym Equipment** 섹션이 Intensity 바로 아래에 위치 (9번 항목 참고)

**신규 파일:** `src/app/services/llmWorkoutPlanner.ts`

---

### 9. My Gym — 헬스장 기구 프로필

사용자가 평소 이용하는 헬스장의 기구를 체크해두면 LLM이 그 기구로 할 수 있는 운동만 선택.

#### 위치
**Setup Workout 화면** → Intensity 섹션 바로 아래 **My Gym Equipment** 섹션 (아코디언 형태)

> Profile이 아닌 WorkoutSetup에 배치한 이유: 루틴 생성 직전에 기구를 바로 확인·조정하는 흐름이 더 자연스럽기 때문.

#### 기구 목록 (12종, 3 카테고리)

| 카테고리 | 기구 |
|---------|------|
| Free Weights | Barbell, Dumbbells, EZ Bar, Kettlebell |
| Machines & Cable | Cable Machine, Lat Pulldown Machine, Leg Press Machine, Pec Deck Machine, Smith Machine, Leg Extension / Curl Machine |
| Bodyweight Stations | Pull-up Bar, Dip Station |

#### 동작 방식
- 체크박스 클릭 즉시 `fitech_gym_profile`에 저장 (별도 Save 버튼 없음)
- 기구 미설정 시: 모든 운동 대상, 헤더에 "All exercises" 표시
- 기구 설정 시: LLM 프롬프트에 아래 문구 자동 삽입
  > *"User's gym equipment: Barbell, Dumbbells, ... Only select exercises that can be performed with the equipment listed above."*
- 헤더에 선택 수량 표시: "3 selected"
- Clear all 버튼으로 전체 초기화

**신규 파일:** `src/app/utils/gymProfile.ts`

---

## 변경된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/app/utils/userSettings.ts` | **신규** — 설정 read/write/applyDarkMode |
| `src/app/utils/gymProfile.ts` | **신규** — 헬스장 기구 프로필 read/write |
| `src/app/services/llmWorkoutPlanner.ts` | **신규** — Gemini API 호출, 프롬프트 빌드, 폴백 로직 |
| `src/styles/globals.css` | light-mode CSS 필터 추가 |
| `src/app/App.tsx` | 다크모드 초기 적용, handleLogout 추가, Profile에 onLogout prop 전달 |
| `src/app/components/Profile.tsx` | Settings 토글 연결, 프로필 편집 모달, About/Help accordion, 로그아웃, Cloud Sync 조건부 표시 |
| `src/app/components/WorkoutSession.tsx` | audioEnabled 초기값을 설정에서 읽기, restNotifications 조건 추가 |
| `src/app/components/WorkoutSetup.tsx` | My Gym Equipment 섹션 추가 (Intensity 아래), LLM 호출 연결 |
| `src/app/components/WorkoutComplete.tsx` | 루틴 저장 UI (이름 입력 + Save 버튼 + 완료 피드백) |
| `src/app/components/Home.tsx` | My Routines 섹션 추가 (Load / 삭제 기능 포함) |
| `src/app/utils/workoutHistory.ts` | SavedRoutine 타입 + getSavedRoutines / saveRoutine / deleteRoutine 추가 |
| `src/app/services/workoutPlanner.ts` | `adaptForGoal` export 추가 (llmWorkoutPlanner에서 재사용) |
| `apps/web/.env.local` | VITE_GEMINI_API_KEY, _2, _3 추가 |

---

## localStorage 키 전체 목록

| 키 | 내용 | 타입 |
|----|------|------|
| `fitech_user_name` | 사용자 이름 | string |
| `fitech_user_goal` | 현재 목표 문구 | string |
| `fitech_avatar_color` | 아바타 색상 인덱스 (0–4) | string(number) |
| `fitech_user_settings` | 오디오/알림/다크모드 설정 | JSON |
| `fitech_workout_sessions` | 완료된 운동 세션 목록 | JSON array |
| `fitech_workout_history` | 세트별 무게/반복 기록 | JSON array |
| `fitech_saved_routines` | 저장된 루틴 목록 | JSON array |
| `fitech_gym_profile` | 헬스장 보유 기구 목록 | JSON |

---

## 미구현 / 향후 과제

- **Dark Mode 고도화** — 현재 CSS `invert` 필터 방식. Tailwind `dark:` 클래스 기반으로 전환하면 색상 제어 정밀도 향상
- **Audio Guidance 세션 중 토글 → 영구 저장** — 세션 내 🔊 버튼 토글은 세션 종료 후 초기화됨. 영구 저장 연결 가능
- **운동 기록 삭제 기능** — 로그아웃 시 기록 보존 정책으로 수동 삭제 방법 없음. "Clear Workout History" 옵션 추가 고려
- **Personal Records 전체 보기** — 현재 상위 3개만 표시. 전체 기록 보기 화면 확장 가능
- **LLM 기구 매핑 정밀화** — 현재 LLM이 자연어로 기구-운동 연관을 추론. exerciseLibrary에 `requiredEquipment` 필드 추가 후 코드 레벨 필터링으로 정확도 향상 가능
- **Saved Routines 편집** — 저장된 루틴에서 개별 운동 추가/삭제 기능
- **프로필 사진 업로드** — 현재 이니셜+색상만 지원

---

## 로컬 개발 환경 세팅

```bash
git clone -b junseo https://github.com/angellashin/FiTech.git
cd FiTech/apps/web
cp .env.example .env.local
npm install
npm run dev
# → http://localhost:5173/FiTech/ 접속
```

**`.env.local` 설정 (필수)**

`.env.local` 파일은 보안상 git에 포함되지 않으므로 직접 생성해야 함.  
`apps/web/.env.local` 파일을 만들고 아래 내용을 그대로 붙여넣기:

```env
VITE_SUPABASE_URL=https://kqrqrahstuhvosnwbydp.supabase.co
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=AIzaSyDo5oOD-6hEpqRbgvBevuHHrtB0t08BqGM
VITE_GEMINI_API_KEY_2=AIzaSyAFesjO_mGeh3iCgbuk2pyAJNhGDOom0A0
VITE_GEMINI_API_KEY_3=AIzaSyClqM71Nw5EprV0uXIJSxagbzsZcbXEBfY
```

> - `VITE_SUPABASE_ANON_KEY`는 비워도 됨 — 로컬 전용 모드로 자동 동작  
> - Gemini API 키 3개는 Google AI Studio에서 발급한 키. 무료 tier 일일 할당량이 있으며, 키 하나가 429(할당량 초과)를 반환하면 자동으로 다음 키로 전환됨  
> - 키가 전부 소진되면 LLM 없이 로컬 알고리즘으로 폴백하므로 앱 자체는 정상 동작함

---

## 기술 스택 (변경 없음)

- React 18 + TypeScript + Vite + Tailwind CSS
- Supabase (optional — 없으면 localStorage 전용 모드 자동 전환)
- Gemini 2.5 Flash API (운동 계획 LLM, 없으면 로컬 플래너 폴백)
- localStorage — 모든 사용자 데이터 로컬 저장
- Web Audio API (운동 알림음)
- Web Speech API (TTS 음성 안내)
- Capacitor 6 (Android APK 빌드)
- GitHub Pages (자동 배포 — `yunje` 브랜치 push 시)
