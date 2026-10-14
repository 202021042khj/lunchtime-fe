# lunchtime 작업 로그

단계마다 무엇을 했고, 무엇을 정했고, 다음에 할 일이 무엇인지 남긴다. 최신 항목이 아래에 온다.

기준 문서: [plan.md](plan.md) (기능명세), [API.md](API.md) (API 명세)

## 개발 순서 (2026-10-14 결정)

외부 API 검증 → 프론트엔드(목 데이터) → 백엔드.

- API.md가 응답 모양까지 정해 두었으므로 프론트는 백엔드 없이 목으로 진행할 수 있다.
- 화면을 먼저 만들면 명세의 빈 곳이 일찍 드러나고, 그때 고치는 비용이 백엔드를 다시 만드는 것보다 싸다.
- 단, 추천 품질은 카카오·기상청 데이터에 달려 있으므로 그 부분만 먼저 검증한다.

---

## 0단계 준비 · API 키 발급 (2026-10-14)

- 카카오 디벨로퍼스: 앱 생성, [카카오맵] > [사용 설정] ON, REST API 키 · JavaScript 키 발급
- 공공데이터포털: 기상청_단기예보 조회서비스 활용 신청. "End Point"는 기본 URL이고 "일반 인증키"가 serviceKey
- `.env.local`(커밋 안 됨): `KAKAO_REST_API_KEY`, `NEXT_PUBLIC_KAKAO_JS_KEY`, `KMA_SERVICE_KEY`, `KMA_BASE_URL`

## 0단계 · 외부 API 검증 (2026-10-14)

스크립트: `scripts/spike/kakao.mjs`, `scripts/spike/kma.mjs` (`node --env-file=.env.local scripts/spike/<파일>`로 실행). 원본 응답은 `scripts/spike/out/`에 저장하며 커밋하지 않는다.

**카카오 로컬** (역삼동 · 판교 · 세종시청 × 메뉴 12개)
- 응답이 빠르다: 84회 호출 평균 47ms, 최대 67ms. 메뉴 5개를 동시에 검색해도 약 60ms
- 지역 차이가 크다: 역삼·판교는 메뉴당 1km 안에 수십~수백 곳, 세종은 쌀국수 2곳·마라탕 6곳 → "3km로 넓히기"가 필요하다
- 45개 제한은 거리순 정렬이면 가장 가까운 45곳이 오므로 문제없다
- **식당 이름에 메뉴명이 있는 곳은 0~50%뿐**이다. 나머지는 카카오가 메뉴판 등으로 매칭한 것으로 보이며, 이유는 응답에 없다. 잘못 걸린 곳도 섞인다 (순두부찌개 → 냉면집·김밥천국)

**기상청 단기예보** (같은 3곳)
- 키 정상, 위경도 → 격자 변환 정상. API.md `weather` 객체를 그대로 채울 수 있다
- 현재 날씨(초단기실황·초단기예보)는 0.04~0.2초로 빠르고, 최고/최저(단기예보)는 1초 이상 걸린다

## 0단계 후속 · 명세 수정 (2026-10-14)

검증 결과를 plan.md · API.md에 반영했다.
- `menuEvidence.type`에 `keyword` 추가: 카카오 키워드 검색에만 나온 식당이며 추정 근거(회색)다
- 식당 정렬: 광고 → 리뷰·사장님 확인 → 이름 일치 → **키워드 일치** → 카테고리만 일치(최대 5곳). 키워드 일치 중 메뉴의 카카오 카테고리와 맞지 않는 식당은 그 단계 맨 뒤로 보낸다
- 날씨 캐시: 격자 단위로 현재 날씨는 1시간, 최고/최저는 하루

## 1단계-1 · 타입과 API 클라이언트(목) (2026-10-14)

**만든 것**
- `types/`: API.md 객체를 도메인별 파일로 정의했다. `common` · `user` · `preferences` · `location` · `weather` · `menu` · `restaurant` · `review` · `recommendation` · `admin`
- `lib/api/client.ts`: `request()` 함수 하나로 모든 호출을 처리한다. 토큰을 붙이고, 401이면 refresh 후 한 번 재시도하고, 실패 응답은 `ApiError(status, code, message)`로 던진다
- `lib/api/{auth,preferences,locations,recommendations,restaurants,reviews}.ts`: API.md의 사용자 API를 함수로 만들었다 (예: `getRecommendations`, `getRestaurants`, `createReview`). 어드민 API는 어드민 단계에서 추가한다
- `lib/api/mock/`: 메모리에서 동작하는 목 서버다. 역삼동 기준 가상 식당 12곳, 메뉴 10개, 리뷰 5개가 들어 있고, 정렬·근거·리뷰 검증·하루 1회 제한·신고 중복을 API.md대로 흉내 낸다
- `lib/geo.ts`: 거리 계산(`distanceM`)과 도보 시간(`walkMinutes`, 거리 ÷ 80m)

**목 사용법**
- 기본값이 목이다. 실서버로 바꾸려면 `NEXT_PUBLIC_API_MOCK=false`와 `NEXT_PUBLIC_API_BASE_URL`을 설정한다
- 예외 화면 확인: 브라우저 콘솔에서 `localStorage.setItem("lunchtime.mockScenario", "guest,noWeather")` 후 새로고침한다. 또는 `.env.local`에 `NEXT_PUBLIC_MOCK_SCENARIO`를 넣는다
  - `guest` 비로그인 · `noTaste` 취향 미입력 · `noWeather` 날씨 실패 · `noRestaurants` 근처 0곳 · `noFavorites` 찜 없음 · `noReviews` 내 리뷰 없음

**API.md에 없어서 프론트에서 정한 것** (백엔드를 만들 때 API.md에 옮겨야 한다)
- `GET /preferences/options` → `{ ingredients, allergies, cuisines }` (모두 string[])
- `GET /ingredients?q=` → `{ items: string[] }`
- `GET /me/locations`, `GET /locations/search` → `{ items: [...] }`
- `POST /uploads/review-photos` 요청 `{ count }` → 응답 `{ items: [{ photoId, uploadUrl }] }` (저장소 미결정, 미리 서명된 URL 가정)
- 취향의 `spiceLevel`은 건너뛰면 `null`
- 추천 응답에 `popularRank`(today·alternatives)와 `suggestRadiusM`(평소 null)을 항상 넣는다
- 추천 이유 `type`에 `popular`("이 근처 인기 1위") 추가
- 광고 표시는 `menuId` 검색에서 노출 메뉴가 맞을 때만 한다. 자유 검색어(`q`) 검색에서는 광고 배지를 붙이지 않는다

**확인한 것**
- `tsc --noEmit`, `eslint` 통과
- 목 호출 점검: 기본(personal, 96%) · guest/noTaste(popular, 인기 순위, 취향 배너) · noWeather(날씨 이유 빠짐) · noRestaurants(today null, 3km 제안), 순두부찌개 식당 정렬(광고 → 리뷰 → 키워드 → 카테고리 불일치 키워드 → 카테고리), 리뷰 하루 1회 · 500자 초과 · 좌표 없음 · 비로그인 찜 에러 코드

**다음**
- 디자인 토큰(브랜드 색·배경·유리 표면)과 공용 부품(Logo, Chip, Select Chip, Menu Card, Restaurant Row/Card, Empty State)
- 그다음 홈 화면

## 1단계-2 · 디자인 토큰과 공용 부품 (2026-10-14)

Figma의 `Local Components` 프레임(7:94)과 변수 정의를 기준으로 만들었다.

**디자인 토큰** (`app/globals.css`)
- 색: Figma 변수와 같은 이름의 CSS 변수와 Tailwind 클래스를 만들었다. 예: `Brand/Primary` → `--brand-primary` → `bg-brand-primary`. 그 밖에 `brand-apricot` · `brand-primary-tint` · `surface-background` · `surface-placeholder` · `labels-primary/secondary/tertiary` · `separators-non-opaque` · `fills-quaternary` · `chip-border` · `glass-card/sheet/border` · `accents-green/red`
- 글자: iOS 27 글자 스타일을 클래스로 만들었다 (`text-large-title`, `text-title-1`~`3`, `text-headline`, `text-body`, `text-subheadline`, `text-footnote`, `text-caption-1`~`2`). Emphasized는 `font-semibold`를 함께 쓴다. `lib/utils.ts`의 `cn()`에도 등록해 글자 색 클래스와 충돌하지 않게 했다
- 그림자 `shadow-glass`, 폰트는 SF Pro 우선 + 시스템 폰트 대체(Apple SD Gothic Neo, Pretendard, Noto Sans KR, 맑은 고딕). Geist 폰트는 뺐다
- 페이지 배경은 베이지(#F6F1EA), `<html lang="ko">`, 제목 "lunchtime"

**결정한 것**
- **v1은 라이트 전용**: Figma에 다크 디자인이 없어서 템플릿의 자동 다크 모드를 제거했다 (ARCHITECTURE.md · README 반영)
- **아이콘**: SF Symbols 대신 이미 설치된 `lucide-react` 사용
- **버튼**: 새로 만들지 않고 기존 `components/ui/button.tsx`에 `color="brand"`를 추가했다. 빈 상태의 Liquid Glass 주 버튼은 `<Button color="brand" shape="round">`
- **폴더**: 도메인 객체(`Restaurant` 등)를 받는 공용 부품은 새 폴더 `components/domain/`에 두었다. 도메인과 무관한 것은 `components/common/`에 두었다 (ARCHITECTURE.md 반영)
- 식당 행에 디자인에는 없는 **거리**와 **영업 여부**(광고·입점 식당만, "영업 중"은 초록색)를 추가했다. 기능명세의 식당 행 항목을 따른 것이다

**만든 것**
- `components/common/`: `LogoMark`(포크·나이프 SVG는 Figma에서 받아 `public/logo-fork-knife.svg`) · `Chip` · `SelectChip` · `FoodImage`(이미지가 없으면 "Food image placeholder") · `EmptyState`
- `components/domain/`: `RestaurantRow` · `RestaurantCard` · `MenuCard` · `MenuEvidenceLine`(확인된 근거 = 브랜드 색 + 체크, 추정 근거 = 회색) · `FavoriteButton`
- `lib/format.ts`: `formatDistance`("420m", "1.3km") · `formatRating`("★ 4.5 (리뷰 342)", 리뷰가 없으면 "아직 리뷰 없음") · `formatMatch`("매칭 92%", 매칭이 없으면 "인기 3위") · `joinMeta`
- `app/dev/page.tsx`: 공용 부품을 목 데이터로 한눈에 보는 개발용 페이지(`/dev`)

**확인한 것**
- `tsc --noEmit` 통과. 새로 만든 파일은 eslint 통과. 템플릿에서 가져온 파일(`slot.tsx`, `sortable-table.tsx`, `notify.tsx`, `deferred-component.tsx`, `button.tsx`의 `forwardRef<any>`)에는 원래 있던 린트 에러 18개가 남아 있다
- `/dev`를 headless Chrome으로 1440px · 402px로 캡처해 Figma 스크린샷과 비교했다. 칩 · 선택 칩 · 메뉴 카드 · 식당 행(광고 배지, 근거 줄) · 식당 카드 · 빈 상태가 디자인과 맞았다. 402px에서는 칩 줄바꿈, 메뉴 카드 가로 스크롤, 긴 글자 말줄임, 카드 1열이 정상이었다
- 한계: Windows에는 SF Pro가 없어서 한글은 맑은 고딕/Noto로 그려진다. Mac·iOS에서 글자 폭이 조금 다를 수 있다

**다음**
- 홈 화면 (Figma `01 Home · Desktop` 12:171, 모바일 참고 9:504): 상단 메뉴바, 오늘의 추천, 다른 추천 메뉴, 근처 식당 패널, 예외 상태(취향 미입력·날씨 실패·위치 없음)

## 1단계-3 · 린트 정리 (2026-10-14)

템플릿에서 가져온 파일의 린트 에러 20개를 모두 고쳤다. 동작은 바꾸지 않았다.
- `any` 제거: `components/ui/slot.tsx`(React 19는 `ref`가 `props.ref`에 있어 그쪽에서 읽음) · `button.tsx`(`forwardRef<HTMLButtonElement>`) · `sortable-table.tsx`(`SortableItem { id }`, dnd-kit 타입) · `hooks/useCallbackRef.ts`
- `notify.tsx`: 렌더 중에 아이콘 컴포넌트를 고르던 것을 조건부 JSX로 바꿨다
- `deferred-component.tsx`: effect 안에서 바로 setState하던 것을 렌더 조건으로 옮겼다
- 결과: `tsc --noEmit`, `eslint .` 모두 에러 0

## 1단계-4 · 홈 화면 (2026-10-14)

Figma `01 Home · Desktop`(12:171), 모바일 참고(9:504), 예외 화면 `12 Home 취향 미입력·날씨 실패`(37:2091) · `위치 권한 없음`(37:1779), `08 Location Change`(34:1187)를 기준으로 만들었다.

**만든 것**
- 홈 `/` (`app/(main)/page.tsx` + `hooks/useHomeLogic.ts` + `components/pages/main/`)
  - 데스크톱: 히어로(이미지 위 "오늘의 추천"·날씨 배지, 매칭 %, 설명, 이유 칩, [근처 식당 찾기] [다른 메뉴 추천]), "이런 메뉴는 어때요?" 4열, 오른쪽 근처 식당 패널(카카오 지도 미리보기 + 식당 4곳 + "식당 n곳 더 보기")
  - 태블릿(768~1023px): 1단으로 쌓고 메뉴바 검색창은 아이콘으로 줄인다
  - 모바일: 로고 → 날씨 한 줄 → 위치 카드([변경]) → 히어로(메뉴명이 이미지 위) → 다른 메뉴 가로 스크롤 → 근처 식당. 지도 미리보기는 뺀다
  - 예외: 위치 없음(동네 선택하기 / 위치 권한 허용하기), 비로그인·취향 미입력(배너 + "오늘 많이 찾는 메뉴" + 인기 순위), 날씨 실패(배지 문구, 날씨 이유 제외), 근처 0곳(반경 3km로 넓히기 → 그래도 없으면 동네 바꾸기), 불러오기 실패(다시 시도), 로딩 스켈레톤
  - [다른 메뉴 추천]: 본 메뉴를 `excludeMenuIds`에 쌓아 다시 요청한다. 후보가 바닥나면 안내 후 처음부터 다시 보여 준다
  - 찜: 누르면 바로 반영하고 실패하면 되돌린다. 비로그인이면 "찜하려면 로그인이 필요해요" 안내 (로그인 필요 팝업은 로그인 단계에서 붙인다)
- 공통 틀 `app/(main)/layout.tsx`: 데스크톱 상단 메뉴바(`components/layout/DesktopTopNav`), 모바일 하단 탭바(`MobileTabBar`, safe-area 여백)
- 위치 설정 모달 (`components/domain/LocationPickerModal`, `openLocationPicker()`): 동네 검색(250ms 디바운스), 현재 위치로 설정, 저장한 위치(로그인 시, 선택된 곳 체크, "지금 위치 저장하기"), 최근 검색(기기에만 저장). 모바일은 전체 화면 시트
- 현재 위치 스토어 `lib/locationStore.ts` + `hooks/useCurrentLocation.ts`: 마지막 위치를 기기에 저장한다. 저장된 위치가 없으면 브라우저 위치 권한을 요청하고, 거부되면 "위치를 알 수 없어요" 화면을 띄운다
- 카카오 지도 `lib/kakaoMap.ts`(SDK 1회 로드, 8초 타임아웃) + `components/domain/MapPreview`(조작 막은 미리보기, 브랜드 핀·내 위치 점). SDK를 못 불러오면 "지도를 불러오지 못했어요"를 보여 준다
- 기타: `RestaurantList`(행 사이 구분선), `ReasonChips`, `constants/{navigation,weather,recommendation}.ts`, `lib/recentLocations.ts`, `lib/format.ts`에 날씨·반경 표기 추가, `public/map-me.svg`(Figma 내 위치 점)
- 템플릿의 `components/pages/main/sections/*ScrollShowcaseSection.tsx`는 지웠다

**결정한 것 / API.md와 다른 점**
- `SavedLocation`에 `address` 추가 (모달에 주소를 보여 주기 위해. 백엔드 때 API.md에 반영 필요)
- 모바일 위치 카드의 "반경 1km 안 식당 23곳"은 반경 안 전체 식당 수를 주는 API가 없어서 "반경 1km 안에서 추천해요"로 바꿨다. 필요하면 추천 응답에 `totalNearbyCount`를 추가해야 한다
- 메뉴바 높이는 Figma대로 128px로 했다 (Figma의 Spacer가 높이를 100px로 잡고 있음. 의도한 값이 아니라면 72px 정도로 줄이는 것을 권한다)
- 메뉴 카드를 누르면 그 메뉴로 지도 화면(`/map?menuId=`)에 간다 (기능명세에 동작이 없어서 정함)
- 아직 없는 화면으로 가는 링크: `/map`, `/favorites`, `/taste`, `/my`, `/search`. 지금은 404가 나오고 다음 단계에서 만든다
- 개발 서버는 `localhost:3000`으로 띄워야 카카오 지도가 나온다 (카카오 디벨로퍼스에 등록한 도메인)

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- 1440px 캡처를 Figma와 비교했다: 일반(맞춤 추천, 실제 카카오 지도) · 취향 미입력+날씨 실패 · 위치 권한 없음 · 위치 설정 모달이 맞았다. 402px 모바일도 디자인과 맞았고 가로 넘침이 없었다
- 실제 브라우저를 조작해(Playwright + 설치된 Chrome) 확인했다: 다른 메뉴 추천(순두부찌개 → 김치찌개), 찜 토글, 모달에서 "판교" 검색 → 판교동 선택 → 메뉴바 반영·기기 저장, 근처 0곳 → 3km 넓히기, 비로그인 찜 안내, 취향 배너 닫기. 모두 통과했다
- 참고: Chrome 한 줄 캡처(`--screenshot`)의 가상 시간 옵션은 `requestAnimationFrame`을 멈춰서 overlay-kit 모달이 열리지 않는다. 화면 동작은 Playwright로 확인한다

**다음**
- 지도 · 식당 목록 · 상세 (Figma `03 Map` 23:380, 모바일 시트 31:946 · 31:1117, 근처 0곳 37:1894) — 홈의 [근처 식당 찾기]·메뉴 카드가 여기로 연결된다

## 1단계-4 후속 · 위치 권한 창을 닫으면 스켈레톤에 멈추던 문제 (2026-10-14)

**증상**: 첫 방문에 브라우저 위치 권한 창을 닫으면 홈이 빈 스켈레톤에서 넘어가지 않았다 (사용자 제보).

**원인**: `navigator.geolocation.getCurrentPosition`의 `timeout`은 권한을 허용한 뒤에야 시작된다. 권한 창을 닫거나 응답하지 않으면 성공·실패 콜백이 모두 오지 않아 위치 상태가 계속 `locating`에 머물렀다. 그 사이 화면에는 다른 선택지가 없었다.

**수정**
- `lib/locationStore.ts`: 권한 응답과 별개로 전체 대기 시간 10초를 두었다. 시간이 지나면 `unavailable`로 넘어가 "위치를 알 수 없어요" 화면을 보여 준다. 늦게 온 콜백은 무시한다
- 홈: 위치를 기다리는 동안 스켈레톤 대신 "위치를 확인하고 있어요" + [동네 직접 고르기]를 보여 준다 (`HomeStatusSection` kind `locating`)

**확인한 것**: `tsc --noEmit`, `eslint .` 에러 0. 브라우저 확인은 사용자 환경에서 한다 (아래 안내)
