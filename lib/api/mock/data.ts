// 목 데이터. 역삼동(37.5006, 127.0365) 기준이며 식당은 모두 가상이다.
// 메뉴별 근거 분포는 2026-10-14 카카오 스파이크 결과(이름 일치 소수, 키워드 일치 다수)를 흉내 냈다.
import { SavedLocation, LocationSearchResult } from "@/types/location";
import { Menu } from "@/types/menu";
import { PreferenceOptions, Preferences } from "@/types/preferences";
import { RecommendationReason } from "@/types/recommendation";
import { MenuEvidence, Restaurant } from "@/types/restaurant";
import { Review } from "@/types/review";
import { User } from "@/types/user";
import { Weather } from "@/types/weather";

export const MOCK_HOME = { name: "역삼동", lat: 37.5006, lng: 127.0365 };

export const MOCK_USER: User = {
  id: "u_123",
  name: "지민",
  provider: "kakao",
  role: "user",
  onboardingCompleted: true,
  createdAt: "2026-09-01T12:00:00+09:00",
  stats: { reviewCount: 0, favoriteCount: 0, recommendationCount: 23 },
};

export const MOCK_PREFERENCES: Preferences = {
  dislikedIngredients: ["오이", "고수"],
  allergies: ["갑각류 (새우·게)"],
  spiceLevel: 3,
  favoriteCuisines: ["한식", "일식", "아시안"],
};

// 선택지는 Figma 02 Taste Settings (19:303) 기준
export const MOCK_PREFERENCE_OPTIONS: PreferenceOptions = {
  ingredients: ["오이", "고수", "가지", "버섯", "당근", "피망", "굴", "내장류", "선지", "양고기", "회·날것", "깻잎"],
  allergies: ["갑각류 (새우·게)", "견과류", "땅콩", "우유", "달걀", "밀", "대두", "생선", "조개류", "복숭아"],
  cuisines: ["한식", "중식", "일식", "양식", "분식", "아시안", "패스트푸드", "샐러드·건강식"],
};

export const MOCK_INGREDIENT_DICTIONARY = [
  ...MOCK_PREFERENCE_OPTIONS.ingredients,
  "미나리", "부추", "셀러리", "파프리카", "고추", "마늘", "생강", "두부", "청국장", "숙주", "올리브",
];

// 알레르기 → 메뉴 재료. 미리보기 계산에 쓴다 (실제로는 서버의 메뉴 마스터가 가진다)
export const MOCK_ALLERGENS: Record<string, string[]> = {
  "갑각류 (새우·게)": ["새우", "게", "꽃게"],
  견과류: ["호두", "잣", "캐슈넛"],
  땅콩: ["땅콩"],
  우유: ["우유", "치즈", "버터"],
  달걀: ["계란"],
  밀: ["밀", "밀가루면", "빵가루"],
  대두: ["두부", "두부피", "간장"],
  생선: ["생선"],
  조개류: ["바지락", "홍합"],
  복숭아: ["복숭아"],
};

export const MOCK_WEATHER: Weather = { tempC: 18, condition: "clear", label: "맑음", highC: 21, lowC: 11 };

export const MOCK_SAVED_LOCATIONS: SavedLocation[] = [
  { id: "loc_1", label: "회사", name: "역삼동", address: "서울 강남구 테헤란로 123", lat: 37.5006, lng: 127.0365 },
  { id: "loc_2", label: "집", name: "망원동", address: "서울 마포구 망원로 45", lat: 37.5559, lng: 126.9019 },
];

export const MOCK_LOCATION_SEARCH: LocationSearchResult[] = [
  { name: "역삼동", address: "서울 강남구 역삼동", lat: 37.5006, lng: 127.0365 },
  { name: "역삼역", address: "서울 강남구 테헤란로 156", lat: 37.5007, lng: 127.0363 },
  { name: "판교동", address: "경기 성남시 분당구 판교동", lat: 37.3947, lng: 127.1112 },
  { name: "망원동", address: "서울 마포구 망원동", lat: 37.5559, lng: 126.9019 },
  { name: "성수동1가", address: "서울 성동구 성수동1가", lat: 37.5446, lng: 127.0559 },
];

export const MOCK_MENUS: Menu[] = [
  { id: "m_12", name: "얼큰 순두부찌개", cuisine: "한식", category: "찌개류", imageUrl: null, ingredients: ["두부", "바지락", "계란", "고춧가루"], tastes: ["매운맛", "국물"], spiceLevel: 3, weathers: ["cold", "rain"], kakaoKeyword: "순두부찌개", kakaoCategory: "찌개,전골", visible: true },
  { id: "m_3", name: "쌀국수", cuisine: "아시안", category: "아시안", imageUrl: null, ingredients: ["쌀국수면", "소고기", "숙주", "고수"], tastes: ["국물", "담백"], spiceLevel: 1, weathers: ["cold", "rain"], kakaoKeyword: "쌀국수", kakaoCategory: "베트남음식", visible: true },
  { id: "m_7", name: "김치찌개", cuisine: "한식", category: "찌개류", imageUrl: null, ingredients: ["김치", "돼지고기", "두부"], tastes: ["매운맛", "국물"], spiceLevel: 2, weathers: ["cold"], kakaoKeyword: "김치찌개", kakaoCategory: "찌개,전골", visible: true },
  { id: "m_5", name: "칼국수", cuisine: "한식", category: "면류", imageUrl: null, ingredients: ["밀가루면", "바지락", "애호박"], tastes: ["국물", "담백"], spiceLevel: 0, weathers: ["rain", "cold"], kakaoKeyword: "칼국수", kakaoCategory: "국수", visible: true },
  { id: "m_9", name: "초밥", cuisine: "일식", category: "일식", imageUrl: null, ingredients: ["밥", "회·날것", "생선", "와사비"], tastes: ["담백"], spiceLevel: 0, weathers: ["clear", "hot"], kakaoKeyword: "초밥", kakaoCategory: "초밥,롤", visible: true },
  { id: "m_21", name: "돈까스", cuisine: "일식", category: "일식", imageUrl: null, ingredients: ["돼지고기", "빵가루", "계란", "밀"], tastes: ["고소함"], spiceLevel: 0, weathers: ["clear"], kakaoKeyword: "돈까스", kakaoCategory: "돈까스,우동", visible: true },
  { id: "m_14", name: "짬뽕", cuisine: "중식", category: "중식", imageUrl: null, ingredients: ["밀가루면", "오징어", "새우", "홍합"], tastes: ["매운맛", "국물"], spiceLevel: 3, weathers: ["cold", "rain"], kakaoKeyword: "짬뽕", kakaoCategory: "중식", visible: true },
  { id: "m_30", name: "마라탕", cuisine: "중식", category: "중식", imageUrl: null, ingredients: ["마라소스", "청경채", "두부피", "땅콩"], tastes: ["매운맛", "얼얼함"], spiceLevel: 4, weathers: ["cold"], kakaoKeyword: "마라탕", kakaoCategory: "중식", visible: true },
  { id: "m_2", name: "물냉면", cuisine: "한식", category: "면류", imageUrl: null, ingredients: ["메밀면", "오이", "계란", "배"], tastes: ["시원함"], spiceLevel: 0, weathers: ["hot"], kakaoKeyword: "냉면", kakaoCategory: "냉면", visible: true },
  { id: "m_18", name: "순대국밥", cuisine: "한식", category: "국밥", imageUrl: null, ingredients: ["순대", "내장류", "들깨"], tastes: ["국물", "든든함"], spiceLevel: 1, weathers: ["cold"], kakaoKeyword: "국밥", kakaoCategory: "국밥", visible: true },
];

// 취향(오이·고수 제외, 갑각류 알레르기, 맵기 3)으로 점수를 매긴 결과라고 가정한 순서.
// 쌀국수(고수)·짬뽕(새우)·물냉면(오이)은 제외 필터에 걸리지만, popular 모드 순위를 위해 남겨 둔다.
export interface MockMenuScore {
  menuId: string;
  matchPercent: number;
  popularRank: number;
  excludedByTaste: boolean;
  description: string;
  reasons: RecommendationReason[];
}

export const MOCK_MENU_SCORES: MockMenuScore[] = [
  { menuId: "m_12", matchPercent: 96, popularRank: 3, excludedByTaste: false, description: "선선한 날씨엔 뜨끈하고 칼칼한 국물이 최고예요.", reasons: [{ type: "weather", label: "쌀쌀한 날씨" }, { type: "taste", label: "매운맛 좋아함" }, { type: "excluded", label: "오이·고수 제외" }] },
  { menuId: "m_7", matchPercent: 92, popularRank: 1, excludedByTaste: false, description: "든든하게 밥 한 공기 비우고 싶은 날이에요.", reasons: [{ type: "weather", label: "쌀쌀한 날씨" }, { type: "taste", label: "한식 좋아함" }] },
  { menuId: "m_30", matchPercent: 88, popularRank: 6, excludedByTaste: false, description: "얼얼한 매운맛이 당긴다면 오늘이에요.", reasons: [{ type: "taste", label: "매운맛 좋아함" }] },
  { menuId: "m_9", matchPercent: 85, popularRank: 4, excludedByTaste: false, description: "맑은 날엔 가볍고 깔끔한 한 끼.", reasons: [{ type: "weather", label: "맑은 날씨" }, { type: "taste", label: "일식 좋아함" }] },
  { menuId: "m_5", matchPercent: 81, popularRank: 5, excludedByTaste: false, description: "따뜻한 국물에 쫄깃한 면발.", reasons: [{ type: "weather", label: "쌀쌀한 날씨" }] },
  { menuId: "m_21", matchPercent: 78, popularRank: 2, excludedByTaste: false, description: "실패 없는 바삭한 점심.", reasons: [{ type: "taste", label: "일식 좋아함" }] },
  { menuId: "m_18", matchPercent: 74, popularRank: 7, excludedByTaste: false, description: "속을 든든하게 채우는 국밥 한 그릇.", reasons: [{ type: "weather", label: "쌀쌀한 날씨" }] },
  { menuId: "m_3", matchPercent: 0, popularRank: 8, excludedByTaste: true, description: "따끈한 국물에 부드러운 쌀면.", reasons: [{ type: "weather", label: "쌀쌀한 날씨" }] },
  { menuId: "m_14", matchPercent: 0, popularRank: 9, excludedByTaste: true, description: "얼큰한 해물 국물.", reasons: [{ type: "taste", label: "매운맛 좋아함" }] },
  { menuId: "m_2", matchPercent: 0, popularRank: 10, excludedByTaste: true, description: "시원한 육수 한 그릇.", reasons: [] },
];

export type MockEvidence = Omit<MenuEvidence, "label">;

// 서버가 계산할 값(거리·찜·근거 문구)은 핸들러에서 붙인다
export interface MockRestaurant
  extends Omit<Restaurant, "distanceM" | "walkMinutes" | "isFavorite" | "menuEvidence" | "rating" | "reviewCount"> {
  evidence: Record<string, MockEvidence>;
  sponsoredMenuIds: string[];
  cuisine: string; // 찜 필터용 종류 (한식 · 일식 · 아시안 …)
}

const kakaoUrl = (id: string) => `https://place.map.kakao.com/${id}`;
const verified = (type: "owner" | "review", count: number | null = null): MockEvidence => ({ type, count, verified: true });
const guessed = (type: "name" | "keyword" | "category"): MockEvidence => ({ type, count: null, verified: false });

export const MOCK_RESTAURANTS: MockRestaurant[] = [
  {
    placeId: "2271043", name: "북창동 순두부 역삼점", category: "한식", categoryPath: "음식점 > 한식 > 찌개,전골", cuisine: "한식",
    mainMenu: "순두부찌개", address: "서울 강남구 역삼동 123-45", phone: "02-555-1234", lat: 37.5011, lng: 127.0372,
    openNow: true, hours: { open: "11:00", close: "21:00", break: ["15:00", "16:30"], closedDays: ["sun"] },
    imageUrl: null, kakaoMapUrl: kakaoUrl("2271043"), sponsored: true, sponsoredMenuIds: ["m_12", "m_7"],
    evidence: { m_12: verified("owner"), m_7: guessed("category") },
  },
  {
    placeId: "1000001", name: "김치명가 역삼", category: "한식", categoryPath: "음식점 > 한식 > 찌개,전골", cuisine: "한식",
    mainMenu: "김치찌개", address: "서울 강남구 역삼동 120-3", phone: "02-555-0001", lat: 37.5002, lng: 127.0358,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000001"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_7: verified("review", 41), m_12: guessed("keyword") },
  },
  {
    placeId: "1000002", name: "든든밥상", category: "한식", categoryPath: "음식점 > 한식", cuisine: "한식",
    mainMenu: null, address: "서울 강남구 역삼동 118-7", phone: null, lat: 37.4999, lng: 127.0371,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000002"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_7: guessed("keyword"), m_12: verified("review", 12), m_18: guessed("keyword") },
  },
  {
    placeId: "1000003", name: "강남 돼지집", category: "한식", categoryPath: "음식점 > 한식 > 육류,고기 > 삼겹살", cuisine: "한식",
    mainMenu: "삼겹살", address: "서울 강남구 역삼동 125-10", phone: "02-555-0003", lat: 37.5015, lng: 127.0349,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000003"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_7: guessed("keyword") },
  },
  {
    placeId: "1000004", name: "평양면옥 강남", category: "한식", categoryPath: "음식점 > 한식 > 냉면", cuisine: "한식",
    mainMenu: "물냉면", address: "서울 강남구 역삼동 130-2", phone: "02-555-0004", lat: 37.5024, lng: 127.0381,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000004"), sponsored: false, sponsoredMenuIds: [],
    // 카테고리가 맞지 않는 키워드 일치 예시 (순두부찌개 검색에 나온 냉면집) → 그 단계 맨 뒤
    evidence: { m_2: guessed("name"), m_12: guessed("keyword") },
  },
  {
    placeId: "1000005", name: "명동칼국수 역삼점", category: "한식", categoryPath: "음식점 > 한식 > 국수 > 칼국수", cuisine: "한식",
    mainMenu: "칼국수", address: "서울 강남구 역삼동 110-1", phone: "02-555-0005", lat: 37.4991, lng: 127.0344,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000005"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_5: guessed("name") },
  },
  {
    placeId: "1000006", name: "순대국밥 명가", category: "한식", categoryPath: "음식점 > 한식 > 국밥", cuisine: "한식",
    mainMenu: "순대국밥", address: "서울 강남구 역삼동 140-8", phone: null, lat: 37.5038, lng: 127.0355,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000006"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_18: guessed("name") },
  },
  {
    placeId: "1000007", name: "스시 하루", category: "일식", categoryPath: "음식점 > 일식 > 초밥,롤", cuisine: "일식",
    mainMenu: "모둠초밥", address: "서울 강남구 역삼동 101-4", phone: "02-555-0007", lat: 37.4985, lng: 127.0389,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000007"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_9: verified("review", 23) },
  },
  {
    placeId: "1000008", name: "역삼 돈카츠 연구소", category: "일식", categoryPath: "음식점 > 일식 > 돈까스,우동", cuisine: "일식",
    mainMenu: "등심카츠", address: "서울 강남구 역삼동 132-6", phone: "02-555-0008", lat: 37.5019, lng: 127.0398,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000008"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_21: guessed("name") },
  },
  {
    placeId: "1000009", name: "포하노이 역삼", category: "아시안", categoryPath: "음식점 > 아시아음식 > 베트남음식", cuisine: "아시안",
    mainMenu: "양지쌀국수", address: "서울 강남구 역삼동 115-9", phone: "02-555-0009", lat: 37.4996, lng: 127.0327,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000009"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_3: guessed("name") },
  },
  {
    placeId: "1000010", name: "홍짬뽕 역삼", category: "중식", categoryPath: "음식점 > 중식 > 중화요리", cuisine: "중식",
    mainMenu: "짬뽕", address: "서울 강남구 역삼동 137-1", phone: "02-555-0010", lat: 37.5031, lng: 127.0408,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000010"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_14: guessed("name") },
  },
  {
    placeId: "1000011", name: "라공방 마라탕", category: "중식", categoryPath: "음식점 > 중식 > 중화요리", cuisine: "중식",
    mainMenu: "마라탕", address: "서울 강남구 역삼동 129-5", phone: "02-555-0011", lat: 37.5008, lng: 127.0412,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000011"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_30: guessed("name") },
  },
  {
    placeId: "1000012", name: "역삼 백반집", category: "한식", categoryPath: "음식점 > 한식", cuisine: "한식",
    mainMenu: null, address: "서울 강남구 역삼동 108-2", phone: null, lat: 37.4979, lng: 127.0361,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000012"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_7: guessed("category"), m_12: guessed("category") },
  },
  // 지도 화면용: 1km 안쪽 끝과 1~3km 식당 ("이 지역에서 다시 검색", "반경 3km" 확인용)
  {
    placeId: "1000013", name: "강남역 순두부", category: "한식", categoryPath: "음식점 > 한식 > 찌개,전골", cuisine: "한식",
    mainMenu: "해물순두부", address: "서울 강남구 역삼동 820-4", phone: "02-555-0013", lat: 37.4981, lng: 127.0279,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000013"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_12: verified("review", 23) },
  },
  {
    placeId: "1000014", name: "역삼 순두부 마을", category: "한식", categoryPath: "음식점 > 한식 > 찌개,전골", cuisine: "한식",
    mainMenu: "순두부찌개", address: "서울 강남구 역삼동 702-1", phone: null, lat: 37.509, lng: 127.044,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000014"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_12: guessed("name") },
  },
  {
    placeId: "1000015", name: "두부공방 선릉", category: "한식", categoryPath: "음식점 > 한식 > 찌개,전골", cuisine: "한식",
    mainMenu: "두부전골", address: "서울 강남구 대치동 890-3", phone: "02-555-0015", lat: 37.5045, lng: 127.049,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000015"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_12: guessed("category") },
  },
  {
    placeId: "1000016", name: "삼성동 짬뽕집", category: "중식", categoryPath: "음식점 > 중식 > 중화요리", cuisine: "중식",
    mainMenu: "짬뽕", address: "서울 강남구 삼성동 143-7", phone: "02-555-0016", lat: 37.511, lng: 127.056,
    openNow: null, hours: null, imageUrl: null, kakaoMapUrl: kakaoUrl("1000016"), sponsored: false, sponsoredMenuIds: [],
    evidence: { m_14: guessed("name"), m_12: guessed("keyword") },
  },
];

export const MOCK_REVIEW_TAGS = ["국물이 진해요", "양이 많아요", "빨리 나와요", "가성비 좋아요", "친절해요", "혼밥하기 좋아요", "매장이 깨끗해요"];

export const MOCK_REVIEWS: Review[] = [
  { id: "r_1", placeId: "2271043", placeName: "북창동 순두부 역삼점", author: { id: "u_201", name: "서연" }, rating: 5, menus: ["순두부찌개"], tags: ["국물이 진해요", "빨리 나와요"], content: "점심에 줄 서도 회전이 빨라요. 국물이 칼칼해요.", photos: [], createdAt: "2026-10-13T12:20:00+09:00", isMine: false },
  { id: "r_2", placeId: "2271043", placeName: "북창동 순두부 역삼점", author: { id: "u_202", name: "도윤" }, rating: 4, menus: ["순두부찌개", "돌솥밥"], tags: ["양이 많아요"], content: "돌솥밥이랑 같이 먹으면 든든해요.", photos: [{ id: "ph_1", url: "" }], createdAt: "2026-10-11T12:45:00+09:00", isMine: false },
  { id: "r_3", placeId: "2271043", placeName: "북창동 순두부 역삼점", author: { id: "u_203", name: "하은" }, rating: 3, menus: ["김치찌개"], tags: [], content: null, photos: [], createdAt: "2026-10-08T13:05:00+09:00", isMine: false },
  { id: "r_4", placeId: "1000001", placeName: "김치명가 역삼", author: { id: "u_123", name: "지민" }, rating: 4, menus: ["김치찌개"], tags: ["가성비 좋아요", "혼밥하기 좋아요"], content: "혼밥하기 편하고 김치가 잘 익었어요.", photos: [], createdAt: "2026-10-02T12:30:00+09:00", isMine: true },
  { id: "r_6", placeId: "2271043", placeName: "북창동 순두부 역삼점", author: { id: "u_205", name: "현우" }, rating: 4, menus: ["순두부찌개"], tags: ["친절해요"], content: "맵기 조절이 돼서 좋아요. 반찬 리필도 친절하게 해 주세요.", photos: [], createdAt: "2026-09-27T12:40:00+09:00", isMine: false },
  { id: "r_7", placeId: "1000013", placeName: "강남역 순두부", author: { id: "u_206", name: "수아" }, rating: 5, menus: ["해물순두부"], tags: ["국물이 진해요"], content: "해물이 넉넉하게 들어가요.", photos: [], createdAt: "2026-10-09T12:15:00+09:00", isMine: false },
  { id: "r_5", placeId: "1000007", placeName: "스시 하루", author: { id: "u_204", name: "민준" }, rating: 5, menus: ["모둠초밥"], tags: ["매장이 깨끗해요", "친절해요"], content: "점심 세트 구성이 좋아요.", photos: [], createdAt: "2026-10-10T12:10:00+09:00", isMine: false },
];

export const MOCK_FAVORITES: { placeId: string; favoritedAt: string }[] = [
  { placeId: "2271043", favoritedAt: "2026-10-12T12:00:00+09:00" },
  { placeId: "1000007", favoritedAt: "2026-10-05T18:30:00+09:00" },
  { placeId: "1000009", favoritedAt: "2026-09-28T12:15:00+09:00" },
];
