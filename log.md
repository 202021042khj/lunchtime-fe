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
