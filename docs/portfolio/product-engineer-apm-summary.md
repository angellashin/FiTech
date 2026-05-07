# FiTech 포트폴리오 / 자소서 정리 — Product Engineer & APM 관점

_Last updated: 2026-05-08_

## 1. 프로젝트를 시작한 이유

FiTech는 단순히 “운동 기록 앱”을 하나 더 만드는 프로젝트가 아니었다. 출발점은 운동 앱의 기능 부족이 아니라, **운동 중 사용 맥락과 기존 앱 사용 방식의 충돌**이었다.

대부분의 운동 앱은 사용자가 세트를 끝낼 때마다 휴대폰을 열고, 화면을 보고, 버튼을 누르고, 숫자를 입력할 수 있다고 가정한다. 하지만 실제 헬스장에서는 이 가정이 자주 깨진다. 손에 땀이 나 있거나, 스트랩을 착용했거나, 운동 흐름을 유지해야 하는 상황에서는 휴대폰을 조작하는 행위 자체가 마찰이 된다. 초보자에게는 휴대폰을 확인하는 시간이 곧 집중을 잃는 시간이 되기도 한다.

그래서 이 프로젝트의 핵심 질문은 다음이었다.

> 사용자가 운동 중 화면을 거의 보지 않아도, 충분히 운동을 안내받고 기록할 수 있을까?

이 질문을 검증하기 위해 FiTech를 **screenless workout app PoC**로 정의했다. 완성형 피트니스 플랫폼을 처음부터 만들기보다, 가장 중요한 가정인 “운동 중 화면 의존도를 줄여도 사용 흐름이 성립하는가”를 먼저 확인하는 방향으로 범위를 좁혔다.

## 2. 내가 세운 제품 가설

FiTech의 제품 가설은 다음과 같다.

> 운동 중 시각적·수동적 인터랙션을 줄이면, 사용자는 운동 흐름을 유지하면서도 세트 기록, 휴식 안내, 운동 완료 피드백을 받을 수 있다.

이 가설을 검증하기 위해 MVP 범위를 다음처럼 정했다.

1. 사용자는 이름만 입력하고 빠르게 시작한다.
2. 목표, 부위, 시간을 선택하면 운동 플랜이 생성된다.
3. 운동 중에는 화면 조작을 최소화하고, 탭 기반 인터랙션을 시뮬레이션한다.
4. 세트 완료, 운동 스킵, 기구 사용 불가 같은 실제 헬스장 상황을 기록한다.
5. 운동 완료 후에는 기록과 통계를 확인할 수 있다.
6. 이후 데이터가 실제 백엔드에 저장될 수 있는지 검증한다.

이렇게 범위를 나눈 이유는, APM/Product Engineer 관점에서 중요한 것이 “많은 기능”이 아니라 **검증 가능한 제품 가설과 실행 순서**라고 판단했기 때문이다.

## 3. PoC를 어떻게 설계했는가

처음부터 로그인, 결제, AI 코칭, 웨어러블 연동까지 모두 만들면 프로젝트는 커지지만 검증은 흐려진다. 그래서 FiTech의 PoC는 네 단계로 나누어 진행했다.

### 1단계 — 사용 흐름 검증

가장 먼저 만든 것은 제품의 핵심 경험이었다.

- 모바일 중심 UI
- 운동 목표/부위/시간 선택
- 운동 플랜 생성
- 운동 전 플랜 수정
- 운동 중 탭 인터랙션
- 음성 안내
- 운동 완료 화면
- 프로필/기록 확인

이 단계에서 중요한 것은 “정말 화면을 덜 보는 운동 흐름이 가능한가”였다. 그래서 UI 자체보다도, 운동 중 사용자가 취할 수 있는 행동을 단순화하는 데 집중했다.

예를 들어 운동 세션에서는 다음과 같은 탭 동작을 정의했다.

- single tap: 세트 완료 또는 휴식 스킵
- double tap: 현재 운동 스킵
- triple tap: 기구 사용 불가 처리 후 운동 순서 조정

이 경험을 통해 배운 점은, product interaction을 설계할 때 “가능한 기능”보다 **사용자가 실제 상황에서 수행할 수 있는 행동 단위**를 먼저 정의해야 한다는 것이었다.

### 2단계 — 공유 가능한 제품으로 만들기

PoC가 로컬에서만 실행되면 검증 범위가 제한된다. 팀원이나 리뷰어가 직접 확인할 수 없고, 변경이 생겼을 때 어떤 상태가 정상인지도 불분명하다.

그래서 다음 단계로 GitHub repo를 정리하고, GitHub Pages 배포와 GitHub Actions CI/CD를 구축했다.

현재 CI 파이프라인은 다음을 자동으로 실행한다.

```txt
npm ci
→ npm run lint
→ npm run format:check
→ npm run test
→ npm run typecheck
→ npm run build
```

CD 파이프라인은 `main` 브랜치에 push되면 Vite 앱을 production build하고 GitHub Pages로 배포한다.

배포 URL:

```txt
https://angellashin.github.io/FiTech/
```

이 작업을 하면서 CI/CD를 단순한 개발 편의 기능이 아니라 **제품 신뢰도를 만드는 장치**로 이해하게 되었다. 특히 포트폴리오 프로젝트에서도 “내 컴퓨터에서는 됨”을 넘어서, 누구나 같은 URL에서 같은 제품을 확인할 수 있어야 제품 실험으로서 의미가 생긴다.

### 3단계 — 백엔드 가능성 검증

처음 MVP는 localStorage 기반으로 동작했다. 이 선택은 의도적이었다. 운동 중 네트워크 문제 때문에 기록이 사라지거나, 로그인 문제 때문에 운동 완료가 막히면 핵심 경험이 깨지기 때문이다.

하지만 Product Engineer 관점에서는 “나중에 실제 사용자 데이터로 확장 가능한가”도 검증해야 했다. 그래서 Supabase를 백엔드로 연결했다.

구현한 Supabase 구조는 다음과 같다.

- Anonymous Auth
- Postgres schema
- Row Level Security
- profiles table
- workout_sessions table
- session_exercises table
- session_sets table
- session_events table

여기서 중요한 판단은 **cloud-first가 아니라 local-first sync**를 선택한 것이다.

운동 완료 시 앱은 먼저 localStorage에 저장하고, 그 다음 Supabase sync를 백그라운드로 시도한다. 이렇게 한 이유는 제품의 핵심 순간이 “운동 완료”이기 때문이다. 백엔드 저장이 실패하더라도 사용자가 운동을 끝내는 경험은 막히면 안 된다.

이 과정에서 배운 점은, 백엔드 연동은 단순히 데이터를 저장하는 일이 아니라 **제품 경험의 실패 지점을 어디에 둘 것인가를 결정하는 일**이라는 것이다.

### 4단계 — 실제 동작 검증과 테스트 기반 추가

Supabase 코드를 추가하는 것만으로는 충분하지 않았다. 실제로 Auth, RLS, table insert가 동작하는지 확인해야 했다.

그래서 publishable key와 Anonymous Auth 경로를 사용해 live Supabase smoke test를 진행했다.

검증 결과:

```txt
Smoke session ID: smoke_1778183348281
profiles: 1 row
workout_sessions: 1 row
session_exercises: 1 row
session_sets: 1 row
session_events: 2 rows
```

이 검증을 통해 Supabase RLS가 적용된 상태에서도 anonymous user가 자신의 workout data를 저장하고 조회할 수 있음을 확인했다.

이후에는 Vitest를 추가해 핵심 로직을 테스트로 보호했다.

현재 테스트 범위:

- workout plan generation
- duration별 운동 개수
- goal별 reps/rest/set 조정
- workout history 저장
- completed set volume 계산
- progressive overload 추천
- Supabase sync 성공/실패/skip 처리

현재 테스트 상태:

```txt
3 test files
17 passing tests
```

이 단계에서 배운 점은, PoC에서도 테스트는 “나중에 하는 품질 작업”이 아니라 **다음 실험을 안전하게 하기 위한 기반 작업**이라는 것이다. 특히 Figma Make 기반으로 생성된 코드가 포함된 프로젝트에서는, 리팩토링 전에 core behavior를 먼저 테스트로 고정하는 것이 중요했다.

## 4. CI/CD를 구축하며 배운 점

CI/CD를 구축하면서 가장 크게 배운 것은, 배포 파이프라인이 단순히 코드를 자동으로 올리는 도구가 아니라는 점이다. Product Engineer/APM 관점에서 CI/CD는 다음 세 가지 역할을 한다.

첫째, **협업 비용을 줄인다.**  
팀원이 main에 변경을 올리거나 PR을 만들 때, lint, format, typecheck, test, build가 자동으로 실행되면 리뷰어는 기본적인 안정성보다 제품 판단에 더 집중할 수 있다.

둘째, **제품 상태를 객관화한다.**  
“잘 되는 것 같다”가 아니라 “CI가 통과했고, production build가 성공했고, 배포 URL에서 확인 가능하다”는 식으로 상태를 증명할 수 있다.

셋째, **포트폴리오의 신뢰도를 높인다.**  
정적인 화면 캡처나 디자인 설명이 아니라, 실제로 배포되고 검증되는 제품을 보여줄 수 있다. 이는 Product Engineer/APM 직무에서 중요한 실행력과 검증 습관을 보여준다.

이 과정에서 GitHub Repository Variables와 Environment Variables의 차이도 경험했다. Supabase publishable key는 Vite frontend build에 들어가는 public config이기 때문에 repository variable로 관리했고, `.env.local`은 커밋하지 않도록 유지했다. 반면 `service_role` key처럼 권한이 높은 값은 절대 frontend나 Pages build에 넣으면 안 된다는 점을 명확히 구분했다.

## 5. PoC를 하며 배운 점

FiTech를 진행하면서 가장 중요하게 배운 것은 PoC의 목적이다. PoC는 “작게 만든 완성품”이 아니라, **가장 위험한 가정을 가장 빠르게 검증하는 과정**이다.

이 프로젝트에서 위험한 가정은 크게 세 가지였다.

1. 화면을 덜 보는 운동 UX가 실제 flow로 구성될 수 있는가?
2. 로컬 기반 MVP를 나중에 백엔드와 연결할 수 있는가?
3. 팀원과 공유 가능한 수준의 개발/배포 체계를 만들 수 있는가?

각 가정에 대해 다음 방식으로 검증했다.

| 가정                               | 검증 방식                          | 결과                                       |
| ---------------------------------- | ---------------------------------- | ------------------------------------------ |
| Screenless workout flow가 가능한가 | React/Vite MVP 구현                | 로그인 → 운동 설정 → 세션 → 완료 flow 구현 |
| 백엔드 연결이 가능한가             | Supabase Auth/RLS/schema/sync 구현 | live smoke test 통과                       |
| 협업 가능한 제품인가               | GitHub Actions CI/CD 구축          | CI 및 Pages deploy 자동화                  |
| 앞으로 안전하게 개선 가능한가      | Vitest unit tests 추가             | 17개 테스트 CI 포함                        |

이 경험을 통해 PoC는 기능을 많이 만드는 것보다, **무엇을 검증했고 무엇이 아직 리스크인지 분명히 말할 수 있어야 한다**는 점을 배웠다.

## 6. 문제 해결 경험

프로젝트를 진행하면서 단순 구현 외에도 여러 실제 개발 환경 문제를 경험했다.

### Supabase key와 보안 경계 구분

처음에는 Supabase에 `anon public key`와 `publishable key`가 있어 어떤 값을 사용해야 하는지 확인이 필요했다. 이 과정에서 frontend에 들어가는 key는 public config이고, 보안은 key를 숨기는 것이 아니라 RLS 정책으로 보장해야 한다는 점을 정리했다.

### Anonymous Auth 설정 문제

Supabase table과 RLS가 있어도 Anonymous Sign-Ins가 꺼져 있으면 실제 sync가 동작하지 않는다. 그래서 문서에 Anonymous Sign-Ins 설정을 추가하고, 앱도 실패 시 local-only로 동작하도록 설계했다.

### GitHub Pages 환경변수 연결

로컬 `.env.local`만으로는 배포 앱이 Supabase에 연결되지 않는다. 따라서 GitHub Actions repository variables를 workflow에 연결했다. 이를 통해 배포 앱도 Supabase URL과 publishable key를 build time에 주입받도록 만들었다.

### 원격 main 변경과 rebase

작업 중 원격 main에 다른 커밋이 먼저 올라와 push가 거절된 상황도 있었다. 이때 무리하게 force push하지 않고, 원격 변경을 fetch한 뒤 rebase로 통합했다. 이후 README formatting issue를 정리하고 다시 검증/푸시했다. 이 경험은 협업 repo에서 main을 안전하게 유지하는 방식의 중요성을 보여준다.

## 7. Product Engineer 관점에서의 핵심 역량

이 프로젝트는 다음 역량을 보여줄 수 있다.

### 1. 문제 정의

단순히 “운동 앱을 만들었다”가 아니라, 운동 중 휴대폰 조작이라는 구체적인 friction을 정의했다.

### 2. MVP 스코프 조절

AI, 웨어러블, 소셜 기능을 먼저 넣지 않고, screenless workout flow를 검증하는 데 집중했다.

### 3. 기술을 제품 경험에 맞게 선택

운동 완료 경험이 막히지 않도록 local-first sync를 선택했다.

### 4. 배포와 검증까지 책임

GitHub Actions CI/CD와 GitHub Pages 배포를 통해 공유 가능한 제품 상태를 만들었다.

### 5. 데이터와 보안 고려

Supabase Auth, Postgres schema, RLS를 통해 user-owned workout data 구조를 설계했다.

### 6. 다음 실험을 위한 기반 구축

Vitest unit tests와 CI test step을 추가해 이후 리팩토링과 기능 추가의 안정성을 높였다.

## 8. APM 관점에서의 핵심 역량

APM 관점에서는 다음처럼 설명할 수 있다.

### 1. 사용자 문제에서 출발

기능 아이디어가 아니라 실제 사용 상황에서 발생하는 friction을 중심으로 문제를 정의했다.

### 2. 검증 가능한 가설로 변환

“좋은 운동 앱”이라는 넓은 목표를 “운동 중 화면 의존도를 줄여도 기록과 안내가 가능한가”라는 가설로 좁혔다.

### 3. 실행 순서를 설계

제품 흐름 → 배포 파이프라인 → 백엔드 검증 → 테스트 자동화 순서로 진행했다. 이는 불확실성이 큰 부분부터 검증하고, 이후 확장 가능성을 확보하는 방식이었다.

### 4. Trade-off를 인식

완전한 계정 시스템 대신 Anonymous Auth를 선택했고, cloud-first 대신 local-first를 선택했다. 이는 MVP 단계에서 사용자 마찰과 개발 복잡도를 줄이기 위한 의도적인 선택이었다.

### 5. 결과를 증거로 남김

CI 결과, 배포 URL, smoke test 결과, unit test 개수, 문서화된 roadmap을 통해 프로젝트 상태를 설명 가능하게 만들었다.

## 9. 자소서용 서술 예시

### 예시 1 — Product Engineer 지원용

FiTech 프로젝트에서는 운동 중 사용자가 휴대폰을 계속 조작해야 하는 문제에 주목했습니다. 저는 이 문제를 단순한 UI 개선이 아니라 사용 맥락과 제품 인터랙션의 충돌로 정의했고, 화면을 거의 보지 않아도 운동 안내와 기록이 가능한 screenless workout app PoC를 구현했습니다. React/Vite 기반의 모바일 웹앱으로 운동 설정, 플랜 생성, 탭 기반 세션 제어, 음성 안내, 운동 완료 기록 흐름을 만들었고, 이후 Supabase Anonymous Auth와 RLS를 활용해 사용자별 운동 데이터를 저장하는 구조를 설계했습니다. 특히 운동 완료 경험이 백엔드 오류에 막히지 않도록 local-first sync 방식을 선택했습니다. 또한 GitHub Actions CI/CD와 GitHub Pages 배포를 구축해 lint, format, test, typecheck, build를 자동화했고, 17개의 unit test로 핵심 운동 로직과 sync 흐름을 검증했습니다. 이 프로젝트를 통해 제품 가설을 기술적으로 구현하는 것뿐 아니라, 배포와 검증까지 포함해 제품을 신뢰 가능한 상태로 만드는 경험을 했습니다.

### 예시 2 — APM 지원용

FiTech는 “운동 앱은 왜 운동 중 오히려 방해가 될까?”라는 질문에서 시작한 프로젝트입니다. 기존 운동 앱은 세트마다 사용자가 화면을 보고 입력할 것을 전제로 하지만, 실제 헬스장에서는 땀, 장비, 집중 흐름 때문에 휴대폰 조작 자체가 마찰이 됩니다. 저는 이 문제를 바탕으로 화면 의존도를 줄인 운동 경험이라는 제품 가설을 세우고, 이를 검증하기 위한 PoC를 설계했습니다. 먼저 로그인부터 운동 완료까지의 핵심 flow를 구현해 screenless interaction이 가능한지 확인했고, 이후 GitHub Pages 배포와 CI/CD를 구축해 팀원과 리뷰어가 항상 동일한 제품 상태를 확인할 수 있게 했습니다. 또한 Supabase를 연결해 실제 user-owned data 저장 가능성을 검증했고, live smoke test와 unit test를 통해 검증 결과를 문서화했습니다. 이 경험을 통해 APM에게 중요한 문제 정의, MVP 범위 설정, trade-off 판단, 실행 우선순위 설계, 검증 기반 커뮤니케이션을 실전적으로 경험했습니다.

## 10. 이력서 bullet 예시

### Product Engineer bullet

- Built and deployed FiTech, a screenless workout web app PoC, translating a gym-user friction point into a React/Vite MVP with low-interaction session controls, audio guidance, workout history, and profile analytics.
- Designed a local-first Supabase persistence flow using Anonymous Auth, Postgres schema, and Row Level Security, then validated real authenticated writes through a live smoke test across 5 tables.
- Implemented GitHub Actions CI/CD with lint, format check, unit tests, typecheck, production build, and GitHub Pages deployment to keep the prototype continuously shareable and regression-resistant.
- Added 17 Vitest unit tests covering workout planning, progressive overload, local persistence, and Supabase sync success/failure paths.

### APM bullet

- Defined and validated a PoC for reducing phone interaction during workouts by narrowing a broad fitness-app idea into a testable screenless workout flow.
- Sequenced product development from MVP flow validation to CI/CD, backend feasibility, and automated regression testing.
- Chose local-first sync and Anonymous Auth to reduce demo friction while preserving a path toward authenticated user-owned data.
- Documented roadmap, risks, validation evidence, and next steps to support portfolio review and team collaboration.

## 11. 면접에서 말할 수 있는 핵심 메시지

면접에서는 이 프로젝트를 다음 한 문장으로 시작할 수 있다.

> FiTech는 운동 앱의 기능을 늘리는 프로젝트가 아니라, 운동 중 휴대폰 조작이라는 사용 맥락의 마찰을 줄일 수 있는지 검증한 Product Engineering PoC입니다.

그 다음에는 다음 순서로 말하면 논리적이다.

1. 문제: 운동 중 화면 조작이 운동 흐름을 방해한다.
2. 가설: 화면 의존도를 줄여도 운동 안내와 기록이 가능할 것이다.
3. MVP: 탭 기반 세션 제어, 음성 안내, 운동 기록 flow를 만들었다.
4. PoC 검증: GitHub Pages로 배포하고 Supabase smoke test로 실제 저장을 확인했다.
5. 품질 체계: CI/CD와 unit test를 추가해 협업 가능한 상태로 만들었다.
6. 배운 점: 좋은 PoC는 많은 기능보다 명확한 가설, 검증 증거, 다음 리스크를 남겨야 한다.

## 12. 다음 단계

현재 가장 중요한 다음 단계는 Playwright E2E smoke test다. 지금까지는 core logic과 Supabase backend path를 검증했지만, 실제 브라우저에서 로그인부터 운동 완료까지의 full user journey를 자동으로 검증하지는 않았다.

다음 검증 목표:

```txt
login
→ workout setup
→ plan generation
→ session start
→ set complete
→ workout complete
```

이 E2E test가 추가되면 FiTech는 PoC, CI, CD, backend validation, unit test, browser journey validation까지 갖춘 더 완성도 높은 Product Engineer/APM 포트폴리오 사례가 된다.
