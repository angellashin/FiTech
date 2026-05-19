# FiTech Continuation Onboarding Plan — 2026-05-18

작성 목적: 현재 `main` 최신 상태를 기준으로, 이후 수정/추가 작업과 의사결정을 팀원 온보딩 및 Notion 공유용으로 계속 누적한다.

## 현재 기준 상태

- 기준 브랜치/커밋: `main` / `3917b36`
- 웹 확인 URL: https://angellashin.github.io/FiTech/
- 최신 Pages 배포: https://github.com/angellashin/FiTech/actions/runs/25987422328
- 최신 Android APK 빌드: https://github.com/angellashin/FiTech/actions/runs/25987422320
- 로컬 환경 파일: `apps/web/.env.local`은 git ignore 대상이므로 커밋하지 않는다.

## 로컬 Gemini API 키 세팅

`apps/web/.env.local`에 아래 키 이름을 사용한다. 실제 키 값은 로컬 파일 또는 GitHub Actions Secrets에만 둔다.

```env
VITE_GEMINI_API_KEY=
VITE_GEMINI_API_KEY_2=
VITE_GEMINI_API_KEY_3=
```

주의:

- 키가 없으면 앱은 로컬 플래너로 fallback한다.
- 키가 quota/429로 실패하면 다음 키로 로테이션한다.
- 실제 API 키는 문서/커밋/스크린샷에 남기지 않는다.

## 바로 해결해야 할 기술부채

### P0 — CI 게이트 복구

상태: **2026-05-18 Ralph 작업에서 해결됨.** 기존에는 `npm run build`만 통과하고 `lint`, `typecheck`, `test`가 실패했기 때문에 팀 개발 안정성을 위해 가장 먼저 복구했다.

근거:

- CI는 `npm run lint` → `npm run format:check` → `npm run test` → `npm run typecheck` → `npm run build` 순서로 실행된다: `.github/workflows/ci.yml`
- 최신 GitHub CI 실패 원인도 lint 단계다.

작업:

1. `PlanPreview.tsx`의 삼항식 side-effect lint 오류를 if/else로 수정한다.
2. `WorkoutSession.tsx`, `useEarbudControls.ts`의 빈 catch block을 명시적 ignore 주석 또는 안전한 warning 처리로 교체한다.
3. `WorkoutSession.tsx` rest timer effect dependency에 `restNotificationsEnabled`/`playTone` 관련 구조를 정리한다.
4. `WorkoutSessionRecord.muscleGroup`과 `saveWorkoutHistory` meta 타입을 `MuscleGroup[]` 기준으로 맞춘다.
5. 기존 단일 muscle group 테스트를 현재 다중 선택 API 기준으로 업데이트한다.

검증:

```bash
cd apps/web
npm run lint
npm run test
npm run typecheck
npm run build
```

### P0 — API 키 노출 리스크 정리

현재 인수인계 문서에 실제 Gemini 키가 남아있을 가능성이 있다. 유효 키라면 즉시 폐기/재발급하고, 문서에는 변수명만 남겨야 한다.

작업:

1. `apps/web/HANDOFF_3.md`의 실제 키 값 제거.
2. GitHub Secrets에는 `VITE_GEMINI_API_KEY`, `_2`, `_3`만 유지.
3. 노출된 키가 실제 동작 키라면 Google AI Studio에서 rotate/revoke.
4. 향후 문서에는 `.env.example` 형태만 공유.

검증:

```bash
rg "<Gemini-key-prefix>|<non-empty Gemini env value regex>" . --glob '!apps/web/node_modules/**' --glob '!apps/web/dist/**'
```

## 미구현 / 향후 과제 리스트

### 1. Dark Mode 고도화

현재 상태:

- `html.light-mode`에 CSS `invert()` 필터를 적용하는 프로토타입 방식.

문제:

- 이미지/비디오/차트 색상이 왜곡될 수 있음.
- 컴포넌트별 색상 의도가 유지되지 않음.

계획:

1. 디자인 토큰 또는 Tailwind `dark:`/theme class 기준으로 색상 체계를 분리한다.
2. 주요 화면(Home, Setup, PlanPreview, Session, Complete, Profile)부터 순차 적용한다.
3. 스크린샷으로 dark/light 주요 화면을 비교한다.

완료 기준:

- 라이트 모드에서 invert 필터 없이 주요 텍스트 대비가 유지된다.
- 운동 중 화면과 Profile 화면에서 색상 왜곡이 없다.

### 2. Audio Guidance 세션 중 토글 영구 저장

현재 상태:

- Profile 설정은 다음 세션 시작 시 반영된다.
- WorkoutSession 안의 🔊 버튼 토글은 해당 세션 안에서만 유지된다.

계획:

1. 세션 내 토글 시 `setUserSetting('audioGuidance', value)`까지 호출한다.
2. Profile과 Session 간 설정 상태가 서로 일관되도록 읽기/쓰기 흐름을 정리한다.
3. TTS `stop()` 호출 시점도 함께 확인한다.

완료 기준:

- 세션 중 OFF → 앱 재시작/다음 세션에서도 OFF 유지.
- Profile 토글과 Session 토글이 같은 값으로 보인다.

### 3. 운동 기록 삭제 기능

현재 상태:

- 다른 사용자 이름으로 로그인할 때만 기록이 초기화된다.
- 사용자가 직접 기록을 지울 수 있는 UI가 없다.

계획:

1. Profile Settings 또는 Help 아래에 `Clear Workout History` 위험 액션 추가.
2. 확인 다이얼로그에서 삭제 범위를 명확히 표시한다.
   - 운동 세션
   - 운동 히스토리
   - 저장 루틴 포함 여부는 별도 옵션 권장
3. 삭제 유틸 함수를 `workoutHistory.ts`에 추가한다.

완료 기준:

- 삭제 후 Home 통계/Recent Workouts/Personal Records가 즉시 empty state로 갱신된다.
- 삭제 취소 시 데이터가 유지된다.

### 4. Personal Records 전체 보기

현재 상태:

- Profile에서 상위 3개 record만 표시한다.

계획:

1. `View all` 버튼 또는 accordion 확장 패턴을 추가한다.
2. exercise별 최고 중량/최고 볼륨/최근 PR 기준을 정의한다.
3. 기록이 없을 때 empty state를 추가한다.

완료 기준:

- 모든 PR을 exercise별로 확인 가능.
- 기존 상위 3개 요약은 유지된다.

### 5. LLM 기구 매핑 정밀화

현재 상태:

- Gemini 프롬프트에 사용자의 헬스장 장비 목록을 넣지만, 실제 필터링은 LLM의 자연어 추론에 의존한다.

계획:

1. `ExerciseTemplate`에 `requiredEquipment` 필드를 추가한다.
2. `exerciseLibrary` 전체 운동에 필요한 장비를 매핑한다.
3. LLM 호출 전 후보 운동 목록을 코드 레벨에서 먼저 필터링한다.
4. LLM 응답 후에도 장비 조건 위반 운동을 검증/skip한다.
5. 장비 필터로 운동 수가 부족하면 bodyweight 또는 fallback 정책을 정의한다.

완료 기준:

- 선택 장비에 없는 운동은 PlanPreview에 나타나지 않는다.
- Gemini 실패/오응답 시에도 로컬 fallback이 같은 장비 제약을 지킨다.

### 6. Saved Routines 편집

현재 상태:

- 루틴 저장, 불러오기, 삭제는 가능하다.
- 저장된 루틴 자체를 편집하는 기능은 없다.

계획:

1. Home의 My Routines 항목에 Edit 진입점을 추가한다.
2. 기존 PlanPreview 편집 UI를 재사용해 운동 추가/삭제/재정렬/세트 수정을 지원한다.
3. `updateRoutine(id, patch)` 유틸을 추가한다.

완료 기준:

- 저장 루틴을 수정해도 기존 완료 세션 기록은 변경되지 않는다.
- 수정 후 Load 시 최신 루틴 내용이 반영된다.

### 7. 프로필 사진 업로드

현재 상태:

- 이니셜 + 색상 아바타만 지원한다.

계획:

1. 로컬 이미지 업로드를 먼저 지원한다.
2. 이미지는 localStorage 용량 이슈가 있으므로 압축 또는 IndexedDB 사용을 검토한다.
3. Supabase 연결 시 Storage 연동은 별도 단계로 분리한다.

완료 기준:

- 업로드/변경/삭제 가능.
- 이미지가 없어도 기존 이니셜 아바타 fallback 유지.

## 추천 개발 순서

1. **CI 복구**: lint/typecheck/test를 먼저 통과시켜 이후 변경의 기준선을 만든다.
2. **보안 정리**: 문서 내 API 키 제거 및 키 rotate 여부 확인.
3. **Gemini 로컬 테스트**: `.env.local` 키 입력 후 AI planner 성공/fallback 경로 확인.
4. **작은 UX 개선부터 진행**: Audio Guidance 영구 저장, Clear History처럼 영향 범위가 좁은 기능부터 구현.
5. **큰 구조 변경 진행**: LLM 장비 매핑, Dark Mode 고도화, Saved Routine 편집.
6. **온보딩 문서 업데이트**: 기능 추가/수정이 끝날 때마다 이 문서 마지막에 “이번 변경 요약”을 누적한다.

## 작업 기록 템플릿

새 변경을 마친 뒤 아래 형식으로 이 파일 마지막에 추가한다.

```md
## YYYY-MM-DD 변경 요약

### 추가/수정

-

### 변경 파일

-

### 검증

- [ ] npm run lint
- [ ] npm run test
- [ ] npm run typecheck
- [ ] npm run build

### 남은 리스크 / 다음 작업

-
```

## 2026-05-18 현재 검증 메모

통과:

- `npm ci --cache /tmp/fitech-npm-cache`
- `npm run build`

이전 실패 원인:

- `npm run lint`: `PlanPreview.tsx`, `WorkoutSession.tsx`, `useEarbudControls.ts`
- `npm run typecheck`: 다중 muscle group 타입 전환 미완료
- `npm test`: 기존 테스트가 예전 단일 muscle group API 기준

해결 메모:

- `PlanPreview` 삼항식 side effect 제거.
- 빈 `catch` 블록 명시적 처리.
- `WorkoutSessionRecord.muscleGroup`을 `MuscleGroup[]` 기준으로 정리.
- 기존 테스트를 session schema v2와 다중 muscle group 기준으로 업데이트.

---

## 2026-05-18 운동 기록 경험 고도화 계획

작성 배경: 다음 개발 축은 단순히 “운동을 저장한다”가 아니라, FiTech가 운동 중 screenless 기록을 쌓고 → 운동 직후 회고를 받고 → 기록을 분석하고 → 다음 루틴 생성에 반영하는 루프를 만드는 것이다.

### 외부 앱 리서치 요약

확인일: 2026-05-18

- BurnFit 공식 사이트: https://burnfit.io/en/
  - 빠른 운동 로그, 루틴/프로그램, 1RM 기반 운동 강도, 종목/기간별 성장 그래프, 부위별 볼륨/세트, 근육 피로 heatmap을 강조한다.
  - 기록 경험을 “10초 안에 남기는 로그”와 “분석으로 성장 확인”으로 연결한다.
- BurnFit App Store 설명: https://apps.apple.com/us/app/%EB%B2%88%ED%95%8F-%ED%97%AC%EC%8A%A4-%EC%9A%B4%EB%8F%99%EC%9D%BC%EC%A7%80-%EC%9A%B4%EB%8F%99%EA%B8%B0%EB%A1%9D-%EC%9A%B4%EB%8F%99%EB%A3%A8%ED%8B%B4/id1503464984?l=ko
  - 하루 여러 회차 운동 기록, 운동 캘린더, 주/월 리포트, 부위별 비율, 운동 메모/검색, 체중·체지방·근육량과 운동 기록 비교를 강조한다.
- Fleek App Store: https://apps.apple.com/us/app/fleek-workout-tracker-log/id1576993198
  - AI 개인화, 실시간 progress monitoring, 기록/통계 정리, HealthKit/Apple Watch 연동을 강조한다.
- Fleek Google Play: https://play.google.com/store/apps/details?id=com.primero.fleekfrontend
  - 루틴 저장/공유, 성장 그래프, 다른 사용자와 상대적 퍼포먼스 비교, 팔로잉한 사람의 기록 확인, 400+ 운동 지원, trainer mode 방향성을 강조한다.
- Planfit 참고: https://planfit.ai/ko
  - 프로필/목표/헬스장 장비 기반 AI 플랜, 운동 영상/음성 코칭, 진행도와 근육 회복 상태 추적을 강조한다. FiTech의 My Gym + LLM planner 방향과 맞닿아 있다.

### FiTech의 차별화 방향

경쟁 앱은 “많이 기록하고 자세히 분석”이 강점이다. FiTech는 여기에 **운동 중 화면을 덜 보는 기록 경험**을 차별점으로 가져가야 한다.

핵심 루프:

```text
운동 전: 목표/장비/최근 피로도 기반 플랜 생성
  ↓
운동 중: 이어폰 탭 + 최소 화면 조작으로 실제 수행 기록 저장
  ↓
운동 직후: 30초 회고로 단일 face rating/메모 수집
  ↓
기록 화면: 캘린더·타임라인·종목별 성장·부위별 볼륨/피로도 확인
  ↓
다음 루틴: 기록 기반 중량/세트/운동 선택/회복 추천에 반영
```

### 기록 경험에서 필요한 기능 묶음

#### A. 운동 직후 리뷰 / 회고

현재 상태:

- `WorkoutSession`에서 완료된 세트와 이벤트를 저장한다.
- `WorkoutComplete`는 완료 세트, 운동 수, volume score, 이전 대비 중량 비교, 루틴 저장만 보여준다.

추가할 것:

1. 세션 전체 리뷰
   - 별도 난이도/컨디션/에너지 카테고리를 만들지 않고, 1~5단계 라인 얼굴 아이콘 하나로 운동 전체 체감을 저장한다.
   - 이 하나의 face rating이 난이도, 컨디션, 에너지, 만족도를 포괄한다.
   - 자유 메모는 선택 입력으로 둔다.
2. 운동별 리뷰
   - 운동별 별도 리뷰 UI는 두지 않는다.
   - “너무 쉬움/적절함/어려움” 같은 단어형 카테고리는 UI에서 쓰지 않는다.
   - 통증, 자세, 기구 점유 같은 세부 맥락은 선택 메모/이벤트 로그로 남긴다.
3. 자동 하이라이트
   - 오늘 PR 발생
   - 계획 대비 완료율
   - 지난 같은 운동 대비 볼륨 변화
   - 너무 많이 건너뛴 운동/세트

MVP UX:

- WorkoutComplete 상단 요약 아래에 `Quick Review` 카드 추가.
- 기본값은 skip 가능하게 두되, 3탭 이하로 저장 가능하게 설계.

완료 기준:

- 운동 완료 후 리뷰 저장 가능.
- 리뷰 없이도 기존 완료 흐름은 막히지 않음.
- 저장된 리뷰가 해당 세션 상세 화면에서 다시 보임.

#### B. 운동 기록 저장 구조 고도화

현재 상태:

- `WorkoutSessionRecord`는 세션 시작/완료 시각, goal, muscleGroup, duration, exercises, events, totalSets, completedSets, totalVolume을 저장한다.
- `WorkoutHistory`는 completed set이 있는 exercise 중심으로 저장된다.

제안 스키마 v2:

```ts
type WorkoutReviewRating = 1 | 2 | 3 | 4 | 5;

interface WorkoutSessionReview {
  // 1~5 라인 얼굴 아이콘으로 표시한다.
  // 난이도/컨디션/에너지/만족도를 하나로 포괄하는 단일 face rating.
  rating: WorkoutReviewRating;
  notes?: string;
  reviewedAt: string;
}

interface ExerciseReview {
  exerciseId: string;
  exerciseName: string;
  rating: WorkoutReviewRating;
  notes?: string;
  reviewedAt: string;
}

interface WorkoutSessionRecordV2 extends WorkoutSessionRecord {
  schemaVersion: 2;
  planSnapshot: WorkoutPlan;
  review?: WorkoutSessionReview;
  exerciseReviews?: ExerciseReview[];
  analytics?: {
    adherenceRate: number;
    volumeByMuscleGroup: Record<string, number>;
    estimatedOneRepMaxByExercise?: Record<string, number>;
    prs?: Array<{
      exerciseName: string;
      type: "weight" | "volume" | "reps";
      value: number;
    }>;
  };
}
```

저장 원칙:

- `planSnapshot`: 당시 생성된 원본 계획을 보존한다.
- `actualExercises`: 현재 `exercises`를 그대로 실제 수행 결과로 취급한다.
- `events`: 이어폰 탭/스킵/기구 점유 이벤트를 계속 보존한다.
- `review`: 사용자가 직접 남긴 주관 데이터를 별도 보존한다.
- 기존 localStorage 데이터는 migration 함수로 읽을 때 v2처럼 normalize한다.

#### C. 기록 탐색 화면

현재 상태:

- Home은 최근 3개 workout만 보여준다.
- Profile은 personal record 상위 3개만 보여준다.

추가할 화면/컴포넌트:

1. `WorkoutHistoryScreen`
   - Calendar view: 운동한 날/쉰 날 표시
   - Timeline view: 최근 세션 전체 목록
   - Filter: 부위, 운동명, 기간, 루틴명
2. `WorkoutDetailScreen`
   - 수행 운동 리스트
   - 세트별 실제 중량/반복/완료 여부
   - 리뷰/메모
   - PR/볼륨/완료율
   - `Load as Plan`, `Save as Routine`, `Edit Review`, `Delete Session`
3. `ExerciseHistoryScreen`
   - 특정 운동의 중량/반복/볼륨 추이
   - 최고 기록
   - 최근 5회 수행 비교
   - 다음 추천 중량/세트 근거 표시
4. `RecordsScreen`
   - Personal Records 전체 보기
   - `weight`, `estimated 1RM`, `volume`, `reps` 기준 토글

완료 기준:

- 사용자는 과거 운동을 “날짜 → 세션 → 운동 → 세트” 단위로 추적 가능.
- 특정 운동을 눌러 성장 추이를 확인 가능.
- 기록 삭제/리뷰 수정이 가능하고 Home 통계에 즉시 반영됨.

#### D. 분석/평가 엔진

계산할 지표:

1. 세션 지표
   - 완료율: completedSets / totalSets
   - 총 볼륨: sum(weight × reps), bodyweight 운동은 reps 기반 score
   - 계획 대비 실제 수행 시간
   - 스킵/기구 점유 이벤트 수
2. 운동별 지표
   - top weight
   - estimated 1RM: Epley 공식 `weight * (1 + reps / 30)` 우선
   - 최근 3회 volume trend
   - 성공률: 계획 세트 중 완료 비율
3. 부위별 지표
   - 최근 7/14일 volume
   - 부위별 세트 수
   - 피로도 score: 최근 볼륨, 마지막 수행일, face rating/통증 메모를 합산
4. 관리 지표
   - 주간 운동 빈도
   - 목표 부위 커버리지
   - 과부하 성공 여부
   - deload 필요 여부

출력 예시:

- “Chest volume +12% vs last chest session. Bench completed with a positive face review → keep the next bench close to today’s working load; only adjust if intensity/recovery supports it.”
- “Lower body fatigue high: trained 2 times in 3 days + Hard review. Recommend upper/core or light day.”
- “Cable Fly marked equipment-busy twice. Prefer Dumbbell Fly when generating plans.”

완료 기준:

- analytics 함수는 UI 없이 unit test로 검증 가능.
- 같은 세션 데이터에 대해 deterministic한 결과를 반환한다.

#### E. 다음 루틴 생성에 기록 반영

현재 상태:

- `getRecommendedSets`는 같은 운동은 마지막 완료 working set을 보수적으로 carry-forward하고, 다른 운동은 같은 muscle group strength base를 movement type별로 보정한다.
- LLM은 운동 이름 선택만 하고, 이후 기존 로직이 세트/중량을 채운다.

고도화 방향:

1. deterministic `trainingContext` 생성
   - 최근 14일 운동 부위/볼륨
   - 운동별 최근 성공/실패
   - 리뷰 기반 선호/비선호 운동
   - 통증/피로 부위
   - PR/정체 운동
2. local planner guardrail
   - 피로도 높은 부위는 강도 낮추기 또는 제외 추천
   - 완료율/리뷰가 좋아도 바로 증량하지 않고, 반복 성공이 쌓일 때만 소폭 조정
   - pain tag가 있으면 해당 movement pattern 제외
   - equipment-busy가 반복되면 대체 운동 우선
3. LLM prompt 확장
   - “운동 선택 이유”를 내부적으로 받되 UI에는 요약만 표시
   - 단, 최종 운동은 exerciseLibrary + equipment filter + safety guardrail로 검증
4. PlanPreview에 설명 카드 추가
   - “Why this plan?”
   - “Based on your last 3 chest sessions…”
   - “Recovery adjustment: lower-body volume reduced today.”

완료 기준:

- 다음 루틴 생성 시 최근 기록/리뷰가 실제 운동 선택 또는 중량에 영향을 준다.
- 영향 근거가 PlanPreview에 한 문장 이상 표시된다.
- LLM 실패 시에도 deterministic planner가 같은 trainingContext를 사용한다.

### 구현 단계 제안

#### Phase 0 — 기준선 복구

목표: 기록 경험 개발 전 CI를 다시 통과시키기.

작업:

- lint/typecheck/test 오류 수정.
- `WorkoutSessionRecord.muscleGroup` 타입을 `MuscleGroup[]`로 정리.
- 기존 테스트를 다중 muscle group API 기준으로 수정.

검증:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

#### Phase 1 — 리뷰 저장 MVP

목표: 운동 직후 subjective feedback을 저장한다.

예상 파일:

- `src/app/domain/workout.ts`
- `src/app/utils/workoutHistory.ts`
- `src/app/components/WorkoutComplete.tsx`
- 필요 시 `src/app/components/WorkoutReviewCard.tsx`

작업:

1. `WorkoutSessionReview`, `ExerciseReview` 타입 추가.
2. `saveWorkoutReview(sessionId, review)` 또는 `updateWorkoutSession(sessionId, patch)` 추가.
3. `WorkoutComplete`에 Quick Review 카드 추가.
4. 리뷰 저장 후 Home/Profile에서 읽을 수 있게 helper 추가.

검증:

- 리뷰 저장 unit test.
- 리뷰 없이 완료해도 기존 flow 정상.
- 새로고침 후 리뷰 유지.

#### Phase 2 — History / Detail UX

목표: 기록을 다시 보는 경험을 만든다.

예상 파일:

- `src/app/App.tsx`
- `src/app/components/Home.tsx`
- 신규 `src/app/components/WorkoutHistory.tsx`
- 신규 `src/app/components/WorkoutDetail.tsx`
- `src/app/utils/workoutHistory.ts`

작업:

1. Home의 Recent Workouts에 `View All` 추가.
2. WorkoutHistory 화면 추가.
3. WorkoutDetail 화면 추가.
4. 세션 삭제/리뷰 수정 액션 추가.

검증:

- 세션 목록 정렬/필터 test.
- 삭제 후 Home 통계 갱신.
- 완료된 세트와 이벤트 로그 표시 확인.

#### Phase 3 — Analytics Engine

목표: 기록을 평가 가능한 데이터로 바꾼다.

예상 파일:

- 신규 `src/app/services/workoutAnalytics.ts`
- `src/app/utils/workoutHistory.ts`
- `src/app/components/Profile.tsx`
- `src/app/components/WorkoutComplete.tsx`

작업:

1. session analytics 계산.
2. exercise PR/estimated 1RM 계산.
3. muscle fatigue/recovery score 계산.
4. Profile의 Personal Records 전체 보기와 연결.

검증:

- analytics unit test를 먼저 작성.
- bodyweight 운동과 weighted 운동을 분리 검증.

#### Phase 4 — Adaptive Planner 연결

목표: 기록이 다음 루틴 생성에 반영되게 한다.

예상 파일:

- 신규 `src/app/services/trainingContext.ts`
- `src/app/services/workoutPlanner.ts`
- `src/app/services/llmWorkoutPlanner.ts`
- `src/app/components/PlanPreview.tsx`

작업:

1. `buildTrainingContext()` 구현.
2. local planner에 context 기반 조정 추가.
3. LLM prompt에 context 요약 추가.
4. PlanPreview에 “Why this plan?” 표시.

검증:

- 최근 lower-body 피로도가 높으면 lower-body 강도가 낮아지는 test.
- 특정 운동 `replace` 리뷰가 있으면 대체 운동 우선 test.
- Gemini fallback 시에도 context 반영 test.

#### Phase 5 — Management Layer

목표: 사용자가 루틴/목표/회복을 관리하게 한다.

기능 후보:

- Weekly target: 주 n회, 부위별 목표 set 수
- Recovery dashboard: 부위별 회복 상태
- Deload suggestion: 3~4주 누적 피로 기준
- Body metrics: 체중/체지방/근육량 간단 기록
- Export: JSON/CSV 백업

MVP 우선순위:

1. Weekly target + 부위별 set coverage
2. Recovery dashboard
3. Body metrics는 후순위

### 첫 번째 구현 티켓 제안

가장 먼저 할 티켓:

> **Workout Review MVP + Session Schema v2**

범위:

- 운동 완료 후 5단계 line-face Quick Review 추가.
- 세션 리뷰 localStorage 저장.
- 기존 세션 데이터와 호환되는 migration/read helper 추가.
- WorkoutComplete에 리뷰 저장 확인 UI 추가.

왜 먼저인가:

- 루틴 추천 고도화에 필요한 사용자 주관 데이터가 아직 없다.
- UI 영향 범위가 `WorkoutComplete`와 `workoutHistory` 중심이라 작다.
- 이후 fatigue, planner, detail 화면의 기반 데이터가 된다.

수락 기준:

- 사용자가 운동 완료 후 단일 face rating과 선택 메모를 저장할 수 있다.
- 저장된 review가 세션 record에 연결된다.
- 리뷰를 건너뛰어도 운동 완료/루틴 저장은 기존처럼 동작한다.
- `npm run lint && npm run test && npm run typecheck && npm run build` 통과.

---

## 2026-05-18 Ralph 구현 요약 — 운동 기록 경험 고도화

### 추가/수정

- 운동 완료 화면에 **단일 5단계 라인 얼굴 아이콘 리뷰** 를 추가했다.
  - 세션 전체 리뷰는 난이도/컨디션/에너지/만족도를 나누지 않고 face rating 하나로 저장한다.
  - 세션 저장 스키마를 `schemaVersion: 2`로 정리하고, `planSnapshot`, `review`, `exerciseReviews`, `analytics` 확장 필드를 추가했다.
- 기존 localStorage 세션은 읽을 때 v2 형태로 normalize되도록 migration helper를 추가했다.
- Legacy `upper-body`/`arms`/`full-body` 세션은 v2 muscle group 배열로 normalize된다.
- Home에서 전체 기록 화면으로 진입하는 `View all` 경로를 추가했다.
- 신규 `WorkoutHistory` 화면에서 검색, 세션 상세, face review, adherence, PR signal, `Load Plan`, 세션 삭제를 지원한다.
- Profile에 Personal Records 전체 보기와 Clear Workout History 관리 액션을 추가했다.
- 분석 엔진을 추가했다.
  - adherence rate
  - 부위별 volume
  - estimated 1RM
  - PR signal
- `trainingContext`를 추가해 최근 14일 기록/face review/기구 점유 이벤트를 다음 루틴 생성에 반영한다.
- local planner와 Gemini planner prompt/fallback 모두 training context를 사용한다.
- PlanPreview에 “Why this plan?” 설명 카드를 추가했다.
- 세션 중 Audio Guidance 토글이 사용자 설정에 영구 저장되도록 수정했다.
- CI를 점진 강화했다.
  - 같은 브랜치 중복 CI 자동 취소 `concurrency` 추가.
  - `npm audit --audit-level=critical` 보안 게이트 추가.
  - GitHub Pages가 아닌 CI build에는 `GITHUB_PAGES=false` 명시.
- Supabase 동기화 row에서는 다중 muscle group 배열을 기존 DB 문자열 컬럼에 맞춰 comma-separated string으로 변환한다. 새 `plan_snapshot`, `review`, `exercise_reviews`, `analytics`는 JSONB 컬럼으로 보존한다.

### 변경 파일

- `.github/workflows/ci.yml`
- `supabase/migrations/002_workout_session_experience_fields.sql`
- `apps/web/src/app/App.tsx`
- `apps/web/src/app/components/Home.tsx`
- `apps/web/src/app/components/PlanPreview.tsx`
- `apps/web/src/app/components/Profile.tsx`
- `apps/web/src/app/components/WorkoutComplete.tsx`
- `apps/web/src/app/components/WorkoutHistory.tsx`
- `apps/web/src/app/components/WorkoutSession.tsx`
- `apps/web/src/app/domain/workout.ts`
- `apps/web/src/app/hooks/useEarbudControls.ts`
- `apps/web/src/app/services/llmWorkoutPlanner.ts`
- `apps/web/src/app/services/supabaseWorkoutSync.ts`
- `apps/web/src/app/services/trainingContext.ts`
- `apps/web/src/app/services/workoutAnalytics.ts`
- `apps/web/src/app/services/workoutPlanner.ts`
- `apps/web/src/app/utils/workoutHistory.ts`
- 관련 test 파일: `workoutHistory.test.ts`, `workoutPlanner.test.ts`, `workoutAnalytics.test.ts`, `trainingContext.test.ts`, `supabaseWorkoutSync.test.ts`

### 검증 체크리스트

최종 확인: 2026-05-18 Ralph post-deslop 검증 기준.

- [x] `npm audit --audit-level=critical`: 0 critical, 기존 high 취약점 3건은 별도 dependency upgrade 필요
- [x] `npm run lint`
- [x] `npm run format:check`
- [x] `npm test` — 5 files / 35 tests pass
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] dev server smoke: `http://127.0.0.1:5173/` HTTP 200

### 남은 리스크 / 다음 작업

- Gemini 키는 `apps/web/.env.local`에만 두고 커밋하지 않는다. `VITE_` 키는 클라이언트 번들에 포함될 수 있으므로 장기적으로는 서버 프록시/Edge Function 이전을 검토한다.
- Supabase review/analytics 동기화용 migration은 `supabase/migrations/002_workout_session_experience_fields.sql`에 추가했다. 실제 프로젝트 DB에 이 migration을 적용해야 cloud row가 새 JSONB 필드를 받을 수 있다.
- 실제 Android 기기/이어버드 탭 플로우는 로컬 unit/build 검증 외에 물리 기기 smoke test가 필요하다.
- 다음 추천 개발: Recovery dashboard, weekly target, body metrics, Supabase cloud readback, saved routine 편집.

### 2026-05-19 Quick Review 운동별 리뷰 제거

- 운동 완료 후 Quick Review는 세션 전체 5단계 라인 얼굴 아이콘 리뷰와 선택 메모만 남긴다.
- 운동별 별도 리뷰 선택 UI와 저장 호출은 제거했다.
- 운동별 세부 맥락은 세션 메모와 기존 이벤트 로그로 관리한다.

### 2026-05-19 로컬-first 유저 데이터 저장 흐름 점검

- 소셜 로그인 없이 `localStorage` 중심으로 같은 기기/같은 브라우저/같은 설치 앱의 데이터를 유지한다.
- 앱 시작 시 `fitech_user_name`이 있으면 Login을 건너뛰고 Home으로 자동 진입한다.
- 운동 기록은 `fitech_workout_sessions`, 세트별 히스토리는 `fitech_workout_history`, 루틴은 `fitech_saved_routines`에 저장된다.
- 로그아웃 시 운동 기록은 지우지 않고 `fitech_last_user_name`에 마지막 이름을 보존한다.
- 같은 이름으로 다시 들어오면 기존 기록을 유지한다. 다른 이름으로 들어오면 이전 사용자의 localStorage 데이터와 cloud sync status를 지워 같은 기기 사용자 전환 시 기록이 섞이지 않게 한다.
- Supabase가 설정된 경우 anonymous auth session도 사용자 전환 시 sign out 후 새 anonymous session을 만든다. Supabase 미설정/실패 시 앱은 local-only로 계속 동작한다.
- 한계: 브라우저 데이터 삭제, 앱 삭제/재설치, 다른 기기, 다른 origin(`localhost` vs GitHub Pages)에서는 localStorage가 이어지지 않는다. 이 경우 계정 기반 로그인/복구가 없으면 기록 복원이 불가하다.

### 2026-05-19 Quick Review 얼굴 UI 라인 아이콘화

- 모바일 기본 이모티콘처럼 보이던 얼굴 표시를 제거했다.
- Quick Review는 기존 1~5 rating 데이터는 유지하면서 `lucide-react` 라인 얼굴 아이콘으로 표시한다.
- 기록 화면의 face review 표시도 같은 라인 아이콘 컴포넌트를 재사용한다.

### 2026-05-19 운동 분석/추천 MVP 개선

- 이전 운동 기록을 바로 증량하지 않도록 수정했다.
  - 같은 운동은 마지막 완료 working set을 그대로 carry-forward한다.
  - 증량은 하루 단위 자동 가정이 아니라, 추후 반복 성공/리뷰/완료율 기반 decision으로만 다뤄야 한다.
- 다른 운동 추천 중량은 같은 muscle group의 최근 strength base를 movement type factor로 보정한다.
  - 예: Barbell Bench Press 기록이 있어도 Dumbbell Fly가 bench 중량을 그대로 복사하지 않는다.
  - isolation/raise/fly/curl/cable/machine/dumbbell/compound 계열별 factor를 적용한다.
- `trainingContext`는 최근 14일 기준으로 completed sets, total volume, days since trained, completion rate, face review를 묶어 `maintain/reduce/deload` decision을 만든다.
- `WorkoutAnalytics`에 insight MVP를 추가했다.
  - Completion Rate 기반 코칭 문구
  - 최근 comparable session 대비 Total Work trend
  - face review 기반 recovery 메시지
  - 첫 운동을 PR로 세지 않는 New Records 처리
- UI 문구를 유저 친화적으로 조정했다.
  - `Volume Score` → `Total Work`
  - `Adherence` → `Completion Rate`
  - `PR Signals` → `New Records`
- `WorkoutComplete`에 “Today's Takeaways” insight 카드를 추가했다.
- `WorkoutHistory` 세션 상세에 insight 요약을 추가했다.
- `PlanPreview`는 “Why this recommendation?” 카드에서 보수적 carry-forward와 피로/리뷰 기반 조정 이유를 보여준다.

검증:

- [x] `npm run format`
- [x] `npm run lint`
- [x] `npm run format:check`
- [x] `npm test` — 5 files / 41 tests pass
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm audit --audit-level=critical` — 0 critical, high/moderate dependency advisories remain
- [x] dev server smoke: `http://127.0.0.1:5173/` HTTP 200

### 2026-05-19 강도별 운동 선택 / Progress Report 구현

- local planner도 강도에 따라 운동 종류를 다르게 고른다.
  - `Very Light` / `Light`: machine, cable, isolation, bodyweight처럼 컨트롤 쉬운 운동을 우선한다.
  - `Normal`: 기존 library 순서 기반의 균형 선택을 유지한다.
  - `Hard` / `Very Hard`: 피로 신호가 낮을 때 compound / dumbbell 중심으로 우선한다.
  - 단, 최근 리뷰/완료율/피로도에서 `reduce`/`deload` 신호가 있으면 강도를 높여도 recovery-friendly 선택으로 보호한다.
- Home의 `Your Progress` 카드를 버튼화해서 `Progress Report` 화면으로 연결했다.
- `Progress Report`는 지금까지의 workout session 데이터를 기반으로 아래를 분석한다.
  - 총 세션 / training days / current streak
  - 전체 Completion Rate
  - completed set 기반 Total Work
  - 최근 7일 vs 이전 7일 Weekly Work Trend
  - Muscle Group Coverage 및 부위별 수행량 비중
  - Top Records
  - Coach Notes: 완료율, 주간 수행량 변화, high fatigue group, 비어 있는 muscle group 기반 제안
- `normalizeMuscleGroups`가 `Back`, `Lower Body` 같은 display-case label도 올바른 canonical muscle group으로 처리하도록 보강했다.

검증:

- [x] `npm run lint`
- [x] `npm run format:check`
- [x] `npm test` — 6 files / 48 tests pass
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm audit --audit-level=critical` — 0 critical, 기존 high/moderate dependency advisories remain
- [x] dev server smoke: `http://127.0.0.1:5173/` HTTP 200

### 2026-05-19 초보자용 운동 가이드 / 그래프형 운동 로그 개선

- 운동 계획을 받았을 때 운동명만 보이는 문제를 해결하기 위해 `ExerciseGuide` 메타데이터와 SVG 라인 일러스트 컴포넌트를 추가했다.
  - 추가 파일: `apps/web/src/app/services/exerciseGuide.ts`
  - 추가 파일: `apps/web/src/app/components/ExerciseGuideIllustration.tsx`
  - 추가 파일: `apps/web/src/app/components/ExerciseGuideSheet.tsx`
- `PlanPreview`의 각 운동 카드에 작은 운동 자세 썸네일과 `Form guide` 버튼을 추가했다.
  - 탭하면 레퍼런스처럼 하단 bottom sheet가 뜨고 운동 그림, 장비, 타입, 주요 자극 부위, 단계별 설명, safety cue를 확인할 수 있다.
  - 실제 외부 이미지를 복사하지 않고, 앱 내 SVG 라인 일러스트를 직접 생성해 copyright / asset dependency 리스크를 줄였다.
- `WorkoutSession`에서도 현재 운동의 form guide를 열 수 있게 했다.
  - 이어폰 중심 플로우 전에 현재 운동 자세를 빠르게 확인할 수 있다.
- `ProgressReport`를 그래프 중심 분석 화면으로 확장했다.
  - 최근 7일 daily work bar chart
  - 운동별 e1RM line chart와 top weight / max work 요약
  - 최근 6주 workout progress bubble grid
  - muscle coverage area chart
- `WorkoutHistory`의 세션 상세에 운동별 work bar를 추가해 한 세션 안에서 어떤 운동이 가장 큰 부하를 차지했는지 볼 수 있게 했다.
- 데이터 정확도 보강:
  - 세션 완료 직후 `buildSessionAnalytics` 결과를 local session에 저장한 뒤 Supabase로 sync한다.
  - 리뷰 저장 후에도 review가 반영된 analytics를 다시 계산해 local/Supabase에 반영한다.
  - Supabase fallback analytics 계산 시에도 이전 세션 비교가 빠지지 않도록 `buildSessionAnalytics(session)` 기본 경로를 사용한다.

검증:

- [x] `npm run format:check`
- [x] `npm run lint`
- [x] `npm test` — 7 files / 50 tests pass
- [x] `npm run typecheck`
- [x] `npm run build` — production build success, 기존 Vite chunk size warning만 남음
- [x] `npm audit --audit-level=critical` — 0 critical, 기존 moderate/high dependency advisories는 별도 upgrade 필요
- [x] dev server smoke: `http://127.0.0.1:5174/` HTTP 200

다음 작업 후보:

- 운동별 guide를 Supabase/remote exercise catalog로 분리해 운영 중 수정 가능하게 만들기.
- `exerciseGuide`에 GIF/video asset URL 필드를 추가하되, 실제 배포 전에는 라이선스가 명확한 자체 제작 asset만 사용하기.
- AI planner의 hard equipment eligibility와 exercise guide equipment field를 연결해, 추천/가이드/DB가 같은 장비 taxonomy를 쓰게 만들기.
- Progress Report에서 기간 필터(7일/30일/90일)와 운동별 상세 drill-down 화면 추가하기.

### 2026-05-19 운동별 생성 이미지 적용 / 완료 화면 문구 경량화

- 운동별 자세 이미지는 더 이상 SVG 라인 일러스트를 사용하지 않는다.
- `$imagegen`으로 7개 sprite sheet를 생성하고, 운동 라이브러리의 70개 운동별 PNG asset으로 crop해 `apps/web/public/exercise-guides/`에 저장했다.
  - 앱에서 사용하는 개별 asset: `apps/web/public/exercise-guides/{exercise-slug}.png`
- `exerciseGuide.imageSrc`를 추가해서 `PlanPreview`, `WorkoutSession`, `ExerciseGuideSheet`가 실제 생성 PNG를 렌더링하도록 변경했다.
- 기존 `ExerciseGuideIllustration.tsx` SVG 구현은 제거했다.
- 운동 완료 화면의 `Today's Takeaways` 섹션을 제거했다.
  - 사용자가 운동 직후 긴 분석 문구로 피로를 더 느끼지 않게 한다.
  - 특히 `Review says this felt hard` 같은 review 설명형 insight는 생성하지 않는다.
  - review/완료율/피로도 신호는 계속 내부 analytics와 다음 추천 pipeline에 반영하되, 완료 직후 사용자에게 장황하게 보여주지 않는다.

검증:

- [x] 70개 운동별 PNG asset 생성 확인
- [x] `ExerciseGuideIllustration` / `Today's Takeaways` / `Review says this felt hard` 코드 참조 제거 확인
- [x] `npm run format:check`
- [x] `npm test` — 7 files / 50 tests pass
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build` — production build success, 기존 chunk size warning만 남음
