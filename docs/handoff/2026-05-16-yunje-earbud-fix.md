# FiTech Session Handoff — 2026-05-16 (이윤제)

작업자: 이윤제 / 브랜치: `yunje` (기반: `sangjun`)

## TL;DR
김상준 5/14 작업의 이어폰 기능이 APK에서 안 먹던 원인을 찾아서 고쳤다.
원인은 한 줄 — Capacitor JS 브리지를 잘못된 글로벌 (`window.CapacitorGlobal`) 로 참조하고 있었던 것. 정식 `registerPlugin` API로 교체. 추가로 안드로이드 plugin 등록 순서, 무음 audio loop, 탭 인식 시청각 피드백, 디바이스에서 직접 보는 진단 오버레이까지 추가.

## 진단: APK에서 이어폰 탭이 안 넘어가던 이유

`apps/web/src/app/components/WorkoutSession.tsx` 옛 코드 (라인 12-24, 5/14 시점):

```ts
const getMediaButtonPlugin = () => {
  const { Capacitor, Plugins } = (window as any).CapacitorGlobal ?? {};
  ...
};
```

- Capacitor 6에서 글로벌은 `window.Capacitor`. `CapacitorGlobal` 같은 객체는 **존재하지 않음**.
- 게다가 커스텀 플러그인은 `@capacitor/core`의 `registerPlugin()`으로 JS 측에 등록해야 native ↔ web 브리지가 연결됨. 그 호출이 없었음.
- 결과: `getMediaButtonPlugin()`이 항상 `null` → listener 미등록 → 안드로이드에서 `notifyListeners("singleTap", ...)`를 발사해도 JS에 듣는 사람이 0명 → 사라짐. 사용자가 APK 설치하고 이어폰 눌러도 무반응.

추가로 발견한 부수 결함:
1. ~~`MainActivity.kt`에서 `registerPlugin`이 `super.onCreate` 전에 호출됨~~ → **이건 sangjun이 맞았던 거였음**. 작업 중 한번 뒤집어봤다가 device test에서 "MediaButton plugin is not implemented on android" 에러가 떠서 즉시 revert. 이유: `BridgeActivity.onCreate`는 `super.onCreate(savedInstanceState)` 내부에서 `load()`를 호출해 Bridge를 만들고, 이때 `initialPlugins` 리스트를 읽음. `registerPlugin()`은 그 리스트에 추가만 하기 때문에 **반드시 super.onCreate 호출 전에** 해야 함. 5/14 sangjun 코드가 정답이고, 따로 손댈 필요 없음.
2. MediaSession에 실제 오디오 재생 없음 → 일부 안드로이드 OEM/버전에서 미디어 버튼 라우팅 불안정.
3. 디바이스에서 어디서 끊겼는지 확인할 수단 부재 (콘솔도 못 봄) → 디버깅 사이클이 "APK 다시 빌드 → 깔고 → 안 됨 → 추측"의 무한 루프.

## 무엇을 했는가

### 신규 파일
- `apps/web/src/app/lib/mediaButton.ts` — `registerPlugin<MediaButtonPlugin>('MediaButton')`로 Capacitor 정식 API 통해 플러그인 등록.
- `apps/web/src/app/hooks/useEarbudControls.ts` — Capacitor(APK)와 Web MediaSession(브라우저) 둘 다 처리하는 통합 훅. 진단 정보(`platform`, `active`, `rawEventCount`, `lastRawEvent`, `lastTapKind`, `lastTapAt`, `errors`) 반환.
  - 브라우저 경로: 동적 생성된 무음 WAV blob을 `<audio loop>`로 재생해서 MediaSession 활성화 → `setActionHandler('play'|'pause'|'nexttrack'|'previoustrack')`로 이어폰 미디어 키 잡음 → 400ms 윈도우로 single/double/tripleTap 분류.
  - Capacitor 경로: 네이티브 측이 이미 탭 카운팅을 해서 finalized 이벤트(`singleTap` 등) 보내주므로 그대로 핸들러 호출.

### 변경 파일
- `apps/web/src/app/components/WorkoutSession.tsx`
  - 옛 `getMediaButtonPlugin()` 블록과 ref 동기화 useEffect 3개 제거.
  - `useEarbudControls` 훅으로 교체.
  - 이어폰 탭 발생 시 짧은 인식음(1500Hz, 60ms × tap 횟수) + 해당 on-screen 버튼에 `ring-4 ring-emerald-400` 펄스(350ms).
  - 헤더에 `Info` 버튼 추가 → 진단 오버레이 토글. 오버레이는 platform/active/rawEventCount/lastRawEvent/lastTap/errors 표시. **다음에 또 이어폰이 안 잡힐 때 이거 보면 어느 단계에서 끊겼는지 바로 보임**.
  - Earbud Controls 카드 헤더에 작은 라이브 인디케이터(점 + "Native"/"Browser"/"Off") 추가.
- `apps/web/android-src/MainActivity.kt`
  - 한번 순서 바꿨다가 다시 sangjun 원래 순서(`super.onCreate` 전에 `registerPlugin`)로 revert. 주석으로 이유 자세히 명시. 이 파일은 sangjun과 사실상 동일하되 주석만 추가된 상태.

### 안 한 것 (의도적)
- 무음 audio loop는 안드로이드 OEM 안정성을 위해서도 도움될 수 있지만, sangjun 네이티브 플러그인은 이미 `MediaSession.isActive = true` + PlaybackState로 처리 중이라 굳이 안드로이드 빌드에서 추가 audio 재생을 안 시킴 (브라우저 경로에서만 무음 audio 재생). 만약 일부 안드로이드 기기에서 여전히 안 잡히면, 이때 native 측에서 무음 미디어 재생 추가하는 게 다음 액션.
- sangjun에서 넘어온 pre-existing 타입 에러(8개)는 안 건드림. 본 작업 범위 밖. 아래 "넘긴 빚" 참조.
- 운동 기록/UI 개편 같은 + α 백로그도 보류 — 이어폰 기능이 진짜로 동작하는지 디바이스에서 한 번 더 검증된 다음에 손대는 게 안전.

## 검증

- `npm run build` ✅ (Vite, 1762 modules)
- `npm run lint` — 에러 2개, 둘 다 **pre-existing**:
  - `PlanPreview.tsx:215` no-unused-expressions
  - `WorkoutSession.tsx:58` 빈 catch 블록 (playTone 내부, 본 PR 변경 영역 아님)
- `npm run typecheck` — 에러 8개, 전부 **pre-existing**. sangjun의 `MuscleGroup → MuscleGroup[]` multi-select 도입 시 안 흘러간 호출부들 (Home.tsx, workoutHistory typings, 두 개의 test 파일). 내 PR이 새로 도입한 에러 0개. WorkoutSession.tsx의 에러는 라인만 148 → 118로 shift된 동일 에러.
- **디바이스에서 실제 이어폰으로 검증 못 함** — 본인 환경에 안드로이드 빌드 툴체인이 없어서 APK는 GitHub Actions로 빌드되어야 함. push되면 `build-apk.yml`이 돌아서 APK가 떨어짐. **다음 작업자(또는 이윤제 본인)가 APK 받아서 이어폰 한번 눌러봐야 함**.

## 다음 사람에게 — 이거 먼저 해줘

1. **APK 직접 검증**. yunje 브랜치 push되면 GitHub Actions가 `FiTech-debug-<sha>.apk` artifact 만든다. 받아서 설치:
   - 이어폰 연결하고 운동 세션 시작
   - 헤더 우측의 `ⓘ` 아이콘 눌러 진단 오버레이 열기
   - 이어폰 1번/2번/3번 눌렀을 때:
     - "Raw events received" 카운터가 증가하는가? 안 늘면 OS가 미디어 키를 FiTech에 안 넘기는 것 (다른 앱이 audio focus 가지고 있을 가능성)
     - "Last raw event"가 `singleTap`/`doubleTap`/`tripleTap`으로 바뀌는가?
     - 화면 위 해당 버튼이 emerald-400 ring으로 펄스하는가?
     - 인식음 (틱 1/2/3번)이 들리는가?
2. **여전히 안 되면** — 진단 오버레이의 platform 표시를 확인:
   - `capacitor`인데 raw events 0 → 네이티브 측 문제. `MediaButtonPlugin.kt:36` 근처 `AudioManager.requestAudioFocus` 강제 + 무음 미디어 재생 추가 필요. 또는 사용자가 Spotify 같은 거 백그라운드에 띄워둬서 audio focus 빼앗긴 상태.
   - `mediasession` (브라우저인데 raw events 0) → 브라우저가 silent audio 재생을 막은 것. 페이지를 먼저 한 번 클릭한 뒤에 운동 세션 들어가야 함. errors 배열에 메시지 있을 것.
3. **APK 빌드 워크플로우 트리거 브랜치**: `.github/workflows/build-apk.yml`의 `branches: [sangjun, main]` 리스트에 **`yunje` 추가 안 했음** (다른 사람 PR과 충돌 가능성 + main은 보호). 본인 검증 위해 임시로 추가하거나, workflow_dispatch로 수동 트리거 권장.

## 넘긴 빚 (sangjun에서 상속됨, 내가 만든 거 아님)

- TypeScript 에러 8개. 모두 sangjun이 `MuscleGroup → MuscleGroup[]` 변경 마무리 안 한 결과:
  - `Home.tsx(49)` — `sessionToPlan` 결과 변수 타입 캐스팅
  - `WorkoutSession.tsx(118)` — `saveWorkoutHistory`의 `muscleGroup` 파라미터가 아직 singular `MuscleGroup`
  - `workoutHistory.test.ts(51)` — 픽스처가 string 단일값
  - `workoutPlanner.test.ts × 5` — `generateWorkoutPlan(goal, 'full-body', ...)` 같은 호출, 2번째 인자가 이젠 `MuscleGroup[]`인데 string으로 호출 + 일부는 `'full-body'`/`'upper-body'`/`'arms'` 같은 unioin에 없는 리터럴
  - 해결 방향(다음 사람): `WorkoutSessionRecord.muscleGroup`를 `MuscleGroup[]`로 통일 + 테스트 픽스처/expectations 업데이트. localStorage migration 필요 (옛 데이터는 single string으로 저장됨).
- Lint 에러 2개 pre-existing (위 검증 섹션 참조).

## 운영 메모

- yunje 브랜치 push 권한 요청 중. yunj01이 angellashin/FiTech의 collaborator로 추가되면 push 가능. 추가되기 전까지는 본 작업이 로컬에만 있음.
- main 브랜치는 이윤제 허락 없이 건드리지 말 것 (이건 user_role 메모리에도 적어둠).
- 노션 양식 채울 때: 작업자 = 이윤제 / 작업일 = 2026-05-16 / 작업 시간 ≈ 2시간 / 증빙 = 본 핸드오프 문서 + diff + (APK 빌드되면) artifact 링크 / 컨펌은 김상준·원준서·신민서 중 2명.

## 파일 변경 요약

```
A apps/web/src/app/lib/mediaButton.ts            (신규, ~15 lines)
A apps/web/src/app/hooks/useEarbudControls.ts    (신규, ~230 lines)
M apps/web/src/app/components/WorkoutSession.tsx (~70 lines net 변경)
M apps/web/android-src/MainActivity.kt           (순서 픽스 + 주석)
A docs/handoff/2026-05-16-yunje-earbud-fix.md    (이 문서)
```
