# agent.md — Claude-to-Claude relay log

다음 작업자의 Claude가 먼저 읽고 컨텍스트 잡으라고 두는 파일. 매 작업자가 끝에 자기 섹션을 append.

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
