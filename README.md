# lunchtime-fe

날씨와 취향으로 오늘 점심 메뉴를 추천하고, 근처에서 그 메뉴를 파는 식당을 찾아 주는 웹 앱의 프론트엔드다. 사용자 화면(데스크톱 · 태블릿 · 모바일 웹뷰)과 어드민(데스크톱)을 함께 담고 있다.

- 기능명세: [plan.md](plan.md) · API 명세: [API.md](API.md) · 작업 기록: [log.md](log.md)
- 코드 규칙: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 새 화면 · 부품을 만들기 전에 읽는다

지금은 **1단계(프론트 + 목 API)** 가 끝난 상태다. 백엔드가 없어서 모든 API 요청은 브라우저 안의 목 서버(`lib/api/mock/`)가 받는다.

## 기술 스택

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind CSS v4 (CSS-first, 토큰은 `app/globals.css`) · lucide-react 아이콘
- Radix Dialog / Popover, overlay-kit(함수로 여는 모달), react-toastify(토스트), motion
- 카카오 지도 JS SDK (지도 그림만 실제, 식당 데이터는 목)

> Next.js 16은 최근 버전이다. 라우팅 · 설정 코드를 쓰기 전에 `node_modules/next/dist/docs/`를 확인한다 (`AGENTS.md` 참고).

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # ESLint
npx tsc --noEmit   # 타입 검사
npm run build      # 프로덕션 빌드
```

`.env.local` (저장소에 올리지 않음)

| 키 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 지도 JS SDK (localhost:3000 도메인 등록 필요) |
| `KAKAO_REST_API_KEY` · `KMA_SERVICE_KEY` · `KMA_BASE_URL` | 0단계 검증 스크립트(`scripts/spike/`)용. 앱은 쓰지 않는다 |
| `NEXT_PUBLIC_API_MOCK` | `false`면 목 대신 실서버로 요청 (기본: 목) |
| `NEXT_PUBLIC_API_BASE_URL` | 실서버 주소 (기본 `https://api.lunchtime.example/v1`) |
| `NEXT_PUBLIC_MOCK_SCENARIO` | 목 예외 상황 (아래 참고) |

## 화면

| 경로 | 화면 |
| --- | --- |
| `/` | 홈 · 오늘의 추천 |
| `/map?menuId=&placeId=&view=reviews` | 지도 · 식당 목록 · 상세 · 리뷰 모두 보기 |
| `/search?q=&type=` | 검색 결과 |
| `/favorites` · `/my` | 찜한 식당 · MY |
| `/taste` · `/onboarding?step=` | 취향 설정 · 온보딩 |
| `/login` · `/login/email` · `/signup` · `/password-reset` | 로그인 · 이메일 계정 |
| `/admin/login` | 어드민 로그인 (사용자 로그인과 별개) |
| `/admin/users` · `/admin/reports` · `/admin/menus` · `/admin/sponsored` | 유저 관리 · 리뷰 신고 · 메뉴 관리 · 광고 식당 고정 |
| `/dev` | 공용 부품 미리보기 (개발용) |

## 목 서버로 확인하기

목 상태는 대부분 메모리에 있어 **새로 고치면 처음으로 돌아간다**. 로그인 상태 · 가입한 이메일 계정 · 최근 검색처럼 기기에 남는 것은 `localStorage`에 있다.

**테스트 계정**

| 용도 | 값 |
| --- | --- |
| 사용자 (기본) | 처음부터 로그인 상태(지민). 소셜 로그인 버튼은 가짜 토큰으로 바로 로그인 |
| 이메일 계정 | `test@lunchtime.dev` / `lunch1234` · 인증번호는 항상 `123456` |
| 어드민 | `admin` / `admin1234` · OTP `123456` |

**예외 상황(시나리오)** — 브라우저 콘솔에서 켜고 새로 고친다. 여러 개는 콤마로.

```js
localStorage.setItem("lunchtime.mockScenario", "guest,noWeather")
```

| 시나리오 | 상황 |
| --- | --- |
| `guest` | 비로그인 (인기 추천, 찜 · 리뷰는 로그인 팝업) |
| `noTaste` | 취향 미입력 (홈 취향 배너) |
| `newUser` | 로그인하면 처음 가입한 사용자 → 온보딩 |
| `noWeather` · `noRestaurants` | 날씨 실패 · 근처 식당 0곳 |
| `noFavorites` · `noReviews` | 찜 없음 · 내 리뷰 없음 |

**처음 상태로 돌리기** — 콘솔에서 아래 키를 지우고 새로 고친다.

| 키 | 내용 |
| --- | --- |
| `lunchtime.mockAuth` | 목 로그인 상태 (`in` · `out`). 지우면 기본(로그인) |
| `lunchtime.mockAccounts` · `lunchtime.mockAccount` | 가입한 이메일 계정 · 지금 로그인한 계정 |
| `lunchtime.adminAccessToken` | 어드민 토큰 |
| `lunchtime.location` · `lunchtime.recentSearches` · `lunchtime.recentLocations` | 위치 · 최근 검색 |
| `lunchtime.mockScenario` | 시나리오 |

## 폴더 구조

```
app/
├── (main)/            # 사용자 화면 (상단 메뉴바 · 하단 탭바)
├── login/ signup/ password-reset/ onboarding/   # 메뉴바 없는 단독 화면
└── admin/
    ├── login/         # 어드민 로그인
    └── (console)/     # 사이드바 + 로그인 확인 (users · reports · menus · sponsored)

components/
├── pages/<route>/     # 화면별 DesktopPage · MobilePage + sections/ (어드민은 화면 하나)
├── domain/            # 도메인 부품 (식당 행 · 카드, 지도, 리뷰 모달 …)
│   ├── auth/ taste/ admin/
├── layout/            # 메뉴바 · 탭바 · 어드민 사이드바
├── common/            # 도메인 없는 부품 (SelectChip, EmptyState, BottomSheet, ConfirmDialog …)
└── ui/                # 디자인 시스템 기본 부품 (Button, Dialog, Notify …)

hooks/                 # 화면 로직(use<Page>Logic) · 공용 훅
lib/
├── api/               # API 함수 · client(request) · 목 서버(mock/)
├── sessionStore.ts    # 사용자 로그인 상태
├── adminStore.ts      # 어드민 로그인 상태 · 신고 배지
└── …                  # 위치 · 최근 검색 · 형식 · 검사 함수
types/ constants/      # 도메인별 타입 · 상수
scripts/spike/         # 0단계 외부 API 검증 스크립트
```
