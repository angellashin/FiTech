# FiTech Development Progress — 4th Team Handoff

배포 URL: https://angellashin.github.io/FiTech/  
작업 브랜치: `main` 직접 push  
작업 범위: Saved Routines 편집 기능 (운동 추가/삭제)

---

## 주요 변화 (Major Features)

### 1. Saved Routines 편집 기능

Home 화면 "My Routines" 섹션의 각 루틴 카드에 **Edit(✏️) 버튼** 추가.

#### 편집 바텀 시트

✏️ 버튼 클릭 시 바텀 시트 슬라이드 업. 두 가지 화면으로 구성:

**EDIT MODE (기본):**

| 영역 | 내용 |
|------|------|
| Routine Name | 이름 인풋 (최대 40자, 빈칸 저장 시 기존 이름 유지) |
| Exercises (N) | 현재 운동 목록, 각 항목에 × 버튼으로 즉시 제거 |
| + Add Exercise | 클릭 시 ADD MODE로 전환 |
| Cancel | 변경사항 버리고 시트 닫기 |
| Save Changes | 변경사항 저장 후 시트 닫기 (운동이 0개면 비활성화) |
| X 버튼 (헤더) | Cancel과 동일, 변경사항 취소 |

**ADD MODE:**

| 영역 | 내용 |
|------|------|
| ← Back | EDIT MODE로 복귀 (추가된 운동은 유지) |
| 근육 그룹 필터 pill | All / chest / back / shoulder / triceps / biceps / core / lower body (7종) |
| 운동 목록 | 필터에 맞는 운동 전체 표시, + 버튼으로 추가 |
| 이미 추가된 운동 | + 버튼 비활성화 (중복 추가 방지) |

#### 저장 동작

- `updateRoutine(id, { name, exercises })` — `workoutHistory.ts`에 이미 구현돼 있던 함수 활용
- 저장 즉시 `getSavedRoutines()` 재호출로 홈 카드 운동 수 실시간 반영
- localStorage `fitech_saved_routines` 키에 저장 (기존 방식 그대로)

---

## 변경된 파일 목록

### 수정된 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/components/Home.tsx` | Edit 버튼, 편집 바텀 시트 전체, state/handler 추가 |

### 변경 없음

| 파일 | 이유 |
|------|------|
| `src/app/utils/workoutHistory.ts` | `updateRoutine()` 이미 구현됨 (junseo 작업) |
| `src/app/services/workoutPlanner.ts` | `exerciseLibrary` 그대로 import해서 사용 |

---

## 현재 앱 기능 전체 현황

### ✅ 완료된 기능

| 기능 | 작업자 |
|------|--------|
| 이어폰 탭 (1/2/3탭) — 브라우저 MediaSession + Android native | 이윤제(5/16) |
| Android APK 자동 빌드 (GitHub Actions) | 이윤제(5/16) |
| TTS — Web Speech API + Android FiTechTTS Java 플러그인 | 준서(5/20) |
| Settings 토글 (Audio / Rest Notifications / Dark Mode) — 영구 저장 | 준서(5/20) |
| 프로필 편집 (이름/목표/아바타 색상) | 준서(5/20) |
| About FiTech / Help & Support FAQ | 준서(5/20) |
| Log Out (확인 다이얼로그 포함) | 준서(5/20) |
| Saved Routines 저장/불러오기 | 준서(5/20) |
| **Saved Routines 편집 (운동 추가/삭제)** | **이윤제(5/21)** |
| **운동 캘린더 뷰 (WorkoutHistory 화면)** | **이윤제(5/21)** |
| My Gym Equipment (기구 프로필) | 준서(5/20) |
| LLM 운동 계획 생성 (Gemini 2.5 Flash) | 준서(5/20) |
| Personal Records 전체 보기 (상위 3개 / View all 토글) | 준서(5/20) |
| 운동 기록 개별 삭제 (WorkoutHistory 화면) | 준서(5/20) |
| 운동 기록 전체 삭제 (Profile → Clear Workout History) | 준서(5/20) |

### ❌ 미구현 / 향후 과제

| 기능 | 메모 |
|------|------|
| **Dark Mode 고도화** | 현재 CSS `filter: invert(1) hue-rotate(180deg)` 방식. Tailwind `dark:` 클래스로 전환하면 색상 제어 정밀도 향상 |
| **프로필 사진 업로드** | 현재 이니셜+색상만 지원. Supabase Storage 또는 base64 localStorage 활용 가능 |
| **Saved Routines 순서 변경** | 드래그 앤 드롭 — `@dnd-kit` 이미 설치돼 있음 (`PlanPreview.tsx`에서 활용 예시 참고) |
| **GIF 4개 잔여** | 64/70 + webp 2개(pec-deck-machine, landmine-press) = 66/70. 누락: Dumbbell Shoulder Press, Machine Shoulder Press, JM Press, Single Arm Pushdown |

---

## 로컬 개발 환경 세팅

```bash
git clone https://github.com/angellashin/FiTech.git
cd FiTech/apps/web
cp .env.example .env.local   # Gemini 키는 팀원에게 요청
npm install
npm run dev
# → http://localhost:5173/FiTech/
```

**테스트용 루틴 주입 (브라우저 콘솔):**

```js
localStorage.setItem('fitech_user_name', '테스트');
const r = { id: 'r1', name: 'Test Routine', savedAt: new Date().toISOString(),
  exercises: [
    { id: 'e1', name: 'Barbell Bench Press', sets: 4, reps: 8, restTime: 120, muscleGroup: 'Chest',
      setDetails: [{weight:60,reps:8,completed:false}] }
  ]};
localStorage.setItem('fitech_saved_routines', JSON.stringify([r]));
location.reload();
```

---

## 기술 스택 (변경 없음)

- React 18 + TypeScript + Vite + Tailwind CSS
- Supabase (optional — 없으면 localStorage 전용 모드 자동 전환)
- Gemini 2.5 Flash API (운동 계획 LLM)
- localStorage — 모든 사용자 데이터 로컬 저장
- Capacitor 6 (Android APK 빌드 브릿지)
- GitHub Actions `build-apk.yml` (APK 자동 빌드 — main push 시)
- GitHub Pages (웹 자동 배포 — main push 시 → https://angellashin.github.io/FiTech/)
