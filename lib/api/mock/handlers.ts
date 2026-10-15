// API.md를 흉내 내는 메모리 목 서버. 새로고침하면 처음 상태로 돌아간다.
import { ApiError, HttpMethod } from "@/lib/api/client";
import { distanceM, walkMinutes } from "@/lib/geo";
import {
  MOCK_ALLERGENS,
  MOCK_FAVORITES,
  MOCK_HOME,
  MOCK_INGREDIENT_DICTIONARY,
  MOCK_LOCATION_SEARCH,
  MOCK_MENU_SCORES,
  MOCK_MENUS,
  MOCK_PREFERENCE_OPTIONS,
  MOCK_PREFERENCES,
  MOCK_RESTAURANTS,
  MOCK_REVIEW_TAGS,
  MOCK_REVIEWS,
  MOCK_SAVED_LOCATIONS,
  MOCK_USER,
  MOCK_WEATHER,
  MockEvidence,
  MockMenuScore,
  MockRestaurant,
} from "@/lib/api/mock/data";
import { getMockScenarios } from "@/lib/api/mock/scenario";
import { ErrorCode, LatLng } from "@/types/common";
import { Menu } from "@/types/menu";
import { PreferencePreview, Preferences, PreferencesInput } from "@/types/preferences";
import {
  AlternativeRecommendation,
  RecommendationReason,
  RecommendationResponse,
  TodayRecommendation,
} from "@/types/recommendation";
import { MenuEvidence, RatingSummary, Restaurant, RestaurantDetail, RestaurantSort } from "@/types/restaurant";
import { ReportReason, Review, ReviewInput, ReviewSort } from "@/types/review";
import { User } from "@/types/user";

const DELAY_MS = 250;

const state = {
  loggedOut: false,
  user: structuredClone(MOCK_USER),
  preferences: structuredClone(MOCK_PREFERENCES),
  savedLocations: structuredClone(MOCK_SAVED_LOCATIONS),
  favorites: structuredClone(MOCK_FAVORITES),
  reviews: structuredClone(MOCK_REVIEWS),
  reviewReports: new Set<string>(), // `${userId}:${reviewId}`
  menuReports: new Set<string>(), // `${userId}:${placeId}:${menuId}`
  tasteSaved: false, // noTaste 시나리오여도 이번 세션에 저장했으면 저장한 값을 쓴다
  nextId: 1000,
};

// ---------- 공통 ----------

function fail(status: number, code: ErrorCode, message: string, fields?: Record<string, string>): never {
  throw new ApiError(status, code, message, fields);
}

function currentUser(): User | null {
  if (state.loggedOut || getMockScenarios().has("guest")) return null;
  return state.user;
}

function requireUser(): User {
  return currentUser() ?? fail(401, "UNAUTHORIZED", "로그인이 필요해요.");
}

function currentPreferences(): Preferences | null {
  if (!currentUser() || (getMockScenarios().has("noTaste") && !state.tasteSaved)) return null;
  const p = state.preferences;
  const hasTaste = p.dislikedIngredients.length || p.allergies.length || p.spiceLevel !== null || p.favoriteCuisines.length;
  return hasTaste ? p : null;
}

function requireCoord(query: URLSearchParams): LatLng {
  const lat = Number(query.get("lat"));
  const lng = Number(query.get("lng"));
  if (!query.get("lat") || !query.get("lng") || Number.isNaN(lat) || Number.isNaN(lng)) {
    fail(400, "LOCATION_REQUIRED", "위치를 알려 주세요.");
  }
  // 대략적인 국내 범위
  if (lat < 33 || lat > 39 || lng < 124 || lng > 132) fail(422, "OUT_OF_SERVICE_AREA", "국내에서만 쓸 수 있어요.");
  return { lat, lng };
}

function paginate<T>(items: T[], query: URLSearchParams): { items: T[]; nextCursor: string | null } {
  const offset = Number(query.get("cursor") ?? 0) || 0;
  const limit = Math.min(Number(query.get("limit") ?? 20) || 20, 50);
  const page = items.slice(offset, offset + limit);
  return { items: page, nextCursor: offset + limit < items.length ? String(offset + limit) : null };
}

function newId(prefix: string): string {
  state.nextId += 1;
  return `${prefix}_${state.nextId}`;
}

const todayKst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const nowKst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, "+09:00");

// ---------- 식당 ----------

function menuById(id: string | null): Menu | undefined {
  return MOCK_MENUS.find((m) => m.id === id);
}

function activeReviews(placeId?: string): Review[] {
  return state.reviews.filter((r) => !placeId || r.placeId === placeId);
}

function placeStats(placeId: string): { rating: number | null; reviewCount: number } {
  const list = activeReviews(placeId);
  if (!list.length) return { rating: null, reviewCount: 0 };
  const avg = list.reduce((sum, r) => sum + r.rating, 0) / list.length;
  return { rating: Math.round(avg * 10) / 10, reviewCount: list.length };
}

function evidenceLabel(e: MockEvidence, menu: Menu): string {
  switch (e.type) {
    case "owner":
      return "사장님이 등록한 대표 메뉴예요";
    case "review":
      return `리뷰 ${e.count}명이 ${menu.kakaoKeyword}를 먹었어요`;
    case "name":
      return "식당 이름으로 찾은 식당";
    case "keyword":
      return `카카오 검색에서 '${menu.kakaoKeyword}'로 나온 식당`;
    case "category":
      return `카테고리(${menu.kakaoCategory})로 찾은 식당`;
  }
}

function toRestaurant(seed: MockRestaurant, origin: LatLng, menuId: string | null): Restaurant {
  const { evidence, sponsoredMenuIds, cuisine: _cuisine, ...base } = seed;
  void _cuisine;
  const menu = menuById(menuId);
  const e = menu ? evidence[menu.id] : undefined;
  const d = distanceM(origin, seed);
  const user = currentUser();
  return {
    ...base,
    ...placeStats(seed.placeId),
    distanceM: d,
    walkMinutes: walkMinutes(d),
    isFavorite: !!user && state.favorites.some((f) => f.placeId === seed.placeId),
    // 광고는 노출 메뉴가 맞을 때만 광고로 표시
    sponsored: seed.sponsored && !!menu && sponsoredMenuIds.includes(menu.id),
    menuEvidence: menu && e ? ({ ...e, label: evidenceLabel(e, menu) } satisfies MenuEvidence) : null,
  };
}

// API.md 정렬: 광고 → 리뷰·사장님 확인 → 이름 일치 → 키워드 일치(카테고리 불일치는 맨 뒤) → 카테고리만 일치(최대 5곳)
function evidenceTier(r: Restaurant, menu: Menu): number {
  if (r.sponsored) return 0;
  const e = r.menuEvidence;
  if (!e) return 9;
  if (e.verified) return 1;
  if (e.type === "name") return 2;
  if (e.type === "keyword") return r.categoryPath.includes(menu.kakaoCategory) ? 3 : 4;
  return 5;
}

function sortRestaurants(list: Restaurant[], sort: RestaurantSort, menu: Menu | undefined): Restaurant[] {
  const bySort = (a: Restaurant, b: Restaurant) =>
    sort === "reviews" ? b.reviewCount - a.reviewCount || a.distanceM - b.distanceM : a.distanceM - b.distanceM;
  if (!menu) return [...list].sort((a, b) => Number(b.sponsored) - Number(a.sponsored) || bySort(a, b));
  const sorted = [...list].sort((a, b) => evidenceTier(a, menu) - evidenceTier(b, menu) || bySort(a, b));
  let categoryOnly = 0;
  return sorted.filter((r) => evidenceTier(r, menu) !== 5 || ++categoryOnly <= 5);
}

// 역삼(목 식당이 있는 곳)에서 3km 넘게 떨어진 곳을 검색하면 그 주변에 가상 식당을 만든다.
// 지도를 옮겨 [이 지역에서 다시 검색]하는 흐름을 목으로도 확인하기 위한 것. 좌표를 약 1km 칸으로 반올림해서
// 같은 곳은 항상 같은 식당이 나온다. 실서버에서는 카카오 로컬 결과가 이 자리를 대신한다
const generatedSeeds = new Map<string, MockRestaurant>();

function generatedAround(origin: LatLng): MockRestaurant[] {
  if (distanceM(origin, MOCK_HOME) <= 3000) return [];
  const cellLat = Math.round(origin.lat * 100) / 100;
  const cellLng = Math.round(origin.lng * 100) / 100;
  return MOCK_MENUS.map((menu, i) => {
    const placeId = `g_${cellLat}_${cellLng}_${i}`;
    const cached = generatedSeeds.get(placeId);
    if (cached) return cached;
    const angle = (i / MOCK_MENUS.length) * 2 * Math.PI;
    const r = 0.002 + (i % 3) * 0.0015; // 약 200~500m
    const cuisine = ["일식", "중식", "아시안"].includes(menu.category) ? menu.category : "한식";
    const seed: MockRestaurant = {
      placeId,
      name: `동네 ${menu.kakaoKeyword}집`,
      category: cuisine,
      categoryPath: `음식점 > ${cuisine} > ${menu.kakaoCategory}`,
      cuisine,
      mainMenu: menu.kakaoKeyword,
      address: "목 데이터 · 가상 식당",
      phone: null,
      lat: cellLat + r * Math.sin(angle),
      lng: cellLng + r * 1.25 * Math.cos(angle),
      openNow: null,
      hours: null,
      imageUrl: null,
      kakaoMapUrl: `https://place.map.kakao.com/${placeId}`,
      sponsored: false,
      sponsoredMenuIds: [],
      evidence: { [menu.id]: { type: "name", count: null, verified: false } },
    };
    generatedSeeds.set(placeId, seed);
    return seed;
  });
}

function findSeed(placeId: string): MockRestaurant | undefined {
  return MOCK_RESTAURANTS.find((r) => r.placeId === placeId) ?? generatedSeeds.get(placeId);
}

function searchRestaurants(
  origin: LatLng,
  opts: { menuId?: string | null; q?: string | null; radiusM?: number; minRating?: number; sort?: RestaurantSort },
): Restaurant[] {
  if (getMockScenarios().has("noRestaurants")) return [];
  const menu = menuById(opts.menuId ?? null);
  const radius = Math.min(opts.radiusM ?? 1000, 3000);
  const q = opts.q?.trim();
  const list = [...MOCK_RESTAURANTS, ...generatedAround(origin)]
    .filter((seed) => (menu ? !!seed.evidence[menu.id] : true))
    .filter((seed) => !q || [seed.name, seed.mainMenu ?? "", seed.categoryPath].some((s) => s.includes(q)))
    .map((seed) => toRestaurant(seed, origin, menu?.id ?? null))
    .filter((r) => r.distanceM <= radius)
    .filter((r) => opts.minRating === undefined || (r.rating ?? 0) >= opts.minRating);
  return sortRestaurants(list, opts.sort ?? "distance", menu);
}

function withIsMine(review: Review): Review {
  return { ...review, isMine: review.author.id === currentUser()?.id };
}

function sortReviews(list: Review[], sort: ReviewSort): Review[] {
  const byDate = (a: Review, b: Review) => b.createdAt.localeCompare(a.createdAt);
  switch (sort) {
    case "rating_desc":
      return [...list].sort((a, b) => b.rating - a.rating || byDate(a, b));
    case "rating_asc":
      return [...list].sort((a, b) => a.rating - b.rating || byDate(a, b));
    case "photo":
      return list.filter((r) => r.photos.length).sort(byDate);
    default:
      return [...list].sort(byDate);
  }
}

// ---------- 추천 ----------

const CUISINE_OF_CATEGORY: Record<string, string> = { 찌개류: "한식", 면류: "한식", 국밥: "한식" };

// 취향 미리보기: 메뉴 재료 · 맵기 · 종류로 대략 점수를 매긴다 (실제 계산은 서버가 정한다)
function previewTaste(p: Preferences): PreferencePreview {
  const recommended: PreferencePreview["recommended"] = [];
  const excluded: PreferencePreview["excluded"] = [];
  for (const m of MOCK_MENUS) {
    const menu = { id: m.id, name: m.name, imageUrl: m.imageUrl };
    const disliked = p.dislikedIngredients.find((i) => m.ingredients.includes(i));
    const allergy = p.allergies.find((a) => (MOCK_ALLERGENS[a] ?? [a]).some((i) => m.ingredients.includes(i)));
    const tooSpicy = p.spiceLevel === 0 && m.spiceLevel >= 2;
    if (disliked || allergy || tooSpicy) {
      const reason = disliked ?? (allergy ? `${allergy.replace(/ (.*)$/, "")} 알레르기` : "매운맛");
      excluded.push({ menu, reason });
      continue;
    }
    const cuisine = CUISINE_OF_CATEGORY[m.category] ?? m.category;
    const popularRank = MOCK_MENU_SCORES.find((s) => s.menuId === m.id)?.popularRank ?? 10;
    let score = 62 + (10 - popularRank);
    if (p.favoriteCuisines.length) score += p.favoriteCuisines.includes(cuisine) ? 18 : -6;
    if (p.spiceLevel !== null) score += 12 - 6 * Math.abs(m.spiceLevel - p.spiceLevel);
    recommended.push({ menu, matchPercent: Math.max(40, Math.min(98, score)) });
  }
  recommended.sort((a, b) => b.matchPercent - a.matchPercent);
  return { recommended: recommended.slice(0, 3), excluded: excluded.slice(0, 4) };
}

function rankedScores(personal: boolean, exclude: string[]): MockMenuScore[] {
  return MOCK_MENU_SCORES
    .filter((s) => !exclude.includes(s.menuId))
    .filter((s) => !personal || !s.excludedByTaste)
    .sort((a, b) => (personal ? b.matchPercent - a.matchPercent : a.popularRank - b.popularRank));
}

function recommend(query: URLSearchParams): RecommendationResponse {
  const origin = requireCoord(query);
  const radiusM = Number(query.get("radiusM") ?? 1000);
  const exclude = query.get("excludeMenuIds")?.split(",") ?? [];
  const user = currentUser();
  const personal = !!currentPreferences();
  const weather = getMockScenarios().has("noWeather") ? null : MOCK_WEATHER;

  // 근처 식당이 있는 후보만 골라 5개가 차면 멈춘다
  const picked: { score: MockMenuScore; restaurants: Restaurant[] }[] = [];
  for (const score of rankedScores(personal, exclude)) {
    const restaurants = searchRestaurants(origin, { menuId: score.menuId, radiusM });
    if (restaurants.length) picked.push({ score, restaurants });
    if (picked.length === 5) break;
  }

  const location = { ...origin, name: nearestNeighborhood(origin) };
  if (!picked.length) {
    return { mode: personal ? "personal" : "popular", promptTaste: !personal, location, weather, today: null, alternatives: [], suggestRadiusM: 3000 };
  }

  if (user) state.user.stats.recommendationCount += 1;
  const summary = (s: MockMenuScore) => {
    const m = menuById(s.menuId)!;
    return { id: m.id, name: m.name, imageUrl: m.imageUrl };
  };
  const [first, ...rest] = picked;

  const reasons: RecommendationReason[] = personal
    ? first.score.reasons.filter((r) => weather || r.type !== "weather")
    : [{ type: "popular", label: `이 근처 인기 ${first.score.popularRank}위` }];
  reasons.push({ type: "nearby", label: `주변 ${first.restaurants.length}곳` });

  const today: TodayRecommendation = {
    menu: summary(first.score),
    matchPercent: personal ? first.score.matchPercent : null,
    popularRank: personal ? null : first.score.popularRank,
    // popular 모드 설명 문구는 Figma 12 Home(취향 미입력) 기준
    description: personal ? first.score.description : "이 근처에서 점심으로 많이 고른 메뉴예요. 취향을 알려주면 나에게 맞춰 추천해요.",
    reasons,
    nearbyCount: first.restaurants.length,
    restaurants: first.restaurants.slice(0, 4),
  };
  const alternatives: AlternativeRecommendation[] = rest.map(({ score, restaurants }) => ({
    menu: summary(score),
    matchPercent: personal ? score.matchPercent : null,
    popularRank: personal ? null : score.popularRank,
    nearbyCount: restaurants.length,
  }));

  return { mode: personal ? "personal" : "popular", promptTaste: !personal, location, weather, today, alternatives, suggestRadiusM: null };
}

function nearestNeighborhood(origin: LatLng): string {
  const nearest = [...MOCK_LOCATION_SEARCH].sort((a, b) => distanceM(origin, a) - distanceM(origin, b))[0];
  return distanceM(origin, nearest) < 3000 ? nearest.name : "현재 위치";
}

// ---------- 리뷰 검증 ----------

function validateReview(input: Partial<ReviewInput>): void {
  if (!Number.isInteger(input.rating) || input.rating! < 1 || input.rating! > 5) {
    fail(400, "VALIDATION_FAILED", "별점을 선택해 주세요.", { rating: "1~5 정수" });
  }
  if ((input.menus?.length ?? 0) > 10 || (input.tags?.length ?? 0) > 10) {
    fail(400, "VALIDATION_FAILED", "메뉴와 태그는 10개까지 고를 수 있어요.");
  }
  if ((input.content?.length ?? 0) > 500) fail(400, "REVIEW_TOO_LONG", "후기는 500자까지 쓸 수 있어요.");
  if ((input.photoIds?.length ?? 0) > 5) fail(400, "TOO_MANY_PHOTOS", "사진은 5장까지 올릴 수 있어요.");
}

function ownReview(id: string): Review {
  const user = requireUser();
  const review = state.reviews.find((r) => r.id === id) ?? fail(404, "NOT_FOUND", "리뷰를 찾을 수 없어요.");
  if (review.author.id !== user.id) fail(403, "FORBIDDEN", "내 리뷰만 고칠 수 있어요.");
  return review;
}

// ---------- 라우트 ----------

interface Ctx {
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
}
type Handler = (ctx: Ctx) => unknown;

const routes: Record<string, Handler> = {
  // 인증 · 내 정보
  "POST /auth/login": () => {
    state.loggedOut = false;
    const { id, name, provider, role, onboardingCompleted } = state.user;
    return { accessToken: "mock-access", refreshToken: "mock-refresh", isNewUser: false, user: { id, name, provider, role, onboardingCompleted } };
  },
  "POST /auth/refresh": () => ({ accessToken: "mock-access", refreshToken: "mock-refresh" }),
  "POST /auth/logout": () => {
    state.loggedOut = true;
  },
  "GET /me": () => {
    const user = requireUser();
    const scenarios = getMockScenarios();
    return {
      ...user,
      stats: {
        reviewCount: scenarios.has("noReviews") ? 0 : state.reviews.filter((r) => r.author.id === user.id).length,
        favoriteCount: scenarios.has("noFavorites") ? 0 : state.favorites.length,
        recommendationCount: user.stats.recommendationCount,
      },
    };
  },
  "DELETE /me": () => {
    requireUser();
    state.loggedOut = true;
  },
  "GET /me/preferences": () => {
    requireUser();
    return currentPreferences() ?? { dislikedIngredients: [], allergies: [], spiceLevel: null, favoriteCuisines: [] };
  },
  "PUT /me/preferences": ({ body }) => {
    const user = requireUser();
    const { completeOnboarding, ...prefs } = body as PreferencesInput;
    state.preferences = prefs;
    state.tasteSaved = true;
    if (completeOnboarding) user.onboardingCompleted = true;
    return prefs;
  },
  "GET /preferences/options": () => MOCK_PREFERENCE_OPTIONS,
  "POST /preferences/preview": ({ body }) => previewTaste(body as Preferences),
  "GET /ingredients": ({ query }) => {
    const q = query.get("q")?.trim() ?? "";
    return { items: q ? MOCK_INGREDIENT_DICTIONARY.filter((i) => i.includes(q)) : [] };
  },
  "GET /me/locations": () => {
    requireUser();
    return { items: state.savedLocations };
  },
  "POST /me/locations": ({ body }) => {
    requireUser();
    const location = { id: newId("loc"), ...(body as object) };
    state.savedLocations.push(location as (typeof state.savedLocations)[number]);
    return location;
  },
  "DELETE /me/locations/:id": ({ params }) => {
    requireUser();
    state.savedLocations = state.savedLocations.filter((l) => l.id !== params.id);
  },
  "GET /locations/search": ({ query }) => {
    const q = query.get("q")?.trim() ?? "";
    return { items: q ? MOCK_LOCATION_SEARCH.filter((l) => l.name.includes(q) || l.address.includes(q)) : [] };
  },
  "GET /locations/reverse": ({ query }) => {
    const origin = requireCoord(query);
    return { ...origin, name: nearestNeighborhood(origin) };
  },

  // 추천 · 날씨 · 검색
  "GET /recommendations": ({ query }) => recommend(query),
  "GET /weather": ({ query }) => {
    requireCoord(query);
    if (getMockScenarios().has("noWeather")) fail(502, "UPSTREAM_UNAVAILABLE", "날씨 정보를 불러오지 못했어요.");
    return MOCK_WEATHER;
  },
  "GET /search": ({ query }) => {
    const origin = requireCoord(query);
    const q = query.get("q")?.trim() ?? "";
    const type = query.get("type") ?? "all";
    const personal = !!currentPreferences();
    const menus = MOCK_MENUS.filter((m) => q && (m.name.includes(q) || m.kakaoKeyword.includes(q))).map((m) => {
      const score = MOCK_MENU_SCORES.find((s) => s.menuId === m.id);
      return {
        menu: { id: m.id, name: m.name, imageUrl: m.imageUrl },
        matchPercent: personal && score && !score.excludedByTaste ? score.matchPercent : null,
        nearbyCount: searchRestaurants(origin, { menuId: m.id }).length,
      };
    });
    const restaurants = q ? searchRestaurants(origin, { q }) : [];
    return { menus: type === "restaurant" ? [] : menus, restaurants: type === "menu" ? [] : restaurants };
  },

  // 식당 · 찜
  "GET /restaurants": ({ query }) => {
    const origin = requireCoord(query);
    const items = searchRestaurants(origin, {
      menuId: query.get("menuId"),
      q: query.get("q"),
      radiusM: query.get("radiusM") ? Number(query.get("radiusM")) : undefined,
      minRating: query.get("minRating") ? Number(query.get("minRating")) : undefined,
      sort: (query.get("sort") as RestaurantSort | null) ?? "distance",
    });
    const menu = menuById(query.get("menuId"));
    return {
      ...paginate(items, query),
      total: items.length,
      menu: menu ? { id: menu.id, name: menu.name, keyword: menu.kakaoKeyword } : null,
    };
  },
  "GET /restaurants/:placeId": ({ params }): RestaurantDetail => {
    const seed = findSeed(params.placeId) ?? fail(404, "NOT_FOUND", "식당을 찾을 수 없어요.");
    const reviews = activeReviews(seed.placeId);
    const ratingSummary: RatingSummary = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) ratingSummary[r.rating as keyof RatingSummary] += 1;
    return {
      ...toRestaurant(seed, MOCK_HOME, null),
      recentReviews: sortReviews(reviews, "recent").slice(0, 2).map(withIsMine),
      ratingSummary,
    };
  },
  "GET /me/favorites": ({ query }) => {
    requireUser();
    if (getMockScenarios().has("noFavorites")) return { items: [], nextCursor: null };
    const cuisine = query.get("cuisine");
    const origin = query.get("lat") && query.get("lng") ? requireCoord(query) : MOCK_HOME;
    const items = [...state.favorites]
      .sort((a, b) => b.favoritedAt.localeCompare(a.favoritedAt))
      .map((f) => findSeed(f.placeId)!)
      .filter((seed) => !cuisine || cuisine === "전체" || seed.cuisine === cuisine)
      .map((seed) => toRestaurant(seed, origin, null));
    return paginate(items, query);
  },
  "PUT /me/favorites/:placeId": ({ params }) => {
    requireUser();
    if (!state.favorites.some((f) => f.placeId === params.placeId)) {
      state.favorites.push({ placeId: params.placeId, favoritedAt: nowKst() });
    }
  },
  "DELETE /me/favorites/:placeId": ({ params }) => {
    requireUser();
    state.favorites = state.favorites.filter((f) => f.placeId !== params.placeId);
  },
  "POST /restaurants/:placeId/click": () => undefined,
  "POST /restaurants/:placeId/menu-reports": ({ params, body }) => {
    const user = requireUser();
    const key = `${user.id}:${params.placeId}:${(body as { menuId: string }).menuId}`;
    if (state.menuReports.has(key)) fail(409, "ALREADY_REPORTED_MENU", "이미 제보했어요.");
    state.menuReports.add(key);
  },

  // 리뷰 · 신고
  "GET /restaurants/:placeId/reviews": ({ params, query }) => {
    const sort = (query.get("sort") as ReviewSort | null) ?? "recent";
    return paginate(sortReviews(activeReviews(params.placeId), sort).map(withIsMine), query);
  },
  "GET /restaurants/:placeId/review-form": ({ params }) => {
    const seed = findSeed(params.placeId) ?? fail(404, "NOT_FOUND", "식당을 찾을 수 없어요.");
    const fromMaster = MOCK_MENUS.filter((m) => seed.categoryPath.includes(m.kakaoCategory)).map((m) => m.kakaoKeyword);
    const fromReviews = activeReviews(seed.placeId).flatMap((r) => r.menus);
    const menus = [...new Set([seed.mainMenu, ...fromReviews, ...fromMaster].filter((m): m is string => !!m))];
    return { menus, tags: MOCK_REVIEW_TAGS };
  },
  "POST /uploads/review-photos": ({ body }) => {
    requireUser();
    const count = (body as { count: number }).count;
    if (count > 5) fail(400, "TOO_MANY_PHOTOS", "사진은 5장까지 올릴 수 있어요.");
    return { items: Array.from({ length: count }, () => ({ photoId: newId("ph"), uploadUrl: "https://upload.mock/photo" })) };
  },
  "POST /restaurants/:placeId/reviews": ({ params, body }) => {
    const user = requireUser();
    const input = body as ReviewInput;
    validateReview(input);
    const seed = findSeed(params.placeId) ?? fail(404, "NOT_FOUND", "식당을 찾을 수 없어요.");
    const today = todayKst();
    if (state.reviews.some((r) => r.author.id === user.id && r.placeId === seed.placeId && r.createdAt.startsWith(today))) {
      fail(409, "REVIEW_DAILY_LIMIT", "이 식당에는 오늘 이미 리뷰를 썼어요.");
    }
    const review: Review = {
      id: newId("r"), placeId: seed.placeId, placeName: seed.name, author: { id: user.id, name: user.name },
      rating: input.rating, menus: input.menus, tags: input.tags, content: input.content,
      photos: input.photoIds.map((id) => ({ id, url: "" })), createdAt: nowKst(), isMine: true,
    };
    state.reviews.push(review);
    return { review, placeStats: placeStats(seed.placeId) };
  },
  "GET /me/reviews": ({ query }) => {
    const user = requireUser();
    if (getMockScenarios().has("noReviews")) return { items: [], nextCursor: null };
    return paginate(sortReviews(state.reviews.filter((r) => r.author.id === user.id), "recent").map(withIsMine), query);
  },
  "PATCH /reviews/:id": ({ params, body }) => {
    const review = ownReview(params.id);
    const patch = body as Partial<ReviewInput>;
    validateReview({ ...review, photoIds: review.photos.map((p) => p.id), ...patch });
    const { photoIds, ...rest } = patch;
    Object.assign(review, rest, photoIds && { photos: photoIds.map((id) => ({ id, url: "" })) });
    return { review: withIsMine(review), placeStats: placeStats(review.placeId) };
  },
  "DELETE /reviews/:id": ({ params }) => {
    const review = ownReview(params.id);
    state.reviews = state.reviews.filter((r) => r.id !== review.id);
  },
  "POST /reviews/:id/reports": ({ params, body }) => {
    const user = requireUser();
    const review = state.reviews.find((r) => r.id === params.id) ?? fail(404, "NOT_FOUND", "리뷰를 찾을 수 없어요.");
    if (review.author.id === user.id) fail(403, "FORBIDDEN", "내 리뷰는 신고할 수 없어요.");
    const { reason, memo } = body as { reason: ReportReason; memo: string | null };
    if (!reason) fail(400, "VALIDATION_FAILED", "신고 사유를 골라 주세요.", { reason: "필수" });
    if ((memo?.length ?? 0) > 200) fail(400, "VALIDATION_FAILED", "메모는 200자까지 쓸 수 있어요.", { memo: "최대 200자" });
    const key = `${user.id}:${review.id}`;
    if (state.reviewReports.has(key)) fail(409, "ALREADY_REPORTED", "이미 신고한 리뷰예요.");
    state.reviewReports.add(key);
  },
};

function match(method: HttpMethod, path: string): { handler: Handler; params: Record<string, string> } | null {
  const parts = path.split("/").filter(Boolean);
  for (const [key, handler] of Object.entries(routes)) {
    const [m, pattern] = key.split(" ");
    if (m !== method) continue;
    const segs = pattern.split("/").filter(Boolean);
    if (segs.length !== parts.length) continue;
    const params: Record<string, string> = {};
    const ok = segs.every((seg, i) => {
      if (seg.startsWith(":")) {
        params[seg.slice(1)] = decodeURIComponent(parts[i]);
        return true;
      }
      return seg === parts[i];
    });
    if (ok) return { handler, params };
  }
  return null;
}

export async function handleMock(method: HttpMethod, path: string, query: URLSearchParams, body: unknown): Promise<unknown> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  const found = match(method, path);
  if (!found) fail(404, "NOT_FOUND", `목에 없는 API예요: ${method} ${path}`);
  const result = found.handler({ params: found.params, query, body });
  // 화면에서 응답 객체를 고쳐도 목 상태가 바뀌지 않게 복사
  return result === undefined ? undefined : structuredClone(result);
}
