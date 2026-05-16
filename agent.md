# agent.md — Claude-to-Claude relay log

다음 작업자의 Claude가 먼저 읽고 컨텍스트 잡으라고 두는 파일. 매 작업자가 끝에 자기 섹션을 append.

---

## 2026-05-16 — 이윤제 (branch: `yunje`, 기반: `sangjun`)

**한 줄 요약**: sangjun의 이어폰 기능이 APK에서 작동하지 않던 핵심 버그(잘못된 Capacitor JS 브리지)를 잡고, 디바이스에서 직접 디버깅할 수 있는 진단 오버레이를 추가했다.

**상세 핸드오프**: [`docs/handoff/2026-05-16-yunje-earbud-fix.md`](docs/handoff/2026-05-16-yunje-earbud-fix.md) — 진단 근거, 변경 내역, 검증 결과, 넘긴 빚, 다음 액션까지 다 있음.

**다음 사람 (원준서)이 가장 먼저 할 일**:
1. yunje 브랜치 빌드된 APK로 실기기에서 이어폰 검증. 운동 세션 헤더 우측 `ⓘ` 아이콘 → 진단 오버레이 보면 어디서 끊겼는지 즉시 보임.
2. 검증 통과면 백로그 다음 항목 (workout setup UI 개편 / Exercise 리스트 / plan 프리뷰 UX) 중 하나 진행.
3. **하지 말 것**: main 직접 푸시, sangjun에서 상속된 type/lint 에러를 임시방편으로 덮어쓰기 (제대로 멀티-머슬-그룹 마이그레이션해야 함).

**현재 상태**:
- yunje 브랜치 GitHub push는 collaborator 권한 받는 중이라 대기. 권한 부여되면 즉시 push.
- `npm run build` ✅, `npm run lint`/`typecheck`는 pre-existing 에러 있음(상속분, 본 PR 무관).
