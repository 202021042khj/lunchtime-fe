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
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 주소 (기본 `http://localhost:4000/v1` = 로컬 `lunchtime-be`). 배포 환경은 꼭 넣는다 |
| `NEXT_PUBLIC_API_MOCK` | `true`면 백엔드 없이 목 데이터로 화면만 본다 (기본: 실서버) |
| `NEXT_PUBLIC_KAKAO_REST_KEY` | 웹 카카오 로그인 인가 요청의 `client_id` (카카오 REST 키) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 웹 구글 로그인 인가 요청의 `client_id` (Google Cloud OAuth 클라이언트, 웹) |
| `NEXT_PUBLIC_MOCK_SCENARIO` | 목 예외 상황 (`NEXT_PUBLIC_API_MOCK=true`일 때만, 아래 참고) |

**로컬 백엔드로 실행하기** (기본)

- `../lunchtime-be`에서 `npm run db:up` → `npm run start:dev`(4000)를 먼저 띄운다
- 이메일: `test@lunchtime.dev` / `lunch1234`. 새로 가입할 때 인증번호는 백엔드 서버 로그에 나온다
- 카카오: [카카오로 계속하기] → 카카오 로그인 → `/login/kakao/callback` → 온보딩 또는 원래 화면. 카카오 개발자 콘솔(앱 → 플랫폼 키 → REST API 키)에 Redirect URI `http://localhost:3000/login/kakao/callback`을 등록하고, 백엔드 `.env`에 `KAKAO_APP_ID` · `KAKAO_CLIENT_SECRET`을 넣어야 한다
- 구글: 같은 방식으로 `/login/google/callback`. Google Cloud 콘솔 OAuth 클라이언트(웹)에 이 주소를 승인된 리디렉션 URI로 등록하고, client ID를 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`와 백엔드 `GOOGLE_CLIENT_IDS`에, secret을 `GOOGLE_CLIENT_SECRET`에 넣는다
- Apple: 버튼은 "서비스 준비 중"으로 비활성화 (개발자 계정 · https 주소 준비 후)
- 어드민 accessToken(30분)이 끝나면 refreshToken(12시간)으로 자동으로 다시 받고, 그것도 끝나면 어드민 로그인 화면으로 간다
- 리뷰 사진 · 어드민 사진은 백엔드 docker-compose의 저장소(RustFS, 9000)에 올라간다. 어드민 로그인은 `admin` / `admin1234` / OTP `123456`(개발 환경)
- API 계약 검사: 백엔드를 띄운 채 `npm run check:contract`. 실서버 응답을 프론트 타입(`types/*`)에 그대로 넣어 tsc로 확인한다(빠진 · 남는 필드, 값 종류). 확인용 계정 · 리뷰는 끝나면 지운다
- 음식 종류 일러스트(`public/cuisine/*.webp`)가 없는 종류는 브라우저 개발자 도구에 404가 보인다. 아이콘으로 대신 보여 주므로 정상이다

## 음식 종류별 대체 이미지

우리 사진(리뷰 · 광고 · 메뉴)이 없는 식당은 음식 종류별 대체 이미지를 보여 준다(`components/common/FoodImage.tsx`). `public/cuisine/`에 아래 이름으로 일러스트를 넣으면 그 그림을, 없으면 종류별 아이콘을 보여 준다. 파일을 넣고 배포하면 바로 바뀌고 코드는 고치지 않아도 된다.

| 종류 | 파일 |
| --- | --- |
| 한식 · 중식 · 일식 · 양식 | `korean.webp` · `chinese.webp` · `japanese.webp` · `western.webp` |
| 분식 · 아시안 · 패스트푸드 · 샐러드·건강식 | `snack.webp` · `asian.webp` · `fastfood.webp` · `salad.webp` |
| 그 밖의 종류 | `other.webp` |

- 정사각형(권장 480×480 이상), 가운데에 주요 그림을 둔다. 카드 · 썸네일 비율에 맞춰 가운데 기준으로 잘린다
- 파일 이름은 주소 인코딩 문제가 없게 영문으로 둔다
- 이 식당의 실제 사진(리뷰 · 광고)이 아니면(메뉴 대표 사진 · 일러스트 · 아이콘) 큰 사진에는 "예시 이미지로, 실제 식당 음식과 다를 수 있어요", 목록 썸네일에는 "예시" 배지가 붙는다(`FoodImage`의 `exampleNotice`, 식당 응답의 `imageSource`)

## 화면

| 경로 | 화면 |
| --- | --- |
| `/` | 홈 · 오늘의 추천 |
| `/map?menuId=&placeId=&view=reviews` | 지도 · 식당 목록 · 상세 · 리뷰 모두 보기 |
| `/search?q=&type=` | 검색 결과 |
| `/favorites` · `/my` | 찜한 식당 · MY |
| `/taste` · `/onboarding?step=` | 취향 설정 · 온보딩 |
| `/login` · `/login/email` · `/signup` · `/password-reset` | 로그인 · 이메일 계정 |
| `/login/kakao/callback` · `/login/google/callback` | 소셜 로그인에서 돌아오는 곳 (잠깐 보였다가 이동) |
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
