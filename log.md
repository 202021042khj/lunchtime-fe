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

## 1단계-5 · 지도 · 식당 목록 · 상세 (2026-10-15)

Figma `03 Map · Desktop`(23:380), 모바일 목록 시트(31:946) · 상세 시트(31:1117), `12 Map · 근처 식당 0곳`(37:1894)을 기준으로 만들었다. Figma 연결이 끊겨 있어서 사용자가 다시 인증한 뒤 진행했다.

**만든 것**
- 지도 `/map?menuId=&placeId=` (`app/(main)/map/page.tsx` + `hooks/useMapLogic.ts` + `components/pages/map/`)
  - 데스크톱: 왼쪽 목록 패널(메뉴명, "역삼동 반경 1km · 식당 n곳", 필터 칩, 개수 · 정렬, 식당 행, "식당 더 보기"), 가운데 카카오 지도, 선택하면 오른쪽 상세 패널. 태블릿은 패널 폭만 줄인다(360px / 340px). 메뉴바는 지도 화면에서 화면 전체 폭을 쓴다(Figma대로)
  - 모바일: 지도 전체 화면 + 위쪽 검색바(뒤로 · 메뉴명 · 취향 설정) · 필터 칩 1줄 가로 스크롤, 하단 목록 시트 → 행을 누르면 상세 시트. [내 위치]만 있다(확대/축소 없음)
  - 목록 ↔ 지도 연동: 행 선택 → 핀 강조(이름 붙은 브랜드 핀) · 지도 이동, 핀 클릭 → 행 선택. 선택한 핀은 상세 패널(데스크톱)·시트(모바일)에 가리지 않게 비켜 둔다
  - 지도를 끌어 200m 넘게 옮기면 [이 지역에서 다시 검색]. 누르면 그 중심으로 다시 찾는다("이 지역 반경 1km")
  - 필터: 메뉴 칩(끄면 메뉴 상관없이 근처 식당) · 1km 이내(끄면 3km) · 별점 4.0+ · 리뷰 많은 순, 정렬 메뉴(거리순 / 리뷰 많은 순)
  - 상세: 사진, 이름·메타·별점(별 5개, 반 별), 메뉴 근거 박스(확인됨 = 브랜드 틴트 + 체크, 추정 = 회색) + [이 메뉴 안 팔아요], 주소·영업시간("영업시간 정보 없음")·전화, [길찾기](카카오맵 링크) [찜] [공유], 최근 리뷰 2개, [리뷰 쓰기] [리뷰 n개 모두 보기]
  - 공유: Web Share가 있으면 OS 공유 창(Windows Chrome 포함), 없으면 링크 복사(`hooks/useCopyClipboard` 재사용). 링크에 `placeId`가 들어 있어 받은 사람도 같은 식당 상세로 들어온다
  - 빈 상태: "1km 안에 순두부찌개 식당이 없어요" + [반경 3km로 넓히기] [다른 메뉴 추천받기](홈). 3km에서도 없으면 [동네 바꾸기]
- 공용 부품
  - `components/domain/KakaoMap`: 조작 가능한 지도(핀·선택 핀·내 위치, 확대/축소, [내 위치], 끌기 감지, 결과에 맞춰 화면 맞춤, 크기 변화 시 다시 그리기)
  - `lib/kakaoMapPins.ts`: 홈 미리보기 핀과 지도 핀을 한곳에 모았다 (`MapPreview`도 이걸 쓴다). `public/map-me-halo.svg`(Figma 내 위치 점 + 번짐)
  - `components/common/BottomSheet`: 모바일 시트, 3단(최소 · 반 · 전체). 손잡이를 끌거나 누른다
  - `components/domain/RestaurantDetailContent`, `StarRating`, `LocationRequiredState`(홈과 지도가 함께 쓰는 "위치 확인 중 / 위치를 알 수 없어요")
  - `hooks/useFavoriteToggle`: 찜 즉시 반영 + 실패 시 되돌리기. 홈과 지도가 함께 쓴다 (홈 로직도 이걸로 바꿨다)
  - `lib/format.ts`: `formatHours`, `formatMonthDay`, `withObjectParticle`(순두부찌개"를" / 국밥"을")
- 목 데이터: 역삼 주변 1~3km 식당 4곳과 리뷰 2개 추가, 목록 응답에 `menu` 추가

**결정한 것 / API.md와 다른 점**
- `GET /restaurants` 응답에 `menu: { id, name, keyword } | null`을 추가했다. 목록 머리말에 "얼큰 순두부찌개", 칩에 "순두부찌개"를 보여 줄 방법이 API에 없었다 (백엔드 때 API.md에 반영 필요)
- "1km 이내" 칩은 켜면 1km, 끄면 3km로 정했다. 처음에는 켜져 있다. Figma 시안은 이 칩이 꺼진 채 "반경 1km"로 되어 있어 의미가 모호했다
- "리뷰 많은 순" 칩과 정렬 메뉴는 같은 정렬 값을 바꾼다
- 상세의 거리·메뉴 근거는 목록 값을 쓴다 (`GET /restaurants/{placeId}`에는 좌표·메뉴가 없어서). 링크로 바로 들어와 목록에 없는 식당이면 상세 값만 보여 준다
- [이 지역에서 다시 검색]은 지도를 옮겼을 때만 보인다 (Figma 시안에는 늘 떠 있음)
- [리뷰 쓰기] · [리뷰 모두 보기]는 "준비 중인 기능이에요" 안내만 한다 (다음 단계에서 연결)
- 모바일 검색바의 오른쪽 버튼은 취향 설정으로 간다 (홈 모바일 헤더와 같은 아이콘)

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- 1440px · 402px 캡처를 Figma 23:380 · 31:946 · 31:1117 · 37:1894와 비교했다
- Playwright(설치된 Chrome)로 실제 조작해서 확인했다: 목록 머리말·개수, 행 선택 → 상세·리뷰·행 강조, 핀 클릭 → 목록 선택, 메뉴 제보 → 같은 제보 다시 하면 안내, 상세 찜 토글, 별점 4.0+(6곳 → 3곳), 1km 끄기(6곳 → 9곳), 0곳 → 3km 넓히기, 홈 [근처 식당 찾기] → 지도, 모바일 시트 끌어올리기·끌어내리기·손잡이 탭, 모바일 상세 시트, 가로 넘침 없음. 모두 통과했다
- 공유: Web Share가 없는 환경에서 링크 복사와 복사된 주소(`/map?menuId=m_12&placeId=2271043`)를 확인했다. Windows Chrome에서는 OS 공유 창이 뜨는 게 맞는 동작이다
- 고친 버그: 시트 손잡이를 끌면 포인터가 24px 손잡이를 금방 벗어나 끌기가 안 되던 문제. 누르는 순간부터 화면 전체에서 움직임을 따라가게 바꿨다

**다음**
- 리뷰 쓰기(기능명세 5, Figma 04 Write Review 24:480) · 리뷰 모두 보기/신고(11, 36:1523 · 36:1877) — 지도 상세의 버튼이 여기로 연결된다

## 1단계-5 후속 · [이 지역에서 다시 검색] 수정 (2026-10-15)

**증상** (사용자 제보): 지도를 옮긴 뒤 [이 지역에서 다시 검색]을 누르면 지도가 현재 위치로 돌아가고, 검색이 안 되는 것처럼 보였다.

**원인**
1. `KakaoMap`이 새 결과가 올 때마다 현재 위치(`me`)와 결과가 다 보이게 화면을 맞췄다. 다시 검색도 결과가 바뀌니 지도가 현재 위치 쪽으로 튀었다 (버그)
2. 목 식당이 역삼 주변에만 있어서, 멀리 옮겨 다시 검색하면 0곳이었다 (목 한계. 실서버에서는 카카오 로컬 결과가 나온다)
3. 함께 찾은 버그: 파란 내 위치 점이 지도에 안 보였다. Tailwind 기본 스타일 `img { max-width: 100% }`가 폭 없는 카카오 오버레이 안에서 이미지를 0px로 줄였다. 홈 지도 미리보기에서도 같은 문제가 있었다

**수정**
- `hooks/useMapLogic.ts`: `fitKey`에서 검색 중심을 뺐다 (동네 · 반경 · 메뉴 · 검색어 · 별점 · 정렬 · 재시도만). 다시 검색은 중심만 바뀌므로 지도를 움직이지 않는다. `fitCenter`(= 검색 중심)를 내보낸다
- `components/domain/KakaoMap.tsx`: 화면 맞춤 기준을 현재 위치가 아니라 `fitCenter`로 바꿨다. 다시 검색한 지역에서 필터를 바꿔도 그 지역에 머문다. 결과가 아직 없을 때(`fitKey` 빈 값)는 맞추지 않는다
- `lib/kakaoMapPins.ts`: 내 위치 이미지에 `max-width: none`
- 목: 역삼에서 3km 넘게 떨어진 곳을 검색하면 그 주변에 메뉴별 가상 식당("동네 순두부찌개집" 등, 주소 "목 데이터 · 가상 식당")을 만든다. 좌표를 약 1km 칸으로 반올림해서 같은 곳은 항상 같은 식당이 나온다. 상세 · 찜에서도 찾을 수 있다

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- Playwright: 축소 → 지도를 동쪽으로 끌기 → [이 지역에서 다시 검색] → 지도가 제자리(내 위치 점이 현재 위치로 돌아가지 않음, 캡처로도 확인), 머리말 "이 지역 반경 1km · 식당 1곳", 목록에 그 지역 식당, 버튼 사라짐 → 별점 필터를 눌러도 그 지역에 머묾 → [내 위치]를 누르면 현재 위치가 지도 가운데로 오고 머리말이 "역삼동"으로 돌아옴. 기존 지도 점검도 다시 통과했다

## 1단계-6 · 리뷰 쓰기 · 리뷰 모두 보기 · 리뷰 신고 (2026-10-15)

Figma `04 Write Review`(24:480), `11 All Reviews`(36:1523), `11 Report Review`(36:1877)를 기준으로 만들었다. 지도 상세의 [리뷰 쓰기] · [리뷰 n개 모두 보기]가 이제 실제로 동작한다.

**만든 것**
- 리뷰 쓰기 모달 (`components/domain/WriteReviewModal`, `openWriteReview(식당, 등록 후 콜백)`)
  - 별점 1~5(필수, 마우스를 올리면 미리 보기) + 한 마디(별로예요 · 아쉬워요 · 괜찮아요 · 좋아요 · 최고예요). 별점 없이 [등록하기] → "별점을 골라 주세요"
  - 먹은 메뉴(`GET /review-form` 메뉴 + [직접 입력]), 좋았던 점 태그, 각 최대 10개 — `SelectChip` 재사용
  - 자세한 후기(500자 카운터), 사진 최대 5장(미리보기 · 빼기). 등록할 때 `POST /uploads/review-photos`로 업로드 자리를 받아 올리고 id만 리뷰에 담는다 (목에서는 실제 업로드 생략)
  - 등록하면 상세의 별점·리뷰 수·최근 리뷰와 목록 행의 리뷰 수가 바로 바뀐다 (서버가 돌려준 `placeStats` 반영 + 상세 다시 불러오기)
  - 에러 코드별 안내: 하루 1개(`REVIEW_DAILY_LIMIT`) · 500자 · 사진 5장 · 비로그인 · 이용 정지
  - 작성 중에 닫으면 "작성 중인 리뷰가 사라져요" 확인 (모달 안에서. 템플릿 `ConfirmModal`은 관리자용 파란 스타일이라 쓰지 않았다)
  - 모바일은 전체 화면 시트, 별점 → 메뉴 → 태그 → 후기 → 사진 순, [등록하기] 하단 고정
- 리뷰 모두 보기 (`components/domain/RestaurantReviewsContent` + `hooks/useRestaurantReviews`) — 상세 패널(모바일은 상세 시트) 자리에서 바뀐다. URL `?view=reviews`
  - 평균 별점 · 별점별 개수 막대, 정렬(최신순 · 별점 높은 순 · 낮은 순 · 사진 리뷰), "리뷰 더 보기"(cursor), 리뷰가 없으면 [리뷰 쓰기]
  - 리뷰 한 줄: 이름(내 리뷰 표시) · 별점 · 먹은 메뉴 · 날짜 · 후기 · 사진 · 태그, ⋯ 메뉴(공유 · 신고하기). 내 리뷰에는 신고하기가 없다
- 리뷰 신고 모달 (`components/domain/ReportReviewModal`, `openReportReview(리뷰)`): 리뷰 발췌, 사유 1개(라디오), 메모(200자), 사유를 고르기 전 [신고하기] 비활성. 중복 신고 · 내 리뷰 · 비로그인 안내
- 공용: `components/domain/ReviewItem`(compact = 지도 상세, full = 모두 보기), `constants/review.ts`(별점 문구 · 제한 · 정렬 · 신고 사유), `components/pages/map/sections/PlacePanelSection`(상세 ↔ 모두 보기 전환, 데스크톱·모바일 공용)

**함께 고친 버그**
- **z-index 클래스가 하나도 만들어지지 않았다** (템플릿부터 있던 문제): Tailwind v4는 이름 붙은 z-index를 `--z-index-*`에서 읽는데 `globals.css`가 `--z-*`로 정의하고 있었다. 그래서 `z-dialog` · `z-popover` · `z-header` 등이 없는 클래스였고, 지도 상세 패널 위에서 연 팝오버(⋯ 메뉴)가 다른 요소 밑에 깔려 눌리지 않았다. 변수 이름을 `--z-index-*`로 바꿨다 (모달 · 팝오버 · 모바일 탭바 모두 해당). ARCHITECTURE.md에 메모
- 모바일 시트가 반쯤 올라온 상태에서는 스크롤 영역 아래쪽이 화면 밖이라 끝까지 볼 수 없었다 (상세의 [리뷰 쓰기]에 닿지 않음). 시트 안에서 스크롤을 시작하면 시트를 끝까지 올리게 했다

**결정한 것**
- 리뷰 모두 보기에서 [뒤로]는 상세로 돌아간다 (URL의 `view`만 지움). 브라우저 뒤로가기 기록은 쌓지 않는다 (`router.replace`)
- 리뷰 공유 링크는 `/map?menuId=&placeId=&view=reviews` — 받은 사람도 그 식당의 리뷰 모두 보기로 들어온다
- 신고 · 공유는 리뷰 모두 보기에서만 (지도 상세의 최근 리뷰 2개에는 ⋯ 메뉴 없음, Figma대로)

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- 1440px · 402px 캡처를 Figma 24:480 · 36:1523 · 36:1877과 비교했다
- Playwright(설치된 Chrome)로 23개 동작 확인, 모두 통과: 별점 없이 등록 막힘 → 별점 · 메뉴 · 직접 입력 메뉴 · 태그 · 후기(글자 수) · 사진 → 등록 → 상세 리뷰 수 4 → 5 · 최근 리뷰 · 목록 행 갱신 → 다시 쓰면 하루 1개 안내 → 닫기 확인 → 모두 보기 · 막대 · 별점 낮은 순 정렬 → 내 리뷰엔 신고 없음 → 신고(사유 전 비활성 · 접수 · 중복 안내) → 뒤로 상세 → 모바일 전체 화면 · [등록하기] 하단 고정

**다음**
- 남은 사용자 화면: 찜한 식당(06), MY(07), 취향 설정(02) · 온보딩(05), 로그인 · 로그인 필요 팝업(09), 검색 결과(10). 지금 이 링크들은 404다

## 1단계-7 · 찜한 식당 · MY (2026-10-15)

남은 화면 중 찜한 식당(06)과 MY(07)를 골랐다. 메뉴바 "찜한 식당"과 모바일 탭바 "찜" · "MY"가 404여서 앱 안의 기본 이동이 끊겨 있었고, 이미 만든 부품을 거의 그대로 쓸 수 있었다. Figma `06 Favorites`(26:758) · `07 MY`(26:880) · 빈 상태 37:2209 · 37:2284 기준.

**만든 것**
- 찜한 식당 `/favorites` (`hooks/useFavoritesLogic` + `components/pages/favorites/`)
  - 제목 + 개수, 종류 필터(전체 · 한식 · 일식 · 아시안), 정렬 "최근 찜한 순"(지금은 하나뿐이라 표시만, 모바일에선 숨김)
  - 데스크톱 카드 3열(태블릿 2열, `RestaurantCard`), 모바일은 식당 행 목록(`RestaurantList`)
  - 하트 = 찜 해제 → 바로 빠지고 "찜을 해제했어요 [되돌리기]". 카드 → `/map?placeId=`
  - 빈 상태 "아직 찜한 식당이 없어요" + [근처 식당 보기], 필터 결과 0곳, 비로그인, 오류
  - 거리는 현재 위치 기준 (목 `GET /me/favorites`에 `lat` · `lng` 추가)
- MY `/my` (`hooks/useMyLogic` + `components/pages/my/`)
  - 프로필: 이름, "카카오 로그인 · 2026년 9월 가입", 숫자 3개(내 리뷰 → 아래 리뷰로, 찜한 식당 → 찜 화면, 받은 추천)
  - 내 취향 요약 + [수정] → `/taste` (취향을 안 정했으면 "알려주기")
  - 내 리뷰 카드(식당명 → 지도 상세, 별점 · 메뉴 · 날짜 · 후기 · 태그, [수정] [삭제]), "리뷰 더 보기". 빈 상태 "아직 쓴 리뷰가 없어요" + [찜한 식당에서 리뷰 쓰기]
  - 설정: 저장한 위치(현재 위치 표시 → 위치 설정 모달), 알림 설정(끄기 · 11:00 · 11:30 · 12:00), 이용약관 · 개인정보 처리방침, 로그아웃(확인 → 홈), 회원 탈퇴(빨간 확인 → 홈)
  - 데스크톱 왼쪽 400px(프로필 · 취향 · 설정) / 오른쪽 리뷰. 태블릿과 모바일은 프로필 → 취향 → 리뷰 → 설정 세로
  - 메뉴바 아바타가 MY 화면에서 브랜드 테두리로 강조된다 (Figma대로)
- 리뷰 수정: `WriteReviewModal`에 수정 모드를 더했다 (`openEditReview(리뷰, 콜백)`). 기존 별점 · 메뉴 · 태그 · 후기 · 사진을 채워서 열고, 제목 "리뷰 수정" · 버튼 "수정하기" · `PATCH /reviews/{id}`. 모달은 이제 `Restaurant` 대신 식당 이름 · 사진 · 설명만 받는다
- 공용: `components/common/ConfirmDialog`(`await confirm({...})` → true/false, 위험한 동작은 빨간 버튼). 리뷰 쓰기의 "작성 중인 리뷰가 사라져요"도 이걸로 바꿨다. `components/domain/LoginRequiredState`, `components/layout/MobilePageHeader`(모바일 큰 제목), `constants/user.ts`(로그인 방식 · 맵기 이름 · 찜 종류 · 알림 시각), `lib/lunchAlertStore.ts`

**결정한 것 / 미결정과 연결된 것**
- 점심 알림: 알림 API가 미결정(API.md)이라 기기에만 저장한다. 실제 알림은 보내지 않는다
- 이용약관 · 개인정보 처리방침: 문서가 없어 "준비 중" 안내만
- 비로그인으로 찜 · MY를 열면 "로그인이 필요해요" + [로그인하기](→ `/login`, 아직 없음)
- 목 데이터는 새로고침하면 처음 상태로 돌아간다 (로그아웃 · 삭제한 리뷰도 되살아남)

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- 1440px · 402px 캡처를 Figma 26:758 · 26:880 · 37:2209 · 37:2284와 비교
- Playwright 28개 동작 모두 통과: 메뉴바 → 찜(3곳 · 카드 3개) · 한식 필터 1곳 · 찜 해제 2곳 → 되돌리기 3곳 · 카드 → 지도 · 찜 없음 빈 상태 / MY 프로필 · 숫자 · 취향 · 저장한 위치 · 아바타 강조 · 리뷰 수정(4 → 5점, 기존 값 채워짐) · 삭제 확인 → 빈 상태 · 0개 · 알림 11:30 저장 · 로그아웃 → 홈 → MY 로그인 필요 / 모바일 MY 순서 · 가로 넘침 없음 · 탭바 → 찜 행 목록
- 고친 것: 모바일 찜 화면에서 "최근 찜한 순"이 마지막 칩을 가렸다 → 모바일에서는 숨김

**남은 것**
- 토스트(알림 문구)가 템플릿의 파란 스타일이다. 브랜드 색으로 바꾸는 게 좋다
- 다음 화면: 취향 설정 · 온보딩(02 · 05) → 로그인 · 로그인 필요 팝업(09) → 검색 결과(10)

## 1단계-8 · 취향 설정 · 온보딩 (2026-10-15)

추천의 핵심 입력인 취향 화면이 없어서 홈 [취향 알려주기], MY [수정], 메뉴바 취향 버튼이 모두 404였다. 로그인(09)은 "처음 로그인하면 온보딩으로" 보내야 하므로 온보딩을 먼저 만들었다. Figma `02 Taste Settings`(19:303) · `05 Onboarding 1/4~4/4`(25:636 · 25:682 · 25:731 · 25:784) 기준.

**만든 것**
- 공용 취향 입력 (`hooks/useTasteForm.ts` + `components/domain/taste/`)
  - 상태: 못 먹는 재료 · 알레르기 · 맵기(0~4, 안 고르면 null) · 좋아하는 음식 종류, 선택지는 `GET /preferences/options`
  - `IngredientsField`: 칩 + "목록에 없는 재료 검색해서 추가"(입력 후 250ms 뒤 `GET /ingredients`, 결과 칩 또는 Enter · [+]로 추가). 검색으로 추가한 재료도 칩으로 보인다
  - `AllergiesField`: 칩 + "식당마다 조리 환경이 달라요…" 안내
  - `SpiceField`: 5단계 세그먼트(못 먹어요 ~ 아주 매운맛). 고른 칸을 다시 누르면 선택 해제
  - `CuisinesField`, 칩 묶음 `ChipGroup`(기존 `SelectChip` 사용)
- 취향 설정 `/taste` (`hooks/useTasteLogic.ts` + `components/pages/taste/`)
  - 섹션 카드 4개, 오른쪽 위 "n개 선택". 오른쪽 400px "추천 미리보기"(스크롤해도 따라옴): 추천될 메뉴 3개 + 매칭 %, "추천에서 빠지는 메뉴 예시"(예: `쌀국수(고수) · 짬뽕(갑각류 알레르기)`). 고를 때마다 200ms 뒤 다시 계산
  - [초기화](불러온 값으로, 바꾼 게 없으면 꺼짐) · [저장하기] → `PUT /me/preferences` → "취향을 저장했어요" → 이전 화면(없으면 홈)
  - 태블릿은 1단(섹션 → 미리보기). 모바일은 뒤로 버튼 + 큰 제목, 미리보기 맨 아래, [초기화][저장하기] 하단 고정(이 화면에서는 탭바를 숨김)
  - 비로그인: "로그인이 필요해요"
- 온보딩 `/onboarding` (`hooks/useOnboardingLogic.ts` + `components/pages/onboarding/`, 메뉴바 · 탭바 없는 단독 화면)
  - 1 재료 → 2 알레르기 → 3 맵기 → 4 좋아하는 음식. 진행률 n/4, 단계는 `?step=`(브라우저 뒤로가기 = 이전 단계)
  - [이전](2단계부터) · 건너뛰기(이 질문은 비우고 다음) · [다음], 마지막은 [추천 받기]만 → `completeOnboarding: true`로 저장 → 홈(맞춤 추천)
  - 오른쪽 위 "나중에 할게요" → 빈 취향 + `completeOnboarding: true` → 홈(인기 추천)
  - 이미 취향이 있으면 채워서 시작. 비로그인으로 저장하면 "로그인이 필요해요" → `/login`
  - 모바일: [이전] · 건너뛰기 · [다음] 하단 고정
- 진입 연결: 홈 취향 배너 → 온보딩, MY 취향 없음 [알려주기] → 온보딩, MY [수정] · 메뉴바 · 모바일 헤더 취향 버튼 → 취향 설정. `lib/taste.ts` `hasTaste()`로 "취향 있음" 기준을 한곳에 둠

**목 · API 변경 (API.md 반영 필요)**
- **새 API `POST /preferences/preview`** (FE가 정함): body = 취향(`Preferences`), 응답 `{ recommended: [{ menu, matchPercent }] (최대 3), excluded: [{ menu, reason }] (최대 4) }`. reason은 짧은 말(`고수` · `갑각류 알레르기` · `매운맛`). 로그인 없이 부를 수 있게 했다
  - 목 계산: 못 먹는 재료/알레르기 재료가 메뉴 재료에 있으면 제외, 맵기 "못 먹어요"면 맵기 2 이상 제외. 점수 = 기본 + 인기 + 종류 일치 + 맵기 차이 (실제 계산은 서버가 정할 것)
- 선택지를 Figma에 맞춤: 재료(오이 · 고수 · 가지 · 버섯 · 당근 · 피망 · 굴 · 내장류 · 선지 · 양고기 · 회·날것 · 깻잎), 알레르기(`갑각류 (새우·게)` · 견과류 · 땅콩 · 우유 · 달걀 · 밀 · 대두 · 생선 · 조개류 · 복숭아), 종류(… · 샐러드·건강식). 알레르기 → 메뉴 재료 대응표(`MOCK_ALLERGENS`)는 서버 메뉴 마스터가 가져야 한다
- 목 `noTaste` 시나리오: 이번 세션에 취향을 저장하면 그 값을 쓴다(온보딩 → 맞춤 추천 확인용)
- 홈 맞춤 추천 순위는 아직 고정 점수(`MOCK_MENU_SCORES`)라 새 취향으로 순서가 바뀌지는 않는다. 미리보기만 취향대로 계산된다

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- 1440px · 402px 캡처를 Figma 19:303 · 25:636 · 25:731과 비교 (레이아웃 · 칩 · 세그먼트 · 진행률 · 버튼 위치 일치)
- Playwright 47개 동작 모두 통과
  - 취향 설정: 메뉴바 → 취향 설정, 불러온 값(오이 · 고수 · 갑각류 · 매운맛 · 3개) · 미리보기 3개 · 빠지는 메뉴 / 고수 해제 → 1개 · 쌀국수 빠짐 해제 / "두" 검색 → 두부 추가 → 순두부찌개 · 김치찌개 빠짐 / 못 먹어요 → 마라탕 빠짐 / 초기화 / 가지 추가 저장 → 홈 → MY 요약 반영 → [수정] → 취향 설정 / 비로그인 로그인 필요
  - 온보딩(`noTaste`): 홈 인기 모드 → 배너 → 1/4 · [이전] 없음 · 2/4(`?step=2`) · 이전/다음 시 선택 유지 · 3/4 건너뛰기 · 4/4 [추천 받기]만 · 브라우저 뒤로 → 3/4 · [추천 받기] → 홈 맞춤 추천(매칭 %) → MY 요약 / 나중에 할게요 → 홈 인기 모드 / MY [알려주기] → 온보딩
  - 모바일: 섹션 → 미리보기 순서, [저장하기] · [다음] 하단 고정, 탭바 숨김, 가로 넘침 없음
- 고친 것: 모바일에서 한국어 설명이 단어 중간에서 줄바꿈 → `break-keep`
- 확인용 dev 서버는 사용자가 띄운 3000번을 그대로 썼고 끄지 않았다

**남은 것**
- 모바일 맵기 세그먼트에서 "아주 매운맛"이 두 줄로 보인다(402px). 문제는 없지만 Figma 모바일 시안이 생기면 맞출 것
- 토스트가 아직 템플릿의 파란 스타일
- 다음 화면: 로그인 · 로그인 필요 팝업(09) — 로그인 후 `onboardingCompleted: false`면 `/onboarding`으로 → 검색 결과(10)

## 1단계-9 · 로그인 · 로그인 필요 팝업 (2026-10-15)

찜 · 리뷰 · MY · 취향 설정의 [로그인하기]가 모두 404(`/login`)였고, 비로그인이 찜 · 리뷰 쓰기를 누르면 토스트만 떴다. 처음 로그인한 사용자를 1단계-8 온보딩으로 보내는 흐름도 여기서 잇는다. Figma `09 Login`(34:1331) · `09 Login Required`(34:1350) 기준.

**만든 것**
- 로그인 `/login?next=` (`hooks/useLoginLogic.ts` + `components/pages/login/`, 메뉴바 · 탭바 없는 단독 화면)
  - 440px 카드: 로고 · "lunchtime 시작하기" · [카카오로 계속하기](노랑) [Apple로 계속하기](검정) [Google로 계속하기](흰색) · 약관 동의 안내 · 로그인 없이 둘러보기(→ 홈). 모바일은 같은 카드를 좌우 16px로
  - 로그인 → `onboardingCompleted`가 false면 `/onboarding?next=…`, 아니면 "로그인했어요" → `next`(없으면 홈)
- 로그인 필요 팝업 (`components/domain/LoginRequiredModal`, `openLoginRequired(이유)` · `requireLogin(이유)`)
  - [카카오로 계속하기] [다른 방법으로 로그인](→ `/login?next=지금 화면`) 다음에 할게요
  - 이유별 아이콘 · 문구: 찜 · 리뷰 쓰기 · 리뷰 신고 · 메뉴 제보 · 취향 저장
  - 팝업에서 바로 로그인하면 화면 데이터(찜 여부 등)를 로그인 상태로 다시 받으려고 새로 고치고 "로그인했어요"를 보여 준다. 처음 가입이면 온보딩으로
- 연결: 찜(홈 · 지도 · 상세), 지도 상세 [리뷰 쓰기] · [이 메뉴 안 팔아요], 리뷰 ⋯ [신고하기], 취향 설정 [저장하기], 온보딩 저장 → 비로그인이면 팝업(리뷰 쓰기 모달은 아예 안 열림). 서버가 401을 주면 같은 팝업. 찜 · MY · 취향 설정의 "로그인이 필요해요" [로그인하기]는 `?next=`로 그 화면에 돌아온다
- 온보딩이 `?next=`를 이어받아, 끝내거나 "나중에 할게요"를 누르면 원래 보던 화면으로 돌아간다
- 로그인 상태: `lib/sessionStore.ts` — 앱이 뜰 때 `GET /me` 한 번으로 user/guest를 정하고(`AppProviders`), 로그인 · 로그아웃 · 탈퇴 때 바꾼다. 확인 전(unknown)이면 막지 않고 서버 401에 맡긴다
- 공용: `components/domain/SocialLoginButtons`(로그인 화면 · 팝업), `lib/socialLogin.ts`, `constants/navigation.ts`의 `withNext` · `safeNext`(앱 안 경로만 허용)

**결정한 것 / 미결정과 연결된 것**
- 소셜 SDK(카카오 JS SDK · Sign in with Apple · Google Identity)는 아직 붙이지 않았다. `getProviderToken()`이 목에서는 가짜 토큰을 주고, 실서버 모드에서는 "아직 연결되지 않았어요"로 끝난다. 웹뷰 브리지 방식과 로그인 방식이 정해지면 여기만 바꾸면 된다 (plan.md 미결정)
- 목 로그인 상태를 기기에 남긴다(`localStorage` `lunchtime.mockAuth` = in/out). 그래서 로그아웃하고 새로 고쳐도 비로그인이 유지된다. **처음 상태(로그인)로 돌리려면 이 값을 지우면 된다.** `guest` 시나리오여도 로그인하면 로그인 상태가 된다
- 목 시나리오 `newUser` 추가: 로그인하면 처음 가입한 사용자(`isNewUser: true`, 온보딩 전, 취향 없음)
- 위치 저장의 401은 지금처럼 토스트로 둔다 (위치 모달 위에 팝업이 겹쳐서)

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- 1440px · 402px 캡처를 Figma 34:1331 · 34:1494와 비교 (카드 · 버튼 색 · 팝업 위치 일치)
- Playwright 28개 동작 모두 통과: 비로그인 찜 → 팝업(찜 문구) · 다음에 할게요 → 닫힘 · 찜 안 바뀜 / [리뷰 쓰기] → 팝업(리뷰 문구), 리뷰 모달 안 열림 / [다른 방법으로 로그인] → `/login?next=%2Fmap…` · 버튼 3개 · 메뉴바 없음 → 카카오 → 원래 지도 · 로그인했어요 · 찜이 팝업 없이 동작 / 팝업 카카오 → 새로 고침 · 같은 화면 · 로그인했어요 / `newUser`: Apple → 온보딩(next 유지, 취향 비어 있음, 단계 이동에도 유지) → 나중에 할게요 → 찜 화면 / 둘러보기 → 홈 / MY 로그아웃 → 새로 고쳐도 비로그인 → [로그인하기] → Google → MY / 취향 설정 [로그인하기] → next / 모바일 로그인 가로 넘침 없음 · 모바일 팝업 화면 안
- 확인용 dev 서버(3000)와 Chrome은 확인 후 껐다

**API.md 반영 필요**
- 없음 (기존 `POST /auth/login` · `GET /me`만 썼다). 소셜 토큰을 앱(웹뷰)이 어떻게 넘길지는 미결정으로 남음

**남은 것**
- 리뷰 쓰기 모달을 연 뒤 세션이 만료돼 401이 나면 지금은 토스트 안내 (드문 경우)
- 다음 화면: 검색 결과(10) → 토스트 브랜드 스타일 → 어드민 화면


## 1단계-10 · 이메일 계정 (가입 · 로그인 · 비밀번호 재설정) (2026-10-15)

**결정**: 로그인 방식을 확정했다 (plan.md 미결정 → 결정).
- iOS 앱스토어(웹뷰)에 내기로 했다. App Store Guideline 4.8 때문에 Apple 로그인은 유지한다. Apple 로그인은 별도 심사 없이 개발자 콘솔 설정만 하면 된다
- 여기에 **자체 이메일 계정을 추가**한다. 카드 · 금융 같은 민감 정보가 없는 서비스라 부담이 작다. 자체 이메일 가입은 4.8의 "이메일 숨기기" 조건을 만족하기 어려워 Apple을 대신할 수 없다 → 대체가 아니라 추가
- 가입할 때 이메일 인증번호 6자리로 본인 이메일을 확인하고, 비밀번호 재설정까지 앱 안에서 끝낸다 (사용자 선택)
- 배포 전에 Apple 가이드라인 최신본을 다시 확인할 것

**만든 것** (Figma 시안 없음 — 09 Login 카드 스타일을 그대로 따름)
- `/login`: 소셜 버튼 아래 **[이메일로 계속하기]** 한 칸(흰 유리 버튼 + 메일 아이콘) → `/login/email?next=`
- 이메일 로그인 `/login/email` (`hooks/useEmailLoginLogic`)
  - 이메일 · 비밀번호(보기 토글) → [로그인]. 대소문자 · 앞뒤 공백 정리
  - 틀리면 "이메일 또는 비밀번호가 맞지 않아요" (어느 쪽인지 밝히지 않음), 5번 연속 실패면 잠금
  - "비밀번호를 잊었어요" · "이메일로 가입하기"(입력한 이메일을 넘김)
  - 로그인 후 소셜과 같이 `next`, 온보딩 전이면 온보딩
- 이메일 가입 `/signup` (`hooks/useSignupLogic`)
  - 1/2: 이메일 → [인증번호 받기] → 6자리(숫자만) + 남은 시간 10:00, 60초 뒤 [다시 받기], 이메일 [변경]. 이미 가입된 이메일이면 "로그인해 주세요"
  - 2/2: 비밀번호 · 확인 · 이름(리뷰에 보임, 2~12자) → 가입 → "○○님, 반가워요!" → 온보딩(`next` 유지)
- 비밀번호 재설정 `/password-reset` (`hooks/usePasswordResetLogic`): 이메일 → 인증번호 → 새 비밀번호 · 확인 → 이메일 로그인(이메일 채워 둠). 가입 안 된 이메일도 같은 화면으로 진행(계정 존재 여부 숨김)
- MY 프로필에 "이메일 로그인" 표시 (`PROVIDER_LABELS.email`)
- 공용
  - `components/domain/auth/`: `AuthCard`(로그인 카드 틀, 로그인 화면도 이걸로 바꿈), `AuthScreen`(데스크톱 가운데 / 모바일 위에서부터 — 키보드에 버튼이 안 가리게), `AuthTextField` · `PasswordField`, `EmailCodeStep`
  - `hooks/useEmailVerification`(인증번호 받기 · 타이머 · 재전송 · 확인 → `verificationToken`, 가입 · 재설정 공용)
  - `lib/validation.ts`(이메일 · 비밀번호 · 이름 · 인증번호 검사, 화면과 목이 같이 씀)
  - `constants/navigation.ts` `afterLoginRoute`(온보딩 전이면 온보딩, 아니면 next)
- 타입: `SocialProvider`(kakao · apple · google)와 `LoginProvider`(= 소셜 + email)를 나눴다
- `lib/api/client.ts`: `/auth/*`의 401(비밀번호 틀림 등)은 토큰 재발급을 시도하지 않는다

**규칙**
- 비밀번호: 8~64자, 영문 + 숫자
- 이름: 2~12자
- 인증번호: 6자리 숫자, 10분 유효, 재전송 60초, 5번 틀리면 다시 받기
- 로그인: 5번 연속 실패 시 `RATE_LIMITED`

**API.md 반영 필요** (FE가 정함)
- `POST /auth/email/code` `{ email, purpose: "signup" | "reset" }` → `{ expiresInSec, resendAfterSec }`. signup + 가입된 이메일이면 409 `EMAIL_TAKEN`. reset은 계정이 없어도 같은 응답
- `POST /auth/email/verify` `{ email, purpose, code }` → `{ verificationToken }`. 400 `INVALID_CODE` · `CODE_EXPIRED`
- `POST /auth/email/signup` `{ email, password, name, verificationToken }` → `LoginResponse`(`isNewUser: true`, `onboardingCompleted: false`)
- `POST /auth/email/login` `{ email, password }` → `LoginResponse`. 401 `INVALID_CREDENTIALS`, 429 `RATE_LIMITED`
- `POST /auth/email/password-reset` `{ email, password, verificationToken }` → 204
- `User.provider`에 `"email"` 추가. 에러 코드 4개 추가 (`EMAIL_TAKEN` · `INVALID_CODE` · `CODE_EXPIRED` · `INVALID_CREDENTIALS`)
- 백엔드에서 정할 것: 비밀번호 해시(bcrypt/argon2), 인증 메일 발송 서비스, 시도 제한 저장소

**목**
- 인증번호는 항상 `123456`. 목일 때만 입력칸 아래에 "목 서버: 인증번호는 123456이에요"를 보여 준다 (콘솔에도 찍음)
- 기본 계정 `test@lunchtime.dev` / `lunch1234` (지민)
- 가입한 계정은 `localStorage` `lunchtime.mockAccounts`에 남아 새로 고쳐도 로그인할 수 있다. 지금 로그인한 이메일 계정은 `lunchtime.mockAccount`
- 새 계정은 취향 · 찜 없이 시작한다. 리뷰 · 위치 등 나머지는 목 사용자 데이터를 함께 쓴다 (목 한계)

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- Playwright 41개 동작 모두 통과
  - 로그인 화면 [이메일로 계속하기] → next 유지 / 형식 오류 · 틀린 비밀번호 같은 안내 · 비밀번호 보기 · 대문자 + 공백 이메일로 로그인 → next / 5번 실패 잠금
  - 가입: 가입된 이메일 안내 · 타이머 · 이메일 잠김 · 다시 받기 60초 비활성 · 목 안내 · 숫자만 · 6자리 안내 · 틀린 인증번호 → 2/2 → 비밀번호 규칙 · 확인 불일치 · 이름 길이 → 가입 → 온보딩(next=/my) → MY "새점심 · 이메일 로그인" · 취향 · 찜 0 → 새로 고쳐도 유지 → 로그아웃 → 다시 로그인
  - 재설정: 이메일 채움 → 인증 → 새 비밀번호 → 이메일 로그인(이메일 채움) · 옛 비밀번호 실패 · 새 비밀번호 성공 / 없는 이메일도 같은 진행
  - 모바일 4개 화면 가로 넘침 없음, 이메일 로그인 [로그인] · 가입 [확인]이 키보드(약 340px) 위
- 고친 버그: 인증번호 검사 정규식이 셸 heredoc을 거치며 `\d`가 `d`로 바뀌어 모든 번호가 "6자리 아님"이었다 → 정규식 없이 길이 + 숫자 검사로 바꿈
- 확인용 dev 서버(3000)와 Chrome은 확인 후 껐다

**남은 것**
- MY에서 비밀번호 바꾸기 (이번 범위 밖)
- plan.md에 남긴 로그인 후속 미결정: 어드민 로그인 방식, 계정 연결(같은 사람 다른 방식), 카카오 이메일 동의항목, 가입 시 개인정보 동의 분리, 메일 발송 서비스
- 다음 화면: 검색 결과(10) → 토스트 브랜드 스타일 → 어드민


## 1단계-11 · 검색 결과 (2026-10-15)

메뉴바 검색창이 가는 `/search`가 404였다. Figma `10 Search Results`(35:1433) 기준. API는 이미 있는 `GET /search`를 그대로 쓴다.

**만든 것**
- 검색 결과 `/search?q=&type=` (`hooks/useSearchLogic.ts` + `components/pages/search/`)
  - 제목 "'순두부' 검색 결과" + "역삼동 반경 1km", 탭: 전체 · 메뉴 n · 식당 n
    - 탭은 `?type=`(menu · restaurant)이고 `router.replace`라서 뒤로가기 기록은 안 쌓인다
    - 개수를 보여야 해서 API는 `type=all` 한 번만 부르고, 탭은 화면에서 나눈다
  - 메뉴: 메뉴 카드(매칭 %), 누르면 `/map?menuId=`
  - 식당: 식당 행(근거 줄 · 광고 배지 · 찜), 표시만 하는 "거리순"
    - 전체 탭은 4곳만 먼저 보이고 "식당 n곳 더 보기", 식당 탭은 전부
    - 행을 누르면 지도 상세(`/map?menuId=…&placeId=…`, 메뉴가 없으면 `?q=`)
  - 오른쪽 400px 지도 미리보기(결과 핀) + [지도에서 결과 보기] (스크롤해도 따라온다)
  - 상태
    - 검색어 없음: "메뉴나 식당을 검색해 보세요" + 최근 검색(기기에 저장, 8개, 칩별 지우기)
    - 그 밖에 로딩 · 오류, 결과 0건("'피자' 검색 결과가 없어요" + [동네 바꾸기]), 위치 없음
  - 찜은 기존 `useFavoriteToggle`라서 비로그인이면 로그인 필요 팝업이 뜬다
- 메뉴바 검색창 `components/layout/NavSearchField`: 검색 화면에서는 지금 검색어를 채우고 브랜드 테두리(Figma 35:1446). `useSearchParams` 때문에 Suspense로 감쌌다
- 태블릿(768~1023px): 메뉴바에 검색 아이콘만 있으므로 화면 안에 검색창을 두고, 지도 미리보기는 뺀다
- 모바일: 뒤로 + 검색창(검색어 없으면 자동 포커스) → 제목 · 탭 → [지도에서 결과 보기] → 메뉴(가로 스크롤) → 식당. 탭바는 그대로
  - 홈 모바일 헤더에 검색 버튼 추가 (모바일에는 메뉴바 검색창이 없어 진입점이 없었다, 시안 외)
- 공용: `lib/recentSearches.ts`(최근 검색, useSyncExternalStore로 읽어 서버 렌더와 어긋나지 않게), `SearchBoxSection`(모바일 · 태블릿 공용 검색창)

**목 변경**
- `GET /search`의 식당 결과: 검색어에 맞는 메뉴가 있으면 그 메뉴를 파는 식당(근거 순서) → 이름 · 대표 메뉴 · 카테고리가 맞는 식당 순으로 합친다. 예전에는 이름 매칭만 해서 "순두부" 검색에 근거 줄이 없었다

**결정한 것**
- 지도로 넘길 때 맞는 메뉴가 있으면 첫 메뉴의 `menuId`로 넘긴다 (지도 칩 · 근거가 살아 있게). 없으면 `q`로
- 식당 결과 페이지 나눔은 API에 cursor가 없어 한 번에 받고 화면에서 4곳 / 전부로 나눈다. 결과가 많아지면 API.md에 `cursor` 추가 검토

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- 1440px · 402px 캡처를 Figma 35:1433과 비교 (제목 · 탭 · 메뉴 카드 · 식당 목록 · 지도 패널 · 메뉴바 검색창 강조 일치. 목에 순두부 메뉴가 하나라 메뉴 카드는 1개)
- Playwright 31개 동작 모두 통과
  - 데스크톱
    - 메뉴바 검색 → `/search?q=순두부` · 제목 · 반경 · 검색창 유지 · 브랜드 테두리
    - 탭 개수(메뉴 1 · 식당 6) · 메뉴 카드 매칭 % · 전체 탭 4곳 · 근거 줄 · 지도 미리보기 · 더 보기 → 6곳
    - 메뉴 탭 / 식당 탭 전환
    - 이동: 메뉴 카드 → 지도 · 식당 행 → 지도 상세 · 지도에서 결과 보기
    - 식당 이름만 맞는 검색은 `?q=`로 지도
    - 결과 없음 · 검색어 없음 · 최근 검색 추가 · 지우기 · 비로그인 찜 → 로그인 팝업
  - 태블릿: 화면 안 검색창 · 지도 미리보기 숨김
  - 모바일: 홈 검색 버튼 → 자동 포커스 → 검색 → 결과 · 지도 버튼 · 탭바 · 가로 넘침 없음
- 테스트 메모: 식당 행이 `role="button"`이라 안쪽 찜 버튼은 행 안에서 찾아야 Playwright가 잡는다. 화면 동작에는 문제없지만 접근성상 "버튼 안 버튼" 구조라 나중에 행을 링크/버튼으로 쪼개는 걸 검토
- 확인용 dev 서버(3000)와 Chrome은 확인 후 껐다

**API.md 반영 필요**
- `GET /search`의 식당 결과에 "메뉴를 파는 식당(근거 포함)도 포함, 근거 순서 → 이름 매칭" 규칙 명시. `menuEvidence`가 채워진다

**남은 것**
- 식당 행의 "버튼 안 버튼" 접근성 정리 (홈 · 지도 · 찜 · 검색 공통)
- 토스트가 아직 템플릿의 파란 스타일
- 다음: 어드민 화면(A1 유저 · A2 광고 · A3 메뉴 · A4 신고) 또는 2단계 백엔드


## 1단계-12 · 어드민 (1/2): 틀 · 어드민 로그인 · 유저 관리 · 리뷰 신고 (2026-10-15)

어드민 4개 화면을 두 번에 나눠 만든다(사용자 선택). 이번에는 틀 · 로그인 · A1 유저 관리(27:834) · A4 리뷰 신고(30:920). 메뉴 관리(A3) · 광고 식당 고정(A2)은 다음 단계.

**결정**
- 어드민 로그인은 사용자 로그인과 **분리**한다 (plan.md 미결정 → 결정)
  - `/admin/login`에서 아이디 · 비밀번호 + OTP 6자리로 로그인
  - 어드민 전용 계정 · 토큰을 쓰고, 사용자 토큰으로는 `/admin/*`을 부를 수 없다
  - 이유: 운영자의 소셜 계정이 털려도 어드민 권한까지 넘어가지 않게
- 어드민은 데스크톱 전용이라 화면마다 Desktop/Mobile을 나누지 않고 하나만 둔다
  - 1024px 미만에서는 사이드바가 위쪽 가로 메뉴가 되고, 표는 가로 스크롤

**만든 것**
- 어드민 로그인 `/admin/login?next=` (`hooks/useAdminLoginLogic`)
  - 카드는 사용자 로그인과 같은 스타일(`AuthCard` 재사용, Figma 시안 없음)
  - OTP는 숫자 6자리만 받는다. 틀리면 "아이디, 비밀번호 또는 OTP가 맞지 않아요"로 어느 칸인지 밝히지 않고, 5번 실패하면 잠긴다
  - 로그인 후 `next`로 가는데, 어드민 경로만 허용한다
- 어드민 틀 `app/admin/(console)/layout.tsx` + `components/layout/admin/AdminSidebar`
  - 들어오면 `GET /admin/me`로 확인하고, 안 되면 로그인 화면으로 보낸다(로딩 중에는 본문을 그리지 않음)
  - 사이드바 248px: 로고 + ADMIN 배지, 메뉴 4개
    - 광고 · 메뉴는 "준비 중"으로 막아 둠
    - 리뷰 신고에는 처리 대기 배지가 붙고 처리하면 바로 줄어든다
  - 사이드바 아래: 운영자 이름 · "서비스로 가기 ↗" · 로그아웃(확인 창)
  - `/admin`은 `/admin/users`로 보낸다
- 유저 관리 `/admin/users?q=&status=&page=` (`hooks/useAdminUsersLogic`)
  - 요약 4개: 전체 · 이번 주 신규(지난주 대비 %) · 오늘 활성 · 이용 정지
  - 검색(이름 · 이메일, 300ms 디바운스, 첫 페이지로), 상태 필터(전체 · 정상 · 정지 · 탈퇴)
  - 표: 유저(이니셜 · 이름 · 가린 이메일) · 로그인 · 가입일 · 최근 접속 · 리뷰 · 찜 · 받은 신고(있으면 빨강) · 상태 배지 · [정지]/[정지 해제]/—
  - 페이지 넘김: 20명씩 ‹ 1 2 3 … 끝 ›
  - [정지]는 정지 창(`SuspendUserDialog`)을 연다. 기간(3일 · 7일 · 30일 · 무기한)과 사유(필수, 200자)를 받는다. [정지 해제]는 확인 창
  - [CSV 내보내기]는 지금 상태 필터 그대로 내려받는다. 엑셀에서 한글이 깨지지 않게 BOM을 붙였다
- 리뷰 신고 `/admin/reports?status=&id=` (`hooks/useAdminReportsLogic`)
  - 요약: 처리 대기(빨강) · 오늘 접수 · 이번 달 처리 · 삭제 비율. 탭: 처리 대기 n · 처리 완료 · 전체
  - 왼쪽 목록: 가장 많은 사유 배지(욕설·비방 빨강 · 광고·홍보 브랜드 · 나머지 회색) · 식당 · 신고 n건 · 접수 시각 / 리뷰 한 줄
  - 오른쪽 상세(400px)
    - 사유별 건수, 리뷰 원문(작성자 · 별점 · 식당 · 날짜), 신고자 메모, 작성자 이력(리뷰 · 받은 신고 · 삭제된 리뷰)
    - "작성자 7일 이용 정지도 함께 처리" 체크: 받은 신고가 3건 이상이면 처음부터 켜져 있다
    - [신고 기각 (리뷰 유지)] / [리뷰 삭제](빨강 확인 창)
  - 처리하면 다음 건으로 넘어가고 요약 · 배지가 갱신된다. 처리 완료 건은 버튼 대신 결과를 보여 준다
- 공용
  - `components/domain/admin/AdminWidgets`(페이지 머리 · 요약 카드 · 상태 배지 · 페이지 넘김)
  - `SuspendUserDialog`(`askSuspendUser`), `lib/adminStore`(어드민 로그인 상태 · 배지)
  - `lib/format`: `formatDotDate`("2026.09.03"), `formatMonthDayTime`("10.08 11:42")
- API 클라이언트
  - `request(..., { auth: "admin" })`면 어드민 토큰을 싣고, 사용자 토큰 재발급은 하지 않는다
  - `text: true`면 CSV 같은 텍스트 응답을 받는다
  - 어드민 토큰은 `localStorage` `lunchtime.adminAccessToken`(실서버에서는 httpOnly 쿠키 권장)

**목**
- `lib/api/mock/adminData.ts` · `adminHandlers.ts`: 사용자 쪽 목과 상태를 나눴고, 신고에서 리뷰를 지울 때만 사용자 쪽 리뷰를 함께 지운다
- 어드민 계정 `admin` / `admin1234` / OTP `123456`. 목일 때만 로그인 화면에 안내
- 유저 48명: Figma 7명 + 규칙대로 만든 41명. 신고 9건: 처리 대기 7 + 처리 완료 2. "이번 달 처리"에는 예전 처리 건(39건)을 더한다

**API.md 반영 필요** (FE가 정함)
- 어드민 인증
  - `POST /admin/auth/login` `{ loginId, password, otp }` → `{ accessToken, refreshToken, admin }`
  - `POST /admin/auth/logout`, `GET /admin/me` → `{ id, loginId, name }`
  - 어드민 전용 토큰이고, 사용자 토큰으로 `/admin/*`을 부르면 401. API.md의 "`role: admin` 토큰만" 문구를 이걸로 바꿀 것
- `GET /admin/users` 응답 한 줄: `id, name, maskedEmail, provider, createdAt, lastActiveAt, reviewCount, favoriteCount, reportCount, status, suspendedUntil`. 목록은 `{ items, total, page, size }`
- `GET /admin/users/summary`: `{ total, newThisWeek, newWeekChangePercent, activeToday, suspended }`
- `GET /admin/reports/summary`: `{ pending, today, resolvedThisMonth, deleteRatePercent }`
- `ReportGroup`에 `status`(pending · resolved) · `resolution`(dismissed · deleted · null) · `lastReportedAt` 추가
- `export.csv`: 엑셀 호환 BOM은 FE가 붙인다(서버가 붙여도 됨)

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- 1440px 캡처를 Figma 27:834 · 30:920과 비교 (사이드바 · 요약 카드 · 표 열 · 상태 배지 · 신고 목록 · 상세 패널 일치)
  - 다른 점: 로그인 방식 표기가 Figma는 "구글 · 애플", 앱은 "Google · Apple"(MY와 같은 상수)
  - 다른 점: 메뉴 · 광고 사이드바 항목은 이번엔 "준비 중"
- Playwright 45개 동작 모두 통과
  - 로그인: 비로그인 → 로그인(next 유지) · OTP 숫자만 · 6자리 안내 · 틀린 OTP 같은 안내 · 로그인 → next
  - 리뷰 신고
    - 사이드바 배지 7 · 요약 · 목록 7건 · 첫 상세(사유 · 이력 · 정지 기본 체크) · 선택 → `?id=`
    - 기각 → 6건 · 배지 6
    - 삭제(확인 창에 정지 안내) → 삭제 · 정지 안내 · 배지 5 · 처리 완료 탭 4건 · 결과 표시
  - 유저 관리
    - 20명 · 첫 줄 값 · 정지 / 탈퇴 버튼 · 요약 카드
    - 3쪽 · 검색(`gmail`, 1쪽으로) · 정지 필터
    - 정지 해제 → 필터에서 빠짐 · 정지 사유 필수 · 30일 정지 · CSV(파일명 · BOM · 헤더)
  - 로그아웃 → 토큰 지움 → 다시 들어가면 로그인 요구
  - 사용자(이메일)로 로그인해도 어드민은 로그인 요구 · 5번 실패 잠금
- 고친 것: 목 유저 가입일이 지난주에 하나도 없어 "지난주 대비"가 안 나왔다 → 목 데이터 날짜 조정
- 확인용 dev 서버(3000)와 Chrome은 확인 후 껐다

**남은 것**
- 다음 단계: 메뉴 관리(A3 29:891 · 메뉴 추가/편집 · CSV 가져오기) · 광고 식당 고정(A2 28:849 · 등록 패널 · 카카오 장소 검색)
- 어드민 리프레시 토큰 · 세션 만료 처리(실서버 때), 감사 로그 화면은 범위 밖

## 문서 정리 · plan.md · API.md 반영 (2026-10-15)

1단계-1 ~ 1단계-12에서 "API.md 반영 필요"로 적어 둔 것과 화면을 만들며 정한 동작을 두 문서에 옮겼다.

**API.md**
- 공통 · 권한: 사용자 토큰과 어드민 토큰을 따로 발급한다 (`role: admin` 문구 교체)
- 인증
  - 이메일 계정 API 5개(`/auth/email/code` · `verify` · `signup` · `login` · `password-reset`)와 요청 · 응답 · 규칙 표를 추가했다
  - `provider`에 `email`을 더했고, 로그인 API의 401은 토큰을 재발급하지 않는다
- 취향 · 위치
  - `GET /preferences/options` · `GET /ingredients` · `GET /me/locations` · `GET /locations/search` 응답 모양을 적었다
  - 선택지 값이 곧 표시 이름이고, 알레르기 → 재료 대응은 서버 사전이 가진다
  - 새 API `POST /preferences/preview`를 추가했다. `spiceLevel`은 건너뛰면 null
- 추천: 응답 필드를 항상 넣는다(`popularRank` · `suggestRadiusM` 포함). 이유 `type`에 `popular` 추가
- 식당
  - `GET /restaurants` 응답에 `menu` 추가. 광고는 `menuId` 검색에서만 붙인다
  - `GET /me/favorites`에 `lat` · `lng` 추가, 쓰지 않는 `openNow` 쿼리는 뺐다("영업 중" 필터 없음 결정과 맞춤)
  - `GET /search` 응답 모양과 식당 결과 규칙(메뉴 근거 식당 → 이름 매칭)을 적었다
- 리뷰: `POST /uploads/review-photos` 요청 · 응답
- 어드민
  - "어드민 인증" 절 추가(`/admin/auth/login` · `refresh` · `logout`, `/admin/me`, 토큰 · 실패 · 기록 규칙)
  - 목록 응답 `{ items, total, page, size }`, 유저 요약 · `AdminUser`, CSV 조건, 신고 요약 · 정렬, 처리 응답
- 공통 객체: `User.provider`, `SavedLocation.address`, `ReportGroup.status · resolution · lastReportedAt`, `AdminUser`
- 에러 코드 4개 추가: `EMAIL_TAKEN` · `INVALID_CODE` · `CODE_EXPIRED` · `INVALID_CREDENTIALS`
- 미결정에 추가: 인증 메일 발송, 계정 합치기, 소셜 토큰 전달 방식, `totalNearbyCount`. Apple 로그인 문장은 "결정"으로 고침

**plan.md**
- 화면별로 구현하며 정한 동작을 적었다
  - 홈 모바일 상단: 검색 버튼, 위치 카드 문구
  - 온보딩: `?step=`, 건너뛰기, 진입점, `next`
  - 취향 설정: 미리보기 이유, 맵기 해제, 초기화 · 저장, 선택지 목록
  - 지도: 1km 칩, 다시 검색, 공유 링크
  - 찜: 되돌리기 · 거리
  - MY: 점심 알림 기기 저장
  - 로그인: 이메일 3화면 규칙, `next`, 팝업 대상에 메뉴 제보 추가
  - 검색 결과: 탭 개수 · 4곳 + 더 보기 · 결과 규칙 · 최근 검색 · 태블릿 · 모바일
- 어드민
  - "어드민 로그인" 절 추가
  - 유저 관리: 정지 기간 · 사유, CSV 조건
  - 리뷰 신고: 정지 기본값 · 처리 후 동작
- 반응형: 모바일 상단 버튼 · 탭바 없는 화면, 검색 결과 · 로그인 행 추가, 어드민 좁은 폭 동작
- 결정된 사항 표에 "로그인" · "어드민 로그인" 행 추가
- 로그인 절에 채팅 답변 문장이 붙어 있던 3줄(인증번호 123456 · 기본 계정 · 계정 유지)은 "개발용 목 서버(실서비스와 무관)" 한 줄로 정리했다

**코드**
- 어드민 CSV 내보내기가 상태만 넘기던 것을 검색어도 넘기게 고쳤다(문서와 맞춤). `tsc` · `eslint` 통과


## 1단계-13 · 어드민 (2/2): 메뉴 관리 · 광고 식당 고정 (2026-10-15)

어드민 나머지 두 화면. Figma `A3 메뉴 관리`(29:891) · `A2 광고 식당 고정`(28:849, 등록 패널 28:1285). 사이드바의 "준비 중"을 없앴다.

**결정 · 스펙 변경**
- `Menu`에 **`cuisine`(종류)** 을 추가했다
  - Figma A3의 "카테고리" 열은 한식 · 아시안 같은 종류이고, 광고 패널은 찌개류 같은 세부 카테고리도 쓴다. 기존 `Menu`에는 `category` 하나뿐이었다
  - `cuisine` = 종류(취향 "좋아하는 음식 종류"와 같은 값), `category` = 세부 카테고리
  - 목 메뉴 10개에 채웠고, 취향 미리보기 · 생성 식당이 쓰던 "카테고리 → 종류" 임시 대응표를 없앴다
- 광고 반경은 기능명세대로 500m · 1km · 2km · 3km만 받는다. Figma 표의 "1.5km"는 목에서 2km로 맞췄다
- 광고 취소는 지우지 않고 `canceled: true`로 바로 종료한다(기록 유지)
- 재등록은 원래 식당을 복사해 새 광고를 만든다. 패널에는 조건이 채워지고, 기간은 오늘부터 같은 길이, 결제는 다시 입금 대기

**만든 것**
- 메뉴 관리 `/admin/menus?q=&filter=&page=` (`hooks/useAdminMenusLogic`)
  - 필터 칩: 전체 n · 한식 · 중식 · 일식 · 양식 · 아시안 · 숨김 n. 검색은 메뉴 이름 · 재료(300ms)
  - 표(Figma 열 너비): 메뉴 · 카테고리(종류) · 주요 재료 / 맛 / 어울리는 날씨 태그(날씨 없으면 "상관없음") · 카카오 키워드 · 7일 추천 · 노출/숨김 · [편집]
  - 20개씩 페이지 넘김
  - [메뉴 추가] · [편집] → 오른쪽 460px 패널(`MenuEditorDrawer`, Figma 시안 없음 — A2 패널 스타일)
    - 이름 · 종류 · 세부 카테고리 · 맛 · 맵기 5단계 · 날씨 · 카카오 키워드 · 카카오 카테고리 · 앱 추천에 노출
    - 주요 재료: 사전 자동완성, Enter로 추가. 사전에 없는 재료는 주황색 + "취향 필터에 걸리지 않을 수 있어요"
    - 같은 이름은 서버가 막는다
  - CSV: [CSV 양식 내려받기] · [CSV 가져오기](같은 이름은 덮어쓰기). 실패한 줄이 있으면 "n줄을 가져오지 못했어요 · 새로 n · 고침 n · 4번째 줄: 이유" 창
- 광고 식당 고정 `/admin/sponsored` (`hooks/useAdminSponsoredLogic`)
  - 요약 4개: 진행 중 · 이번 달 광고 매출 · 평균 클릭률 · 입금 대기
  - 표(Figma 열 너비): 식당(동네 · 장소 ID) · 노출 메뉴·카테고리 · 반경 · 기간 · 순위 · 노출/클릭 · 광고료 + 결제 상태 · 상태(진행 중 · 예약 · 종료, 취소됨) · [수정]/[재등록]. 진행 중 → 예약 → 종료 순
  - [광고 고정 추가] / [수정] / [재등록] → 같은 패널(`SponsoredEditorDrawer`, Figma 28:1285)
    - 식당: 카카오 장소 검색(250ms) → 선택 카드. 수정 · 재등록에서는 바꿀 수 없음
    - 노출 메뉴 · 카테고리 후보: 식당 종류의 메뉴 + 세부 카테고리 + "한식 전체", 다른 메뉴 찾기
    - 반경 · 기간(날짜) · 영업시간(끄기 가능) · 브레이크(있을 때만) · 휴무일(월~일 · 공휴일) · "영업 중 · 21:00까지" 안내 · 우선순위 · 광고료(쉼표) · 결제 상태
    - 수정 패널 아래 "광고 취소"(빨간 확인 창)
- 공용
  - `AdminDrawer`(오른쪽 패널) · `DrawerField` · `AdminTag`, `constants/admin.ts`(종류 · 맛 · 날씨 · 반경 · 휴무일 · 광고 상태)
  - `ConfirmDialog`에 `hideCancel`(버튼 하나 알림)과 줄바꿈 표시를 추가했다
  - 어드민 상태 배지에 brand 색을 추가했다
- API 클라이언트: `form`(multipart) 옵션. 목 라우터는 비동기 핸들러(파일 읽기)를 기다린다
- 목: `adminCommon`(공용 · 토큰 확인 · 페이지) · `adminCatalogData`(메뉴 24 = 사용자 앱 10 + 어드민 14, 숨김 3 / 장소 9 / 광고 4) · `adminCatalogHandlers`
  - 광고 날짜는 오늘 기준이라 진행 중 · 예약 · 종료가 늘 섞여 보인다
  - 어드민에서 바꾼 메뉴 · 광고는 사용자 앱 목 추천에는 반영되지 않는다(목 한계, 백엔드에서 연결)

**API.md · plan.md**
- API.md
  - 메뉴 관리: `cuisine` 필터, 응답 `counts`, 검사 규칙, CSV 양식 · 결과 모양
  - 광고: 목록 · 요약 · 장소 검색 모양, 검사, `targetCategories` 뜻, 수정 · 재등록 · 취소 규칙
  - 공통 객체: `Menu.cuisine`, `Sponsored.canceled · targetMenuNames`
- plan.md: 메뉴 관리(종류와 세부 카테고리, 필터, 편집 패널, CSV) · 광고(후보, 영업시간, 수정 · 재등록 · 취소) 동작

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- 1440px 캡처를 Figma 29:891 · 28:849와 비교 (표 열 · 태그 · 필터 칩 · 요약 · 패널 필드 순서 일치)
- Playwright 41개 동작 모두 통과
  - 메뉴 관리
    - 전체 24 · 숨김 3 · 첫 줄 값 · 20개 + 페이지 · 상관없음 태그
    - 한식 필터 · 숨김 3 · 재료 검색 '두부'
    - 추가: 빈 값 안내 · 자동완성 · 사전 밖 재료 경고 · 추가 → 25 · 같은 이름 서버 안내
    - 숨김 메뉴 노출로 편집 → 숨김 2
    - 양식 내려받기 · CSV(새로 1 · 고침 1 · 4번째 줄 실패) → 26
  - 광고
    - 4건 순서 · 요약 · 수정/재등록 버튼 · 행 값
    - 추가: 식당 안내 · 장소 검색 · 후보(한식 전체) · 광고료 쉼표 · 기간 거꾸로 안내 · 고정 → 목록 · 요약 3곳
    - 수정(식당 고정 안내) · 취소 → 종료 · 취소됨 · 재등록
    - 재등록: 시작일 오늘 · 조건 복사 → 2건
- 회귀: 1단계-12 어드민 점검 45개 다시 통과 (공용 목 정리 후)
- 고친 것
  - **디바운스 검색이 필터를 덮던 버그**(유저 · 메뉴 관리): 필터 칩을 누르고 300ms 안에 검색어를 치면 늦게 불린 검색이 예전 주소로 필터를 되돌렸다 → 지금 주소(`window.location.search`)에서 읽게 고침
  - 패널 필드 이름 중복: 그룹 라벨과 입력칸 라벨이 같아 스크린리더 · 테스트가 헷갈렸다 → 입력칸 하나짜리는 `<label htmlFor>`로 연결
  - 광고 패널 시간 입력칸이 좁아 값이 잘렸다 → 아이콘 중복을 빼고 영업시간 · 브레이크를 한 줄씩
  - "상관없음" 태그가 칸 너비만큼 늘어나던 것
- 확인용 dev 서버(3000)와 Chrome은 확인 후 껐다

**남은 것**
- 어드민 메뉴 · 광고를 사용자 앱 추천 · 지도에 연결하는 건 백엔드 단계에서 (목은 따로 움직임)
- 메뉴 이미지 올리기(사진 저장소 미결정), 메뉴 제보 확인 화면(`/admin/menu-reports`)은 범위 밖
- 1단계(프론트 + 목) 화면은 모두 만들었다. 다음은 토스트 브랜드 스타일 · 식당 행 접근성 정리 같은 마무리, 또는 2단계 백엔드


## 1단계-14 · 1단계 마무리 (2026-10-16)

2단계 백엔드 전에 "남은 것"에 쌓인 프론트 마무리를 했다(사용자 선택: 마무리 후 백엔드). 백엔드 스택은 아직 미정이라, 마무리 뒤 비교 자료로 정하기로 했다.

**만든 것 · 고친 것**
- 토스트 브랜드 스타일 (`components/ui/notify/`)
  - 흰 유리 알약 + 성공은 브랜드 색 체크, 오류는 빨간 느낌표(lucide). 긴 문구는 줄바꿈(최대 480px)
  - 위치: 데스크톱은 메뉴바 아래(140px), 모바일은 상태바 아래
  - 기본 노출 1초 → 2.5초, "찜을 해제했어요 [되돌리기]"는 5초
  - `role="status"` / 오류는 `role="alert"`
  - **바깥 흰 사각 테두리가 겹쳐 보이던 문제(사용자 제보)**
    - react-toastify v11은 실행 중에 자기 스타일을 `<head>` 맨 뒤에 넣는다. 그래서 globals.css의 같은 선택자 덮어쓰기가 졌다(import 순서와 무관)
    - `:root .Toastify__…`로 우선순위를 올려 바깥 상자를 투명 · 그림자 없음으로 했다
    - 컨테이너는 좌우 16px 전체 폭에 알약만 가운데 두고, 빈 곳은 클릭이 지나가게 했다(모바일에서 문구가 반쪽 폭에 갇혀 두 줄 되던 것도 해결)
- 식당 행 · 카드 접근성 ("버튼 안 버튼" 제거) — `RestaurantRow` · `RestaurantCard`
  - 행 · 카드를 누르는 부분은 진짜 `<button>`(행은 `aria-pressed`로 선택 표시)이고, 찜 버튼은 그 **형제**다
  - 키보드: Tab으로 행 → 찜 버튼 순서, Enter로 열기 · 찜. 보이는 모양은 그대로
  - 홈 · 지도 · 찜 · 검색 모두 자동 반영
- 리뷰 쓰기 · 리뷰 신고 중 401(세션 만료) → 토스트 대신 로그인 필요 팝업
  - 계획과 달리 모달은 닫지 않고 그 위에 띄운다. "다음에 할게요"를 누르면 쓰던 내용이 그대로 남는다
- 모바일 맵기 세그먼트: 402px에서 "아주 매운맛"이 두 줄 → 모바일만 12px · 줄바꿈 없음
- MY "비밀번호 바꾸기" (이메일 계정만, `ChangePasswordDialog`)
  - 현재 · 새 · 확인 입력, 규칙은 `lib/validation` 재사용
  - **새 API `POST /me/password`** `{ currentPassword, newPassword }` → 204. 현재 비밀번호가 틀리면 401 `INVALID_CREDENTIALS`, 소셜 계정 · 규칙 위반 · 같은 비밀번호는 400 (API.md 반영)
- 문서
  - `README.md`: 템플릿 설명 → lunchtime 소개, 실행 · 환경 변수, 화면 목록, 테스트 계정, 목 시나리오, localStorage 초기화, 폴더 구조
  - `docs/ARCHITECTURE.md`: "lunchtime additions" — 어드민 단일 페이지 규칙, 단독 화면 · Suspense, `domain/{auth,taste,admin}`, 세션 스토어 2개, API 클라이언트 옵션 · 목 파일 구성, 디바운스 URL 규칙, 접근성 규칙

**모바일 지도를 끌어도 안 움직인다 (사용자 제보) — 원인 확인, 코드 변경 없음**
- 재현: 실제 터치 이벤트로 끌면 안 움직이고, 마우스로 끌면 움직였다
- 카카오 지도 SDK는 **불러올 때 기기를 보고** 터치용과 마우스용 중 하나만 연결한다. 확인해 보니 지도 컨테이너에 마우스 리스너만 있었다
- 휴대폰 사용자 에이전트(iPhone · Android)로 열면 터치로 잘 끌린다(확인함)
- 그래서 안 되는 경우는 둘이다
  - 데스크톱 크롬에서 페이지를 연 **뒤에** 개발자 도구 기기 모드로 바꾼 경우 → 기기 모드에서 새로 고치면 된다
  - 터치스크린 노트북 + 데스크톱 브라우저
- 실제 휴대폰 · 웹뷰에는 문제없다. 터치스크린 노트북 대응이 필요해지면 터치 → 지도 이동을 직접 잇는 처리를 검토한다

**확인한 것**
- `tsc --noEmit`, `eslint .` 에러 0
- 이번 단계 Playwright 20개 모두 통과
  - 홈 · 지도 · 검색 · 찜에 버튼 안 버튼 0개, 찜 버튼을 role로 바로 찾음
  - 카드 Tab · Enter · 찜 해제 버튼 포커스, 지도 행 Enter → 선택
  - 되돌리기 토스트 3.5초 뒤에도 남음 · 되돌리기
  - 리뷰 등록 401 → 팝업(모달 · 별점 유지)
  - 402px 맵기 5칸 한 줄(높이 36)
  - 비밀번호: 소셜은 메뉴 없음 · 규칙 · 틀린 현재 · 변경 → 옛 비밀번호 실패 · 새 비밀번호 로그인
- 토스트 캡처: 바깥 상자 투명 · 그림자 없음 · 알약 폭 그대로(데스크톱 140px, 모바일 12px 위치)
- 회귀(지난 점검 전부 다시): 지도 · 다시 검색 · 리뷰 · 찜/MY · 온보딩(모바일) · 로그인 · 이메일 · 검색 · 어드민 1/2 — 총 260여 개 통과
  - 예전부터 있던 테스트 환경 문제 2개(Windows Web Share, 화면 밖 핀)는 그대로
  - 행 구조가 바뀌어 테스트 선택자(`[role=button]`)를 고쳤다
  - 한꺼번에 돌릴 때 "다시 검색 제자리" 측정이 19px 흔들렸는데, 혼자 돌리면 정확히 제자리(측정 타이밍 문제)
- 확인용 dev 서버(3000)와 Chrome은 확인 후 껐다

**남은 것 · 확인 필요**
- 템플릿 예제 화면 `app/example` · `components/pages/example` · `hooks/usePost*Logic.ts` (+ `constants/posts.ts` · `types/post.ts`)는 쓰이지 않는다 → 지울지 사용자 확인 필요
- 다음: 2단계 백엔드 — 스택 비교 후 결정

## 1단계-15 · 템플릿 예제 삭제 + 백엔드 스택 결정 (2026-10-16)

**결정 (사용자)**
- 백엔드는 NestJS + PostgreSQL + Prisma로 한다
- 저장소는 따로 `workspace/lunchtime-be`(별도 git)에 둔다. 프론트 저장소는 건드리지 않는다
- 개발 DB는 Docker Desktop의 docker-compose(Postgres + Redis)로 띄운다
- Nest는 정해진 좋은 템플릿이 없으므로, Nest CLI 기본 뼈대 위에 구조를 직접 정해 `lunchtime-be/docs/CONVENTIONS.md`로 남긴다. 계약은 이 저장소의 `API.md`
- plan.md "결정된 사항" · "미결정 사항"에 반영

**지운 것**
- `app/example/` (`/example`, `/example/[id]`)
- `components/pages/example/` 전체
- `hooks/usePostsListLogic.ts`, `hooks/usePostDetailLogic.ts`
- `constants/posts.ts`, `types/post.ts`
- `components/common/Badge.tsx`: 예제에서만 썼다. 어드민은 `AdminStatusBadge`를 쓴다

**문서**
- `docs/ARCHITECTURE.md`에서 예제를 가리키던 곳을 실제 화면으로 바꿨다
  - 짝 예: `components/pages/map/` + `hooks/useMapLogic.ts`
  - 중첩 라우트: `login-email`, `admin/menus`
  - 공용 · 분리 섹션 표: 홈 섹션(`TasteBannerSection`, `DesktopHeroSection` / `MobileHeroSection` 등)
  - 타입 · 상수 예: `types/restaurant.ts`, `constants/weather.ts` 등
  - "예제는 지워라" 문단은 지우고, Route groups 절에 `(main)` · `admin/(console)` 설명을 넣었다

**확인한 것**
- 예제 · `Badge` 참조 grep 0건
- `tsc --noEmit`, `eslint .` 에러 0
- `next build` 성공: 라우트 19개, `/example` 없음

**다음**
- 2단계 백엔드 기록은 `lunchtime-be/log.md`에 남긴다
- (2026-10-16) 2단계-0에서 API.md 에러 코드 3개(`CONFLICT` · `INTERNAL_ERROR` · `SERVICE_UNAVAILABLE`)를 추가했다. `types/common.ts`와 목의 상태 충돌 409(`VALIDATION_FAILED` → `CONFLICT`)도 맞췄다. 자세한 내용은 `../lunchtime-be/log.md`
