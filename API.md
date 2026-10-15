# lunchtime API 명세서 v0.1

Oct 8, 2026 · @Hojin Kang · Oct 15, 2026 프론트(목) 개발 중 정한 내용 반영

## 공통 규칙

REST + JSON API다. [기능명세서](https://claude.ai/code/artifact/98ec7729-5569-429e-92e3-3676896b1e63)의 화면·DB 구조를 기준으로 한다.

| 항목 | 규칙 |
| --- | --- |
| 기본 URL | `https://api.lunchtime.example/v1` (어드민은 `/v1/admin`) |
| 인증 | `Authorization: Bearer <accessToken>`. 표시 없는 API는 로그인 필수, "공개"는 비로그인 허용 |
| 토큰 | accessToken 1시간, refreshToken 30일. 만료 시 `POST /auth/refresh` |
| 권한 | 사용자 토큰과 어드민 토큰은 따로 발급한다. `/admin/*`은 어드민 토큰만 받고, 사용자 토큰으로 부르면 401 (어드민 인증 참고) |
| 형식 | 요청·응답 모두 JSON, 필드명은 camelCase, 시각은 ISO 8601 (KST, +09:00) |
| 좌표 | `lat`, `lng` (WGS84 소수점). 거리는 미터(`distanceM`) |
| 식당 식별자 | 카카오 장소 ID(`placeId`, 문자열). 우리 DB에 식당 테이블은 없음 |
| 페이지네이션 | 목록은 `?cursor=&limit=` (기본 20, 최대 50), 응답에 `nextCursor` (없으면 null). 어드민 표는 `?page=&size=` |

성공 응답은 데이터를 그대로, 실패는 아래 형식으로 돌려준다.

```json
// 목록 성공
{ "items": [ ... ], "nextCursor": "eyJpZCI6MTIzfQ" }

// 실패 (HTTP 4xx/5xx)
{ "error": { "code": "REVIEW_TOO_LONG", "message": "후기는 500자까지 쓸 수 있어요." } }
```

## 인증 · 내 정보

로그인은 소셜 로그인(카카오 · Apple · Google)과 자체 이메일 계정을 지원한다. 소셜은 앱(웹뷰)이 각 회사에서 받은 토큰을 서버에 넘기면 서버가 자체 토큰을 발급한다. iOS 앱스토어(웹뷰)에 내므로 App Store Guideline 4.8에 따라 Apple 로그인을 유지하고, 이메일 계정은 그 대체가 아니라 추가다. 어떤 방식이든 처음이면 자동 가입되고 같은 `LoginResponse`를 돌려준다.

| 메서드 | 경로 | 설명 | 화면 |
| --- | --- | --- | --- |
| POST | `/auth/login` | 소셜 로그인·가입 (공개) | 로그인 |
| POST | `/auth/email/code` | 이메일 인증번호 보내기 (공개). `purpose`: `signup` · `reset` | 이메일 가입, 비밀번호 재설정 |
| POST | `/auth/email/verify` | 인증번호 확인 → `verificationToken` (공개) | 이메일 가입, 비밀번호 재설정 |
| POST | `/auth/email/signup` | 이메일 가입 (공개) | 이메일 가입 |
| POST | `/auth/email/login` | 이메일 로그인 (공개) | 이메일 로그인 |
| POST | `/auth/email/password-reset` | 비밀번호 재설정 (공개) | 비밀번호 재설정 |
| POST | `/auth/refresh` | 토큰 재발급 (공개) | 공통 |
| POST | `/auth/logout` | 로그아웃 (refreshToken 폐기) | MY |
| GET | `/me` | 내 정보 + 요약 숫자 | MY |
| DELETE | `/me` | 회원 탈퇴 | MY |
| GET | `/me/preferences` | 내 취향 조회 | 취향 설정, MY |
| PUT | `/me/preferences` | 내 취향 저장 (전체 교체) | 취향 설정, 온보딩 끝 |
| GET | `/preferences/options` | 재료·알레르기·음식 종류 선택지 (공개) | 취향 설정, 온보딩 |
| GET | `/ingredients?q=` | 재료 검색 ("목록에 없는 재료") | 취향 설정 |
| POST | `/preferences/preview` | 저장 전 취향으로 추천 미리보기 (공개) | 취향 설정 |
| GET / POST | `/me/locations` | 저장한 위치 목록 · 추가 | MY |
| DELETE | `/me/locations/{id}` | 저장한 위치 삭제 | MY |
| GET | `/locations/search?q=` | 동네·도로명·건물명 검색 (공개, 카카오 주소·키워드 검색). 최근 검색은 기기에만 저장 | 위치 설정 |

`POST /auth/login` — 신규 사용자면 자동 가입되고 `isNewUser: true`를 돌려준다. 앱은 `onboardingCompleted`가 false이면 온보딩으로 보낸다.

```json
// 요청
{ "provider": "kakao", "providerToken": "<카카오 access token>" }

// 응답 200
{
  "accessToken": "...", "refreshToken": "...",
  "isNewUser": true,
  "user": { "id": "u_123", "name": "지민", "provider": "kakao", "role": "user", "onboardingCompleted": false }
}
```

`provider`는 `kakao` · `apple` · `google` · `email` 중 하나다. 로그인 · 가입 API의 401은 비밀번호 틀림 등이므로 앱은 토큰 재발급(`/auth/refresh`)을 시도하지 않는다.

**이메일 계정**

```json
// POST /auth/email/code — 인증번호 6자리를 메일로 보낸다
{ "email": "name@example.com", "purpose": "signup" }
// 응답 200
{ "expiresInSec": 600, "resendAfterSec": 60 }

// POST /auth/email/verify
{ "email": "name@example.com", "purpose": "signup", "code": "123456" }
// 응답 200
{ "verificationToken": "..." }

// POST /auth/email/signup → 응답은 /auth/login과 같은 LoginResponse (isNewUser: true, onboardingCompleted: false)
{ "email": "name@example.com", "password": "lunch1234", "name": "지민", "verificationToken": "..." }

// POST /auth/email/login → LoginResponse
{ "email": "name@example.com", "password": "lunch1234" }

// POST /auth/email/password-reset → 204
{ "email": "name@example.com", "password": "newpass12", "verificationToken": "..." }
```

| 규칙 | 내용 |
| --- | --- |
| 이메일 | 형식 검사, 서버가 소문자로 정규화 |
| 비밀번호 | 8\~64자, 영문과 숫자 모두 포함. 서버는 해시(bcrypt · argon2 등)로만 저장 |
| 이름 | 2\~12자 (리뷰에 보임) |
| 인증번호 | 6자리 숫자, 10분 유효, 재전송은 60초 뒤(그 전이면 429 `RATE_LIMITED`), 5번 틀리면 다시 받아야 함. `verificationToken`은 한 번만 쓸 수 있음 |
| 가입 | `purpose: signup`인데 이미 가입된 이메일이면 409 `EMAIL_TAKEN` |
| 로그인 | 틀리면 401 `INVALID_CREDENTIALS`(이메일 · 비밀번호 중 무엇이 틀렸는지 알려 주지 않음). 5번 연속 실패하면 429 `RATE_LIMITED` |
| 비밀번호 재설정 | 가입하지 않은 이메일이어도 `code` 요청은 같은 응답 (계정 존재 여부를 숨김) |

인증 메일 발송 서비스는 미결정이다.

`PUT /me/preferences` — 온보딩을 끝내거나 "나중에 할게요"를 누르면 `onboardingCompleted`를 true로 바꾼다. 건너뛴 항목은 빈 배열로 보낸다.

```json
{
  "dislikedIngredients": ["오이", "고수"],
  "allergies": ["갑각류 (새우·게)"],
  "spiceLevel": 3,
  "favoriteCuisines": ["한식", "일식", "아시안"],
  "completeOnboarding": true
}
```

`spiceLevel`은 맵기를 건너뛰면 `null`이다.

`GET /me` 응답의 요약 숫자: `stats: { reviewCount, favoriteCount, recommendationCount }` (MY 화면 상단).

| API | 응답 · 쿼리 |
| --- | --- |
| `GET /preferences/options` | `{ ingredients: string[], allergies: string[], cuisines: string[] }`. 값이 곧 화면 표시 이름이다(예: `"갑각류 (새우·게)"`, `"회·날것"`, `"샐러드·건강식"`). 메뉴 마스터의 재료 이름과 같은 사전을 쓴다 |
| `GET /ingredients?q=` | `{ items: string[] }` — 재료 사전 검색 |
| `GET /me/locations` | `{ items: SavedLocation[] }` |
| `GET /locations/search?q=` | `{ items: [{ name, address, lat, lng }] }` |

알레르기 → 메뉴 재료 대응(예: `갑각류 (새우·게)` → 새우 · 게 · 꽃게)은 서버의 재료 사전이 가진다. 취향 제외 필터와 미리보기가 이 대응을 쓴다.

`POST /preferences/preview` (공개) — 취향 설정 화면의 "추천 미리보기". 저장 전 설정으로 추천이 어떻게 바뀌는지 돌려준다. 고를 때마다 부르므로(앱은 200ms 디바운스) 가볍게 계산한다.

```json
// 요청: Preferences
{ "dislikedIngredients": ["오이", "고수"], "allergies": ["갑각류 (새우·게)"], "spiceLevel": 3, "favoriteCuisines": ["한식"] }

// 응답 200
{
  "recommended": [ { "menu": { "id": "m_12", "name": "얼큰 순두부찌개", "imageUrl": null }, "matchPercent": 98 } ],  // 최대 3
  "excluded": [ { "menu": { "id": "m_3", "name": "쌀국수", "imageUrl": null }, "reason": "고수" } ]                       // 최대 4
}
```

`reason`은 짧은 말이다: 못 먹는 재료 이름(`고수`), `갑각류 알레르기`, `매운맛`(맵기 "못 먹어요"인데 매운 메뉴).

## 추천 · 날씨

홈 화면은 `GET /recommendations` 한 번으로 그린다. 비로그인도 호출할 수 있고, 이때는 취향 없이 날씨·인기로만 추천한다.

| 메서드 | 경로 | 설명 | 화면 |
| --- | --- | --- | --- |
| GET | `/recommendations?lat=&lng=&radiusM=1000` | 오늘의 추천 1개 + 다른 후보 4개 (공개) | 홈 |
| GET | `/recommendations?...&excludeMenuIds=m_12,m_7` | \[다른 메뉴 추천\]: 이미 본 메뉴 빼고 다시 | 홈 |
| GET | `/weather?lat=&lng=` | 현재 기온·하늘·최고/최저 (공개) | 홈 |
| GET | `/locations/reverse?lat=&lng=` | 좌표 → 동네 이름 (공개, 카카오 좌표→행정구역) | 홈, 메뉴바 |

&#91;embedded content: GET /recommendations 서버 처리 순서 · 6단계\]

후보 메뉴마다 카카오 검색을 하므로, 점수 상위 후보부터 차례로 확인해 5개가 차면 멈춘다. 카카오 결과는 (키워드, 격자 좌표) 단위로 10분 캐시한다. 날씨는 기상청 격자 단위로 현재 날씨(초단기실황·초단기예보)는 1시간, 최고/최저(단기예보, 응답 1초 이상)는 하루 캐시한다.

```json
// GET /recommendations?lat=37.5006&lng=127.0365 → 200
{
  "location": { "name": "역삼동", "lat": 37.5006, "lng": 127.0365 },
  "weather": { "tempC": 18, "condition": "clear", "label": "맑음", "highC": 21, "lowC": 11 },
  "today": {
    "menu": { "id": "m_12", "name": "얼큰 순두부찌개", "imageUrl": null },
    "matchPercent": 96,
    "description": "선선한 날씨엔 뜨끈하고 칼칼한 국물이 최고예요.",
    "reasons": [
      { "type": "weather", "label": "쌀쌀한 날씨" },
      { "type": "taste", "label": "매운맛 좋아함" },
      { "type": "excluded", "label": "오이·고수 제외" },
      { "type": "nearby", "label": "주변 7곳" }
    ],
    "nearbyCount": 7,
    "restaurants": [ /* Restaurant × 4, 광고 식당이 맨 앞 */ ]
  },
  "alternatives": [
    { "menu": { "id": "m_3", "name": "쌀국수", "imageUrl": null }, "matchPercent": 92, "nearbyCount": 5 }
  ]
}
```

위치 권한이 없으면 앱은 저장한 위치(없으면 사용자가 고른 동네)의 좌표를 보낸다.

추천 방식은 응답의 `mode`로 구분한다.

| 상황 | 응답 |
| --- | --- |
| 로그인 + 취향 있음 | `mode: "personal"`, `matchPercent` 있음 |
| 비로그인 또는 취향 없음 | `mode: "popular"`, `matchPercent: null`, `popularRank` (이 근처 인기 순위), `promptTaste: true`(홈에 \[취향 알려주기\] 배너 표시) |
| 날씨 조회 실패 | `weather: null`, 날씨 추천 이유 빠짐. 추천은 그대로 돌려줌 |
| 좌표 없음 | 400 `LOCATION_REQUIRED` → 앱은 위치 설정으로 안내 |
| 모든 후보가 근처 식당 0곳 | `today: null`, `alternatives: []`, `suggestRadiusM: 3000` |

응답 필드는 상황과 관계없이 항상 넣고, 해당 없으면 null이다: `mode`, `promptTaste`, `location`, `weather`, `today`, `alternatives`, `suggestRadiusM`(평소 null). `today`와 `alternatives[]`에는 `matchPercent`(personal)와 `popularRank`(popular)가 함께 있고 다른 쪽은 null이다. popular 모드의 추천 이유는 `{ "type": "popular", "label": "이 근처 인기 1위" }`다 (`reasons[].type`: `weather` · `taste` · `excluded` · `nearby` · `popular`).

## 식당 · 찜

식당 정보는 서버가 카카오 로컬 API를 대신 호출해 우리 데이터(별점·리뷰 수·찜·광고)를 붙여 돌려준다. 앱은 카카오 REST API를 직접 부르지 않는다(지도 JS SDK만 직접 로드).

| 메서드 | 경로 | 설명 | 화면 |
| --- | --- | --- | --- |
| GET | `/restaurants` | 근처 식당 검색 (공개) | 지도 목록, 홈 근처 식당 |
| GET | `/restaurants/{placeId}` | 식당 상세 + 최근 리뷰 2개 (공개) | 지도 상세 패널·시트 |
| GET | `/me/favorites?lat=&lng=&cuisine=&sort=recent` | 찜한 식당 목록. `lat`·`lng`(선택)를 주면 그 위치 기준 거리(`distanceM`·`walkMinutes`)를 채운다 | 찜한 식당 |
| PUT | `/me/favorites/{placeId}` | 찜하기 (여러 번 호출해도 한 번만 저장) | 식당 행·카드·상세 |
| DELETE | `/me/favorites/{placeId}` | 찜 해제 | 식당 행·카드·상세 |
| POST | `/restaurants/{placeId}/click` | 광고 식당 클릭 집계 (광고일 때만 호출) | 목록 |
| GET | `/search?q=&lat=&lng=&type=all` | 통합 검색: { menus: Menu\[\] (매칭 % 포함), restaurants: Restaurant\[\] }. type = all · menu · restaurant (공개) | 검색 결과 |
| POST | `/restaurants/{placeId}/menu-reports` | "이 메뉴 안 팔아요" 제보 { menuId }. 같은 사용자·식당·메뉴는 한 번 | 지도 상세 |

`GET /restaurants` 쿼리:

| 파라미터 | 예시 | 설명 |
| --- | --- | --- |
| lat, lng | 37.5006, 127.0365 | 검색 중심 ("이 지역에서 다시 검색" 시 지도 중심) |
| menuId | m\_12 | 메뉴 마스터의 키워드·카테고리로 검색. 없으면 `q` 사용 |
| q | 순두부 | 자유 검색어 (메뉴바 검색) |
| radiusM | 1000 | 반경, 최대 3000 |
| minRating | 4.0 | 자체 별점 기준 |
| sort | distance · reviews | 거리순 · 리뷰 많은 순 |

응답은 `{ items: Restaurant[], total, nextCursor, menu }`다. `menu`는 `menuId`로 검색했을 때 `{ id, name, keyword }`(예: `"얼큰 순두부찌개"`, `"순두부찌개"`)이고 아니면 null이다. 앱은 `name`을 목록 머리말에, `keyword`를 필터 칩과 근거 문구에 쓴다. 광고 식당(`sponsored: true`)은 정렬과 관계없이 맨 앞에 오고, 필터에 걸리면 광고라도 빠진다. 광고는 `menuId` 검색에서 노출 메뉴가 맞을 때만 붙이고, 자유 검색어(`q`) 검색에서는 붙이지 않는다. 카카오는 한 검색에 최대 45개만 주므로 `total`도 최대 45(+광고)다.

`GET /search` 응답은 `{ menus: [{ menu: MenuSummary, matchPercent, nearbyCount }], restaurants: Restaurant[] }`다. `matchPercent`는 로그인 + 취향 있음일 때만 있고 아니면 null이다. 식당 결과는 검색어에 맞는 메뉴가 있으면 그 메뉴를 파는 식당(`menuId` 검색과 같은 근거 순서, `menuEvidence` 포함)을 먼저 넣고, 이어서 이름 · 대표 메뉴 · 카테고리가 검색어와 맞는 식당을 붙인다(중복 제외). 지금은 페이지 나눔 없이 한 번에 준다(앱은 4곳 → 더 보기). 결과가 많아지면 `cursor`를 추가한다.

`menuId`로 검색하면 식당마다 `menuEvidence`(이 메뉴를 파는 근거)를 붙이고, 근거가 확실한 순서로 정렬한다: 광고 → 리뷰·사장님 확인 → 이름 일치 → 카카오 키워드 검색 일치 → 카테고리만 일치(최대 5곳). 같은 단계 안에서는 `sort`를 따르고, 키워드 일치 중 메뉴의 `kakaoCategory`와 맞지 않는 식당은 그 단계 맨 뒤로 내린다. 메뉴 제보가 3건 이상이고 확인된 근거가 없는 식당은 뺀다.

| menuEvidence.type | 뜻 | 앱 표시 예 |
| --- | --- | --- |
| `owner` | 사장님이 등록한 대표 메뉴 | ✓ 사장님이 등록한 대표 메뉴예요 |
| `review` | 리뷰 "먹은 메뉴"에 있음 (`count` = 사람 수) | ✓ 리뷰 87명이 순두부찌개를 먹었어요 |
| `name` | 식당 이름에 키워드 포함 (추정) | 식당 이름으로 찾은 식당 |
| `keyword` | 카카오 키워드 검색에만 나옴. 카카오가 메뉴판 등으로 찾은 것으로 보이나 이유는 알 수 없음 (추정) | 카카오 검색에서 '순두부찌개'로 나온 식당 |
| `category` | 카카오 카테고리만 일치 (추정) | 카테고리(찌개·전골)로 찾은 식당 |

영업시간·브레이크·휴무일은 카카오 로컬 API에 없다. 광고·입점 식당만 어드민 광고 등록 때 입력받아 `hours`와 `openNow`를 채우고, 나머지 식당은 둘 다 null이다. 앱은 null이면 영업 정보를 표시하지 않고(상세에서는 "영업시간 정보 없음"), "영업 중" 필터는 제공하지 않는다.

## 리뷰 · 신고

리뷰를 등록·수정·삭제하면 서버가 같은 요청 안에서 `place_stats`(평균 별점·리뷰 수)를 다시 계산한다. 한 사용자는 한 식당에 하루 한 개까지 쓸 수 있다.

| 메서드 | 경로 | 설명 | 화면 |
| --- | --- | --- | --- |
| GET | `/restaurants/{placeId}/reviews?sort=recent`\|rating\_desc\|rating\_asc\|photo | 식당 리뷰 목록 (공개) | 리뷰 모두 보기 |
| GET | `/restaurants/{placeId}/review-form` | 리뷰 쓰기용 메뉴 목록·좋았던 점 태그 | 리뷰 쓰기 |
| POST | `/uploads/review-photos` | 사진 업로드 URL 발급 (최대 5장, 장당 10MB) | 리뷰 쓰기 |
| POST | `/restaurants/{placeId}/reviews` | 리뷰 등록 | 리뷰 쓰기 |
| GET | `/me/reviews` | 내 리뷰 목록 | MY |
| PATCH | `/reviews/{id}` | 내 리뷰 수정 | MY |
| DELETE | `/reviews/{id}` | 내 리뷰 삭제 | MY |
| POST | `/reviews/{id}/reports` | 리뷰 신고 (같은 리뷰는 한 번만) | 리뷰 목록 |

메뉴 목록은 우리 메뉴 마스터 중 그 식당 카테고리에 맞는 것과, 이 식당 리뷰에 자주 나온 메뉴를 합쳐 만든다. 목록에 없는 메뉴는 직접 입력할 수 있다.

```json
// POST /restaurants/2271043/reviews
{
  "rating": 4,
  "menus": ["순두부찌개"],
  "tags": ["국물이 진해요", "빨리 나와요"],
  "content": "국물이 진하고 순두부가 정말 부드러워요.",
  "photoIds": ["ph_91a"]
}

// 응답 201
{ "review": { "id": "r_501", ... }, "placeStats": { "rating": 4.5, "reviewCount": 343 } }
```

| 필드 | 규칙 |
| --- | --- |
| rating | 1\~5 정수, 필수 |
| menus, tags | 각 최대 10개, 선택 |
| content | 최대 500자, 선택 |
| photoIds | 최대 5개, 업로드 API가 돌려준 id |

`POST /uploads/review-photos` — `{ "count": 2 }` → `{ "items": [{ "photoId": "ph_91a", "uploadUrl": "https://..." }] }`. 앱은 `uploadUrl`에 파일을 PUT으로 올리고 `photoId`만 리뷰에 담는다 (저장소 미결정, 미리 서명된 URL 가정).

`POST /reviews/{id}/reports` — `{ "reason": "abuse" | "ad" | "false_info" | "irrelevant", "memo": "선택, 200자" }`. 자기 리뷰는 신고할 수 없다.

## 어드민 API

모두 `/v1/admin` 아래에 있고 **어드민 토큰**만 호출할 수 있다(사용자 토큰이면 401). 목록은 `?page=&size=`(기본 20) 페이지 번호 방식이고, 응답은 `{ items, total, page, size }`다. 모든 변경은 감사 로그(누가, 언제, 무엇을)로 남는다.

### 어드민 인증

어드민은 사용자 로그인과 분리한다. 운영자 계정은 `admin_users`에 따로 두고, 아이디 · 비밀번호 + OTP(TOTP 6자리)로 로그인한다. 운영자의 소셜 계정이 털려도 어드민 권한까지 넘어가지 않게 하려는 것이다.

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| POST | `/admin/auth/login` | 어드민 로그인 `{ loginId, password, otp }` → `{ accessToken, refreshToken, admin: { id, loginId, name } }` |
| POST | `/admin/auth/refresh` | 어드민 토큰 재발급 |
| POST | `/admin/auth/logout` | 로그아웃 (refreshToken 폐기) |
| GET | `/admin/me` | 지금 로그인한 운영자 `{ id, loginId, name }` |

| 규칙 | 내용 |
| --- | --- |
| 토큰 | 사용자 토큰과 다른 발급자 · 대상(예: JWT `aud: "admin"`), accessToken은 짧게(예: 30분). 웹 전용이므로 httpOnly 쿠키 권장 |
| 실패 | 틀리면 401 `INVALID_CREDENTIALS`(아이디 · 비밀번호 · OTP 중 무엇이 틀렸는지 알려 주지 않음). 5번 연속 실패하면 429 `RATE_LIMITED` |
| 기록 | 로그인 성공 · 실패도 감사 로그에 남긴다 |

### 유저 관리

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/admin/users/summary` | 전체 · 이번 주 신규(지난주 대비) · 오늘 활성 · 정지 수 |
| GET | `/admin/users?q=&status=active\|suspended\|withdrawn` | 유저 목록 (이메일은 마스킹) |
| GET | `/admin/users/{id}` | 유저 상세 + 취향 + 받은 신고 |
| POST | `/admin/users/{id}/suspend` | 이용 정지 `{ "days": 7, "reason": "..." }` (days 없으면 무기한) |
| POST | `/admin/users/{id}/unsuspend` | 정지 해제 |
| GET | `/admin/users/export.csv?q=&status=` | CSV 내보내기 (목록과 같은 조건, 이메일은 가린 그대로) |

```json
// GET /admin/users/summary
{ "total": 12480, "newThisWeek": 342, "newWeekChangePercent": 12, "activeToday": 2915, "suspended": 18 }

// GET /admin/users → items[] 한 줄 (AdminUser)
{
  "id": "u_123", "name": "김지민", "maskedEmail": "ji***@kakao.com", "provider": "kakao",
  "createdAt": "2026-09-03T10:00:00+09:00", "lastActiveAt": "2026-10-15T11:58:00+09:00",
  "reviewCount": 12, "favoriteCount": 6, "reportCount": 0,
  "status": "active", "suspendedUntil": null
}
```

`total`은 탈퇴를 뺀 수, `newWeekChangePercent`는 지난주 신규가 0이면 null이다. `suspendedUntil`은 정지 중일 때 끝나는 시각이고 무기한이면 null이다. 정지 · 해제 API는 바뀐 `AdminUser`를 돌려준다. 정지 사유(`reason`, 필수, 200자)는 사용자에게도 보여 준다. 엑셀 호환용 BOM은 지금은 앱이 붙이고, 서버가 붙여도 된다.

### 광고 식당 고정

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/admin/sponsored/summary` | 진행 중 · 이번 달 광고 매출 · 평균 클릭률 · 입금 대기 |
| GET | `/admin/sponsored?status=active\|scheduled\|ended` | 광고 목록 (노출·클릭 수 포함) |
| GET | `/admin/places/search?q=&lat=&lng=` | 카카오 장소 검색 (광고 등록용) |
| POST | `/admin/sponsored` | 광고 고정 추가 |
| PATCH | `/admin/sponsored/{id}` | 수정 (기간·조건·결제 상태) |
| POST | `/admin/sponsored/{id}/renew` | 종료된 광고 재등록 (조건 복사) |
| DELETE | `/admin/sponsored/{id}` | 광고 취소 (즉시 노출 중단) |

```json
// POST /admin/sponsored
{
  "place": { "placeId": "2271043", "name": "북창동 순두부", "address": "서울 강남구 역삼동 123-45",
             "lat": 37.5011, "lng": 127.0372, "category": "한식 > 찌개,전골" },
  "targetMenuIds": ["m_12"],
  "targetCategories": ["찌개류"],
  "radiusM": 1000,
  "hours": { "open": "11:00", "close": "21:00", "break": ["15:00", "16:30"], "closedDays": ["sun"] },
  "startDate": "2026-10-10", "endDate": "2026-11-09",
  "priority": 1,
  "feeKrw": 300000,
  "paymentStatus": "pending"
}
```

`status`는 서버가 기간으로 계산한다(예약 · 진행 중 · 종료). `paymentStatus`가 `pending`이어도 기간이 되면 노출할지는 미결정이다.

| 항목 | 규칙 |
| --- | --- |
| 목록 | `GET /admin/sponsored` 응답 한 줄은 `Sponsored`에 `canceled`(기간 중 취소해 종료됨), `targetMenuNames`(표 표시용, `targetMenuIds`의 이름)를 더한 모양. 진행 중 → 예약 → 종료, 같은 상태는 `priority` 순 |
| 요약 | `GET /admin/sponsored/summary` → `{ active, monthRevenueKrw, avgCtrPercent, pendingPayment }`. 매출은 이번 달에 걸친 결제 완료 광고의 광고료 합, 클릭률은 진행 중 광고의 클릭 ÷ 노출(노출 0이면 null), 입금 대기는 끝나지 않은 `pending` 수 |
| 장소 검색 | `GET /admin/places/search` → `{ items: [{ placeId, name, address, lat, lng, category }] }` (카카오 장소 검색 결과를 그대로 줄인 것) |
| 검사 | 노출 메뉴나 카테고리 하나 이상, `radiusM`은 500 · 1000 · 2000 · 3000, `endDate ≥ startDate`, `priority` 1\~99, `hours`가 있으면 `close > open`이고 브레이크는 영업시간 안. 틀리면 400 `VALIDATION_FAILED` |
| `targetCategories` | 메뉴 세부 카테고리(예: `찌개류`) 또는 종류 전체(예: `한식` = 한식 메뉴 모두) |
| 수정 | `PATCH`는 식당(`place`)을 바꿀 수 없다. 종료된 광고는 409 → 재등록을 쓴다 |
| 재등록 | `POST /admin/sponsored/{id}/renew` body는 `place`를 뺀 `POST /admin/sponsored`와 같다(식당은 원래 광고에서 복사). 종료된 광고만 가능, 새 광고를 만들어 돌려준다 |
| 취소 | `DELETE /admin/sponsored/{id}`는 지우지 않고 `canceled: true`로 바로 종료한다(기록 유지). 이미 종료면 409 |

### 메뉴 관리

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/admin/menus?q=&cuisine=&visible=` | 메뉴 목록 (7일 추천 수 포함). `q`는 메뉴 이름 · 재료 |
| POST | `/admin/menus` | 메뉴 추가 |
| PATCH | `/admin/menus/{id}` | 메뉴 수정, 노출/숨김 |
| POST | `/admin/menus/import` | CSV 가져오기 (multipart `file`, 같은 이름은 덮어쓰기) |
| GET / POST | `/admin/ingredients` | 재료·알레르기 사전 (취향 선택지와 같은 목록). GET → `{ items: string[] }` |

`GET /admin/menus` 응답은 `{ items: AdminMenu[], total, page, size, counts: { all, hidden } }`다. `AdminMenu`는 `Menu` + `recommendCount7d`. `counts`는 필터 칩 숫자(전체 · 숨김)이고 검색 · 필터와 상관없는 전체 수다. 노출 메뉴가 먼저, 그 안에서 7일 추천 수 순.

메뉴 추가 · 수정 검사: 이름(같은 이름이 있으면 409 `VALIDATION_FAILED`), `cuisine`, 재료 1개 이상, `spiceLevel` 0\~4, `kakaoKeyword`는 필수. 재료는 사전에 없는 이름도 저장하지만, 취향 제외 필터에 걸리려면 사전과 같은 이름이어야 한다(앱이 경고). `weathers`가 비어 있으면 "상관없음"이다(`clear` · `hot` · `cold` · `rain` · `snow`).

CSV 양식 (UTF-8, BOM 있어도 됨, 첫 줄은 머리글, 목록은 `|`로 구분):

```
이름,종류,카테고리,재료,맛,맵기,날씨,카카오 키워드,카카오 카테고리,노출
얼큰 순두부찌개,한식,찌개류,두부|바지락|계란|고춧가루,매운맛|국물,3,쌀쌀함|비,순두부찌개,"찌개,전골",Y
```

날씨는 한글(맑음 · 더움 · 쌀쌀함 · 비 · 눈)이나 값 둘 다 받고, 노출은 Y/N. 응답 `{ "created": 1, "updated": 1, "failed": [{ "line": 4, "reason": "카카오 검색 키워드를 적어 주세요." }] }` — 문제 있는 줄만 건너뛰고 나머지는 반영한다.

### 리뷰 신고

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/admin/reports/summary` | 처리 대기 · 오늘 접수 · 이번 달 처리 · 삭제 비율 (사이드바 배지에도 사용) |
| GET | `/admin/reports?status=pending\|resolved` | 리뷰 단위로 묶은 신고 목록 (사유별 건수) |
| GET | `/admin/reports/{reviewId}` | 신고 상세: 리뷰 원문, 신고자 메모, 작성자 이력 |
| POST | `/admin/reports/{reviewId}/resolve` | 처리: `{ "action": "dismiss" \| "delete", "suspendAuthorDays": 7 }` |

리뷰를 삭제하면 그 리뷰에 걸린 신고는 모두 처리 완료되고, 식당 별점이 다시 계산된다. `suspendAuthorDays`를 넣으면 작성자 정지까지 한 번에 처리한다(기각 · 삭제 모두 가능). 처리 API는 바뀐 `ReportGroup`을 돌려준다.

`GET /admin/reports/summary` → `{ "pending": 7, "today": 3, "resolvedThisMonth": 41, "deleteRatePercent": 34 }`. `deleteRatePercent`는 이번 달 처리 중 삭제 비율이다. `GET /admin/reports`는 `status`가 없으면 전체이고, 최근 신고 시각(`lastReportedAt`) 순이다.

## 공통 데이터 객체

여러 API가 같은 모양으로 돌려주는 객체다. 값이 없으면 필드를 빼지 않고 null로 둔다.

```json
// Restaurant — 식당 행, 식당 카드, 지도 핀, 상세 공통
{
  "placeId": "2271043",
  "name": "북창동 순두부",
  "category": "한식",
  "categoryPath": "음식점 > 한식 > 찌개,전골",
  "mainMenu": "순두부찌개",
  "address": "서울 강남구 역삼동 123-45",
  "phone": "02-555-1234",
  "lat": 37.5011, "lng": 127.0372,
  "distanceM": 420,
  "walkMinutes": 6,
  "rating": 4.5,            // 자체 리뷰 평균, 리뷰 없으면 null
  "reviewCount": 342,
  "openNow": true,          // 광고·입점 식당만, 나머지 null
  "hours": null,            // 예: { "open": "11:00", "close": "21:00", "break": ["15:00", "16:30"], "closedDays": ["sun"] }
  "imageUrl": null,
  "kakaoMapUrl": "https://place.map.kakao.com/2271043",
  "isFavorite": true,       // 비로그인은 false
  "sponsored": false,
  "menuEvidence": { "type": "review", "count": 87, "verified": true, "label": "리뷰 87명이 순두부찌개를 먹었어요" }  // menuId 검색일 때만
}
```

| 객체 | 필드 |
| --- | --- |
| RestaurantDetail | Restaurant + `recentReviews: Review[2]`, `ratingSummary: { 1~5점별 개수 }` |
| Menu | `id`, `name`, `cuisine`(종류: 한식 · 중식 …, 취향 "좋아하는 음식 종류"와 같은 값), `category`(세부: 찌개류 · 면류 …), `imageUrl`, `ingredients[]`, `tastes[]`, `spiceLevel(0~4)`, `weathers[]`, `kakaoKeyword`, `kakaoCategory`, `visible` |
| Review | `id`, `placeId`, `placeName`, `author { id, name }`, `rating`, `menus[]`, `tags[]`, `content`, `photos[{ id, url }]`, `createdAt`, `isMine` |
| Preferences | `dislikedIngredients[]`, `allergies[]`, `spiceLevel(0~4)`, `favoriteCuisines[]` |
| User (내 정보) | `id`, `name`, `provider(kakao\|apple\|google\|email)`, `role`, `onboardingCompleted`, `createdAt`, `stats { reviewCount, favoriteCount, recommendationCount }` |
| SavedLocation | `id`, `label`(회사 등), `name`(동네), `address`(위치 설정에 표시), `lat`, `lng` |
| Sponsored (어드민) | `id`, `place`, `targetMenuIds[]`, `targetMenuNames[]`, `targetCategories[]`, `radiusM`, `startDate`, `endDate`, hours, `priority`, `feeKrw`, `paymentStatus(pending\|paid)`, `status(scheduled\|active\|ended)`, `canceled`, `impressions`, `clicks` |
| ReportGroup (어드민) | `review`, `status(pending\|resolved)`, `resolution(dismissed\|deleted\|null)`, `reasonCounts { abuse, ad, false_info, irrelevant }`, `reportCount`, `firstReportedAt`, `lastReportedAt`, `memos[]`, `authorHistory { reviewCount, reportCount, deletedCount }` |
| AdminUser (어드민) | `id`, `name`, `maskedEmail`, `provider`, `createdAt`, `lastActiveAt`, `reviewCount`, `favoriteCount`, `reportCount`, `status(active\|suspended\|withdrawn)`, `suspendedUntil` |

`spiceLevel`: 0 못 먹어요 · 1 순한맛 · 2 보통 · 3 매운맛 · 4 아주 매운맛. `walkMinutes`는 거리÷80m로 계산한 어림값이다.

## 에러 코드

| HTTP | code | 언제 |
| --- | --- | --- |
| 400 | `VALIDATION_FAILED` | 필수 값 누락, 형식 오류 (`error.fields`에 항목별 사유) |
| 400 | `REVIEW_TOO_LONG` | 후기 500자 초과 |
| 400 | `TOO_MANY_PHOTOS` | 사진 5장 초과 |
| 401 | `UNAUTHORIZED` | 토큰 없음·만료 → 앱이 refresh 후 재시도 |
| 403 | `FORBIDDEN` | 어드민 전용, 남의 리뷰 수정 |
| 403 | `USER_SUSPENDED` | 정지된 사용자의 리뷰·신고 작성 (`error.until`에 종료일) |
| 404 | `NOT_FOUND` | 없는 리뷰·메뉴·광고 |
| 409 | `REVIEW_DAILY_LIMIT` | 같은 식당에 오늘 이미 리뷰 작성 |
| 409 | `ALREADY_REPORTED` | 같은 리뷰를 다시 신고 |
| 422 | `OUT_OF_SERVICE_AREA` | 서비스 지역(국내) 밖 좌표 |
| 429 | `RATE_LIMITED` | 요청 과다 (기본 분당 60회) |
| 502 | `UPSTREAM_UNAVAILABLE` | 카카오·기상청 응답 실패 (날씨는 없어도 추천은 돌려줌) |
| 400 | `LOCATION_REQUIRED` | 좌표 없이 추천·식당 검색 호출 → 위치 설정 화면으로 |
| 409 | `ALREADY_REPORTED_MENU` | 같은 식당·메뉴를 다시 제보 |
| 409 | `EMAIL_TAKEN` | 이미 가입된 이메일로 가입 인증번호 요청 · 가입 |
| 400 | `INVALID_CODE` | 이메일 인증번호가 틀림, 또는 `verificationToken`이 맞지 않음 |
| 400 | `CODE_EXPIRED` | 인증번호 시간(10분) 지남 · 5번 틀림 → 다시 받기 |
| 401 | `INVALID_CREDENTIALS` | 이메일 로그인 · 어드민 로그인 실패 (어느 값이 틀렸는지 밝히지 않음) |

## 미결정 사항

영업시간은 광고·입점 식당만 사장님이 직접 입력하는 것으로 결정했다. 나중에 사용자 제보 API(\`POST /restaurants/{placeId}/hours-reports\`)를 추가한다.

- [ ] 사장님 전용 페이지(입점 신청·식당 정보·영업시간 수정) API 설계 시점
- [ ] 입금 대기(`pending`) 광고를 기간이 되면 노출할지
- [ ] 리뷰 작성 자격 (누구나 / 방문 인증) — 현재는 로그인만 하면 작성 가능으로 가정
- [ ] 리뷰 사진 저장소와 업로드 방식 (미리 서명된 URL 가정)
- [ ] 카카오 장소 정보 저장 범위 약관 확인 (favorites·reviews·sponsored에 이름·좌표 저장)
- [ ] 알림(점심 시간 추천 푸시) API·방식 — 웹뷰 앱 배포 시 정리

- [ ] 인증 메일 발송 서비스 (이메일 인증번호 · 비밀번호 재설정)
- [ ] 같은 사람이 다른 로그인 방식으로 들어올 때 계정을 합칠지
- [ ] 소셜 토큰을 앱(웹뷰)이 서버에 넘기는 방식 (웹뷰 브리지)
- [ ] 반경 안 전체 식당 수(`totalNearbyCount`)를 추천 응답에 넣을지 — 모바일 위치 카드는 지금 "반경 1km 안에서 추천해요"로 표시

추가로 정할 것: 메뉴 제보를 어드민이 확인하는 API(`GET /admin/menu-reports`)는 화면이 생길 때 추가하고, 그전까지는 제보 3건 이상 자동 제외만 한다. iOS 앱스토어(웹뷰)에 내기로 해서 Guideline 4.8에 따라 Apple 로그인을 첫 버전부터 지원한다(2026-10-15 결정).
