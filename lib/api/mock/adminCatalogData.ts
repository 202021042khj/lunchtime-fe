// 어드민 메뉴 · 광고 목 데이터. 앞쪽 값은 Figma A3(29:891) · A2(28:849) 시안과 맞췄다.
// 날짜는 오늘 기준으로 만들어 진행 중 · 예약 · 종료가 늘 섞여 보이게 한다
import { MOCK_MENUS } from "@/lib/api/mock/data";
import { AdminMenu, Sponsored, SponsoredPlace } from "@/types/admin";
import { Menu } from "@/types/menu";

// 7일 추천 수 (사용자 앱 메뉴는 Figma 숫자, 나머지는 적당히)
const RECOMMEND_7D: Record<string, number> = { m_12: 1284, m_3: 962, m_21: 871, m_30: 588, m_7: 1120, m_9: 702, m_5: 455, m_18: 390, m_14: 0, m_2: 128 };

const menu = (m: Omit<Menu, "imageUrl" | "visible"> & { visible?: boolean }): Menu => ({ imageUrl: null, visible: true, ...m });

// 어드민에만 있는 메뉴 (사용자 앱 목 추천에는 쓰지 않는다)
const EXTRA_MENUS: (Menu & { recommendCount7d: number })[] = [
  { ...menu({ id: "m_40", name: "비빔밥", cuisine: "한식", category: "밥류", ingredients: ["밥", "나물", "고추장", "계란"], tastes: ["매콤", "담백"], spiceLevel: 1, weathers: ["clear", "hot"], kakaoKeyword: "비빔밥", kakaoCategory: "한식" }), recommendCount7d: 640 },
  { ...menu({ id: "m_41", name: "꽃게탕", cuisine: "한식", category: "찌개류", ingredients: ["꽃게", "무", "된장"], tastes: ["얼큰", "국물"], spiceLevel: 2, weathers: ["cold"], kakaoKeyword: "꽃게탕", kakaoCategory: "해물,생선", visible: false }), recommendCount7d: 0 },
  { ...menu({ id: "m_42", name: "제육볶음", cuisine: "한식", category: "볶음류", ingredients: ["돼지고기", "양파", "고추장"], tastes: ["매콤", "든든함"], spiceLevel: 2, weathers: [], kakaoKeyword: "제육볶음", kakaoCategory: "한식" }), recommendCount7d: 812 },
  { ...menu({ id: "m_43", name: "된장찌개", cuisine: "한식", category: "찌개류", ingredients: ["된장", "두부", "애호박"], tastes: ["국물", "담백"], spiceLevel: 0, weathers: ["cold", "rain"], kakaoKeyword: "된장찌개", kakaoCategory: "찌개,전골" }), recommendCount7d: 530 },
  { ...menu({ id: "m_44", name: "짜장면", cuisine: "중식", category: "면류", ingredients: ["밀가루면", "춘장", "돼지고기", "양파"], tastes: ["달콤", "고소"], spiceLevel: 0, weathers: [], kakaoKeyword: "짜장면", kakaoCategory: "중식" }), recommendCount7d: 701 },
  { ...menu({ id: "m_45", name: "탕수육", cuisine: "중식", category: "요리류", ingredients: ["돼지고기", "전분", "밀"], tastes: ["달콤", "튀김"], spiceLevel: 0, weathers: [], kakaoKeyword: "탕수육", kakaoCategory: "중식" }), recommendCount7d: 214 },
  { ...menu({ id: "m_46", name: "라멘", cuisine: "일식", category: "면류", ingredients: ["밀가루면", "돼지고기", "계란", "파"], tastes: ["국물", "고소"], spiceLevel: 1, weathers: ["cold", "rain"], kakaoKeyword: "라멘", kakaoCategory: "일본식라면" }), recommendCount7d: 466 },
  { ...menu({ id: "m_47", name: "규동", cuisine: "일식", category: "덮밥류", ingredients: ["밥", "소고기", "양파"], tastes: ["달콤", "든든함"], spiceLevel: 0, weathers: [], kakaoKeyword: "규동", kakaoCategory: "일식" }), recommendCount7d: 302 },
  { ...menu({ id: "m_48", name: "파스타", cuisine: "양식", category: "면류", ingredients: ["밀", "토마토", "마늘", "올리브"], tastes: ["고소"], spiceLevel: 0, weathers: ["clear"], kakaoKeyword: "파스타", kakaoCategory: "이탈리안" }), recommendCount7d: 377 },
  { ...menu({ id: "m_49", name: "햄버거", cuisine: "패스트푸드", category: "버거", ingredients: ["밀", "소고기", "치즈", "양상추"], tastes: ["고소", "든든함"], spiceLevel: 0, weathers: [], kakaoKeyword: "햄버거", kakaoCategory: "햄버거" }), recommendCount7d: 289 },
  { ...menu({ id: "m_50", name: "포케", cuisine: "샐러드·건강식", category: "샐러드", ingredients: ["밥", "회·날것", "생선", "아보카도"], tastes: ["담백", "시원함"], spiceLevel: 0, weathers: ["hot", "clear"], kakaoKeyword: "포케", kakaoCategory: "샐러드" }), recommendCount7d: 198 },
  { ...menu({ id: "m_51", name: "떡볶이", cuisine: "분식", category: "분식", ingredients: ["떡", "고추장", "어묵"], tastes: ["매콤", "달콤"], spiceLevel: 2, weathers: ["rain"], kakaoKeyword: "떡볶이", kakaoCategory: "분식", visible: false }), recommendCount7d: 0 },
  { ...menu({ id: "m_52", name: "팟타이", cuisine: "아시안", category: "면류", ingredients: ["쌀국수면", "새우", "숙주", "땅콩"], tastes: ["달콤", "고소"], spiceLevel: 1, weathers: [], kakaoKeyword: "팟타이", kakaoCategory: "태국음식" }), recommendCount7d: 241 },
  { ...menu({ id: "m_53", name: "냉모밀", cuisine: "일식", category: "면류", ingredients: ["메밀면", "무", "파"], tastes: ["시원함", "담백"], spiceLevel: 0, weathers: ["hot"], kakaoKeyword: "냉모밀", kakaoCategory: "일식", visible: false }), recommendCount7d: 0 },
];

export const MOCK_ADMIN_MENUS: AdminMenu[] = [
  ...MOCK_MENUS.map((m) => ({ ...m, recommendCount7d: RECOMMEND_7D[m.id] ?? 0 })),
  ...EXTRA_MENUS,
];

// 카카오 장소 검색 목 결과 (광고 등록용). 앞쪽은 Figma A2 표의 식당
export const MOCK_PLACES: SponsoredPlace[] = [
  { placeId: "18342210", name: "엄마손 순두부", address: "서울 강남구 역삼동 130-7", lat: 37.5008, lng: 127.0369, category: "한식 > 찌개,전골" },
  { placeId: "22719904", name: "포 하노이", address: "서울 강남구 역삼동 142-3", lat: 37.5016, lng: 127.0352, category: "아시아음식 > 베트남음식" },
  { placeId: "99301277", name: "카츠 공방", address: "서울 강남구 삼성동 155-2", lat: 37.5089, lng: 127.0598, category: "일식 > 돈까스,우동" },
  { placeId: "55120318", name: "라쿤 마라탕", address: "서울 강남구 논현동 201-11", lat: 37.5112, lng: 127.0281, category: "중식 > 중국요리" },
  { placeId: "2271043", name: "북창동 순두부", address: "서울 강남구 역삼동 123-45", lat: 37.5011, lng: 127.0372, category: "한식 > 찌개,전골" },
  { placeId: "1000001", name: "김치명가 역삼", address: "서울 강남구 역삼동 120-3", lat: 37.5002, lng: 127.0358, category: "한식 > 찌개,전골" },
  { placeId: "1000007", name: "스시 하루", address: "서울 강남구 역삼동 140-8", lat: 37.5021, lng: 127.0378, category: "일식 > 초밥,롤" },
  { placeId: "1000013", name: "강남역 순두부", address: "서울 강남구 역삼동 821-2", lat: 37.4981, lng: 127.0285, category: "한식 > 찌개,전골" },
  { placeId: "1000020", name: "소공동 뚝배기", address: "서울 강남구 역삼동 110-9", lat: 37.4995, lng: 127.0349, category: "한식 > 찌개,전골" },
];

const DAY = 24 * 60 * 60 * 1000;
const dateFromToday = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
const HOURS = { open: "11:00", close: "21:00", break: ["15:00", "16:30"] as [string, string], closedDays: ["sun"] };

// status · targetMenuNames는 서버가 계산해 붙인다
export type MockSponsored = Omit<Sponsored, "status" | "targetMenuNames">;

// 사진은 어드민에서 올린다 (목 시작 데이터는 사진 없음)
export const MOCK_SPONSORED: MockSponsored[] = (
  [
  { id: "sp_1", place: MOCK_PLACES[0], targetMenuIds: ["m_12"], targetCategories: ["찌개류"], radiusM: 1000, startDate: dateFromToday(-14), endDate: dateFromToday(16), hours: HOURS, priority: 1, feeKrw: 300000, paymentStatus: "paid", canceled: false, impressions: 4210, clicks: 312 },
  { id: "sp_2", place: MOCK_PLACES[1], targetMenuIds: ["m_3"], targetCategories: ["아시안"], radiusM: 2000, startDate: dateFromToday(-10), endDate: dateFromToday(20), hours: null, priority: 2, feeKrw: 450000, paymentStatus: "paid", canceled: false, impressions: 2880, clicks: 190 },
  { id: "sp_3", place: MOCK_PLACES[2], targetMenuIds: ["m_21"], targetCategories: ["일식"], radiusM: 1000, startDate: dateFromToday(1), endDate: dateFromToday(30), hours: { ...HOURS, break: null, closedDays: [] }, priority: 1, feeKrw: 300000, paymentStatus: "pending", canceled: false, impressions: 0, clicks: 0 },
  { id: "sp_4", place: MOCK_PLACES[3], targetMenuIds: ["m_30"], targetCategories: ["중식"], radiusM: 2000, startDate: dateFromToday(-45), endDate: dateFromToday(-15), hours: null, priority: 1, feeKrw: 300000, paymentStatus: "paid", canceled: false, impressions: 6540, clicks: 402 },
  ] satisfies Omit<MockSponsored, "imageUrl">[]
).map((s) => ({ ...s, imageUrl: null }));
