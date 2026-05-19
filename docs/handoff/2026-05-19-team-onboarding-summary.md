# FiTech Team Onboarding Memo — 2026-05-19

## 한 줄 요약

FiTech는 이번 작업으로 “운동 추천 → 초보자용 운동 자세 확인 → 이어폰 중심 운동 수행 → 리뷰/기록 저장 → 다음 추천/Progress 분석”까지 이어지는 운동 기록 경험 MVP가 완성되었습니다.

## 이번에 추가/개선된 기능

### 1. AI 운동 추천 파이프라인

- Gemini 기반 운동 추천을 추가했습니다.
- Gemini가 실패하거나 키가 없으면 local planner가 자동 fallback합니다.
- AI는 운동 선택/랭킹 중심으로 쓰고, 무게/세트/피로도 보정은 로컬 deterministic 로직이 담당합니다.
- 최근 운동 기록, 완료율, 세션 리뷰, 피로도, 강도 선택, 장비 점유 이벤트가 다음 추천에 반영됩니다.
- 같은 운동은 최근 working weight를 보수적으로 이어가고, 다른 운동은 같은 근육군의 strength base를 운동 타입별 factor로 보정합니다.

### 2. 운동 계획 UX 개선

- 운동 계획 화면에서 운동명만 보이던 문제를 개선했습니다.
- 각 운동 카드에 자세 이미지 썸네일과 `Form guide` 버튼을 추가했습니다.
- 운동을 누르면 하단 bottom sheet로 다음 정보를 확인할 수 있습니다.
  - 운동 이미지
  - 필요 장비
  - 운동 타입
  - 주요 자극 부위
  - 단계별 수행 방법
  - safety cue
  - 초보자 팁
- `$imagegen`으로 생성한 운동별 이미지를 WebP 70개로 압축해 `apps/web/public/exercise-guides/`에 저장해 사용합니다.

### 3. 이어폰 중심 운동 세션

- 운동 중 화면에서 현재 운동의 form guide를 바로 열 수 있습니다.
- 이어폰 탭 조작은 유지됩니다.
  - Single tap: 세트 완료 / 휴식 skip
  - Double tap: 운동 skip
  - Triple tap: 장비 점유 표시 후 운동 순서 뒤로 이동
- 장비 점유 이벤트는 다음 추천에서 회피 신호로 사용됩니다.

### 4. 운동 완료 / Quick Review

- 운동 완료 후 Quick Review는 세션 전체 5단계 라인 얼굴 리뷰만 받습니다.
- 운동별 개별 리뷰는 제거했습니다.
- `Today's Takeaways`처럼 운동 직후 피로감을 높일 수 있는 장황한 분석 문구는 제거했습니다.
- 리뷰 데이터는 사용자에게 장황하게 보여주지 않고 내부적으로 다음 추천에 반영됩니다.

### 5. 운동 기록 / Progress Report

- Home의 `Your Progress`에서 Progress Report 화면으로 진입할 수 있습니다.
- Progress Report에 그래프 기반 분석을 추가했습니다.
  - 최근 7일 daily work bar chart
  - 운동별 e1RM trend line chart
  - 최근 6주 workout progress bubble grid
  - muscle group coverage area chart
  - top records
  - coach notes
- Workout History 상세에는 세션별 운동 work bar를 추가했습니다.

### 6. 데이터 저장 / Supabase Sync

- 같은 기기/같은 사용자 이름이면 localStorage에 운동 기록이 유지됩니다.
- 다른 사용자 이름으로 로그인하면 기존 사용자 데이터가 섞이지 않도록 local 데이터가 정리됩니다.
- 세션 완료 직후 analytics를 계산해 local session에 저장하고 Supabase로 sync합니다.
- Quick Review 저장 후에도 analytics를 다시 계산해 review 반영 상태로 sync합니다.
- Supabase migration 추가:
  - `supabase/migrations/002_workout_session_experience_fields.sql`

### 7. CI/CD

- GitHub Actions CI가 lint, format check, test, typecheck, build, critical audit를 실행합니다.
- GitHub Pages deploy workflow가 main push 기준으로 web app을 배포합니다.
- Android debug APK build workflow도 유지됩니다.

## 주요 파일

- 추천 로직: `apps/web/src/app/services/workoutPlanner.ts`
- Gemini 추천 wrapper: `apps/web/src/app/services/llmWorkoutPlanner.ts`
- 피로/회복 context: `apps/web/src/app/services/trainingContext.ts`
- 운동 기록 저장: `apps/web/src/app/utils/workoutHistory.ts`
- 분석 로직: `apps/web/src/app/services/workoutAnalytics.ts`, `apps/web/src/app/services/progressReport.ts`
- 운동 계획 화면: `apps/web/src/app/components/PlanPreview.tsx`
- 운동 세션 화면: `apps/web/src/app/components/WorkoutSession.tsx`
- 완료/리뷰 화면: `apps/web/src/app/components/WorkoutComplete.tsx`
- 기록 화면: `apps/web/src/app/components/WorkoutHistory.tsx`
- Progress Report: `apps/web/src/app/components/ProgressReport.tsx`
- 운동 guide 메타데이터: `apps/web/src/app/services/exerciseGuide.ts`
- 운동 이미지 asset: `apps/web/public/exercise-guides/`

## 로컬 실행

```bash
cd apps/web
npm ci
npm run dev
```

로컬 기본 주소는 Vite가 출력하는 `http://127.0.0.1:5173/` 또는 사용 가능한 다음 포트입니다.

## 검증 명령

```bash
cd apps/web
npm run format:check
npm run lint
npm test
npm run typecheck
npm run build
npm audit --audit-level=critical
```

## 배포

- 배포 URL: `https://angellashin.github.io/FiTech/`
- GitHub Pages workflow: `.github/workflows/deploy-pages.yml`
- main branch push 후 GitHub Actions에서 자동 배포됩니다.
- GitHub Actions 확인: `https://github.com/angellashin/FiTech/actions`

## 남은 리스크

- `VITE_GEMINI_API_KEY`는 브라우저 번들에 노출될 수 있으므로 public/beta 배포 전에는 Supabase Edge Function 또는 backend AI gateway로 이전하는 것이 좋습니다.
- `npm audit --audit-level=critical`은 통과하지만, Vite/Capacitor 관련 moderate/high advisory는 별도 dependency upgrade가 필요합니다.
- Supabase migration은 실제 Supabase project DB에 적용되어야 cloud row가 새 JSONB 필드를 받을 수 있습니다.
- 운동별 이미지는 현재 생성형 asset 기반이므로, 장기적으로는 자체 제작/검수된 exercise catalog asset으로 교체하는 것이 좋습니다.

## 다음 구현 후보

1. AI 응답 contract 강화
   - schema validation
   - fallback reason / trace 저장
   - malformed response 테스트

2. 장비 hard filter
   - exercise guide의 equipment taxonomy와 planner 장비 필터 통합
   - 유저 gym profile 기준으로 불가능한 운동 추천 차단

3. AI gateway 이전
   - Gemini key를 client에서 제거
   - Supabase Edge Function 또는 backend route에서 모델 호출
   - timeout, retry, prompt versioning, minimal logging 추가

4. Progress Report 고도화
   - 7일 / 30일 / 90일 기간 필터
   - 운동별 상세 drill-down
   - 근육군별 recovery dashboard

5. Supabase cloud readback
   - localStorage뿐 아니라 cloud에서 과거 기록 복원
   - 기기 변경/재설치 대응

6. 운동 guide 고도화
   - GIF/video asset 필드 추가
   - 운동별 대체 동작 / 초보자 variation 제공
   - 자체 제작 asset 검수 플로우 추가
