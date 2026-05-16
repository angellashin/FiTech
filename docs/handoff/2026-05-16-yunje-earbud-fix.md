# FiTech Session Handoff — 2026-05-16 (이윤제)

작업자: 이윤제 / 브랜치: `yunje` (기반: `sangjun`)

## TL;DR

sangjun의 이어폰 기능이 APK에서 전혀 동작하지 않던 문제를 원인부터 끝까지 다 잡았다. 실기기에서 싱글·더블·트리플 탭 전부 검증 완료.

버그가 하나가 아니었고 층층이 쌓여 있었음:
1. Capacitor JS 브리지를 존재하지 않는 글로벌로 참조
2. Capacitor Android 프로젝트에 Kotlin 컴파일러가 없어서 .kt 파일이 통째로 무시됨
3. Android가 오디오 재생 중인 앱에만 미디어 버튼 라우팅
4. BT 이어폰 AVRCP 커맨드 매핑 누락

---

## 버그 1 — Capacitor JS 브리지 오류

**원인**: sangjun 코드의 `getMediaButtonPlugin()`이 `window.CapacitorGlobal`를 참조. Capacitor 6에서 이 글로벌은 존재하지 않음 → 항상 `null` 반환 → listener 미등록.

**수정**: `apps/web/src/app/lib/mediaButton.ts` 신규 생성.
```ts
import { registerPlugin } from '@capacitor/core';
export const MediaButton = registerPlugin<MediaButtonPlugin>('MediaButton');
```

---

## 버그 2 — Kotlin 미컴파일 → APK 크래시

**원인**: `cap add android`가 생성하는 Android 프로젝트에 Kotlin Gradle 플러그인이 설정되어 있지 않음. `.kt` 파일이 빌드에서 전부 무시됨.

초기에는 생성된 `MainActivity.java`(registerPlugin 없음)가 컴파일되어 앱은 열렸지만 플러그인 미등록 상태였음. `MainActivity.java`를 삭제하자 `MainActivity` 클래스 자체가 APK에서 사라져 즉시 크래시 발생.

**수정**: `android-src/MainActivity.kt` + `android-src/MediaButtonPlugin.kt` → **Java로 전환**.
- `android-src/MainActivity.java`
- `android-src/MediaButtonPlugin.java`

`build-apk.yml`의 copy step도 `.java` 파일을 복사하도록 수정.

---

## 버그 3 — raw events = 0 (미디어 버튼 라우팅 안 됨)

**원인**: Android는 오디오를 실제로 재생 중인 앱에만 이어폰 미디어 버튼 이벤트를 라우팅함. `MediaSession.isActive = true` + `STATE_PLAYING`만으로는 부족.

**수정**: `setupMediaSession()` 안에서 1초짜리 무음 PCM 버퍼를 `AudioTrack`으로 루프 재생.
```java
silentTrack = new AudioTrack(AudioManager.STREAM_MUSIC, ...);
silentTrack.setLoopPoints(0, numSamples, -1);
silentTrack.play();
```
완전히 무음(short[0]) 이라 사용자에게 들리지 않음.

---

## 버그 4 — 더블·트리플 탭 미인식

**원인**: Bluetooth 이어폰은 버튼 카운팅을 이어폰 펌웨어 자체에서 처리하고, Android에는 이미 해석된 AVRCP 커맨드를 전송함.
- 1탭 → `onPlay` / `onPause`
- 2탭 → `onSkipToNext`
- 3탭 → `onSkipToPrevious`

기존 코드는 `PLAY_PAUSE` 이벤트를 400ms 안에 여러 번 카운팅하는 방식이었는데, BT 이어폰은 `PLAY_PAUSE`를 항상 1번만 보내므로 더블·트리플이 영원히 인식되지 않았음.

**수정**: AVRCP 커맨드를 직접 매핑.
```java
@Override public void onSkipToNext()     { fireTap("doubleTap"); }
@Override public void onSkipToPrevious() { fireTap("tripleTap"); }
```
`PlaybackState`에 `ACTION_SKIP_TO_NEXT | ACTION_SKIP_TO_PREVIOUS` 추가.
유선 이어폰(`HEADSETHOOK`)은 기존 카운팅 로직 유지 (600ms 윈도우).

---

## 신규/변경 파일 목록

```
A apps/web/src/app/lib/mediaButton.ts              (Capacitor 플러그인 등록)
A apps/web/src/app/hooks/useEarbudControls.ts       (통합 훅: Capacitor + MediaSession 브라우저)
M apps/web/src/app/components/WorkoutSession.tsx    (진단 오버레이, 탭 피드백 UI)
A apps/web/android-src/MainActivity.java            (registerPlugin + dispatchKeyEvent)
D apps/web/android-src/MainActivity.kt              (Java 전환으로 삭제)
A apps/web/android-src/MediaButtonPlugin.java       (MediaSession + AudioTrack + AVRCP 매핑)
D apps/web/android-src/MediaButtonPlugin.kt         (Java 전환으로 삭제)
M .github/workflows/build-apk.yml                  (.java 파일 복사, yunje 브랜치 추가)
A docs/handoff/2026-05-16-yunje-earbud-fix.md       (이 문서)
M agent.md
```

---

## 검증

- `npm run build` ✅
- 실기기 이어폰 싱글 탭 ✅ / 더블 탭 ✅ / 트리플 탭 ✅
- 진단 오버레이: platform=capacitor, active=true, rawEventCount 증가 ✅
- pre-existing lint 에러 2개, TS 에러 8개 — sangjun 상속분, 본 작업 무관

---

## 넘긴 빚 (sangjun에서 상속, 내가 만든 거 아님)

- TypeScript 에러 8개: `MuscleGroup → MuscleGroup[]` 마이그레이션 미완성
  - `Home.tsx(49)`, `WorkoutSession.tsx(118)`, `workoutHistory.test.ts(51)`, `workoutPlanner.test.ts ×5`
  - 해결 방향: `WorkoutSessionRecord.muscleGroup`을 `MuscleGroup[]`로 통일 + localStorage migration
- Lint 에러 2개: `PlanPreview.tsx:215`, `WorkoutSession.tsx:58`

---

## 운영 메모

- 노션 양식: 작업자=이윤제 / 작업일=2026-05-16 / 작업시간≈5시간 / 컨펌은 김상준·원준서·신민서 중 2명
- main 브랜치는 이윤제 허락 없이 건드리지 말 것
