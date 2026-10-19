// API 계약 검사: 로컬 백엔드(lunchtime-be, 4000) 응답을 모아 프론트 타입에 `satisfies`로 넣은 generated.ts를 만든다.
// 이어서 tsc가 빠진 필드 · 남는 필드 · 틀린 값 종류를 잡는다 (npm run check:contract). 확인용 계정 · 리뷰는 끝나면 지운다
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.API_BASE_URL ?? "http://localhost:4000/v1";
const O = { lat: 37.5006, lng: 127.0365 };
const run = Date.now() % 100000;

const samples = []; // [type expression, value, label]
const add = (type, value, label) => samples.push({ type, value, label });

async function call(method, p, { token, body, raw } = {}) {
  const res = await fetch(p.startsWith("http") ? p : API + p, {
    method,
    headers: {
      ...(body !== undefined && !raw && { "Content-Type": "application/json" }),
      ...(raw && { "Content-Type": "image/png" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${p} → ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

(async () => {
  const cleanup = [];
  try {
    // ---------- 사용자 ----------
    const login = await call("POST", "/auth/login", { body: { provider: "kakao", providerToken: `dev:contract-${run}:계약검사` } });
    add("LoginResponse", login, "POST /auth/login");
    const t = login.accessToken;
    const other = await call("POST", "/auth/login", { body: { provider: "kakao", providerToken: `dev:contract2-${run}:옆사람` } });
    cleanup.push(async () => call("DELETE", "/me", { token: other.accessToken }));
    cleanup.push(async () => call("DELETE", "/me", { token: t }));
    add("EmailCodeResponse", await call("POST", "/auth/email/code", { body: { email: `contract${run}@example.com`, purpose: "signup" } }), "POST /auth/email/code");
    add("User", await call("GET", "/me", { token: t }), "GET /me");

    add("PreferenceOptions", await call("GET", "/preferences/options"), "GET /preferences/options");
    const prefs = { dislikedIngredients: ["오이"], allergies: [], spiceLevel: 2, favoriteCuisines: ["한식"] };
    add("Preferences", await call("PUT", "/me/preferences", { token: t, body: prefs }), "PUT /me/preferences");
    add("Preferences", await call("GET", "/me/preferences", { token: t }), "GET /me/preferences");
    add("PreferencePreview", await call("POST", "/preferences/preview", { token: t, body: prefs }), "POST /preferences/preview");
    add("{ items: string[] }", await call("GET", "/ingredients?q=두"), "GET /ingredients");

    const search = await call("GET", `/locations/search?q=${encodeURIComponent("역삼역")}`);
    add("{ items: LocationSearchResult[] }", search, "GET /locations/search");
    add("Neighborhood", await call("GET", `/locations/reverse?lat=${O.lat}&lng=${O.lng}`), "GET /locations/reverse");
    const loc = await call("POST", "/me/locations", { token: t, body: { label: "회사", name: "역삼동", address: "서울 강남구 역삼동", lat: O.lat, lng: O.lng } });
    add("SavedLocation", loc, "POST /me/locations");
    add("{ items: SavedLocation[] }", await call("GET", "/me/locations", { token: t }), "GET /me/locations");

    add("Weather", await call("GET", `/weather?lat=${O.lat}&lng=${O.lng}`), "GET /weather");
    add("RecommendationResponse", await call("GET", `/recommendations?lat=${O.lat}&lng=${O.lng}`, { token: t }), "GET /recommendations (개인)");
    add("RecommendationResponse", await call("GET", `/recommendations?lat=${O.lat}&lng=${O.lng}`), "GET /recommendations (비로그인)");
    add("SearchResponse", await call("GET", `/search?q=${encodeURIComponent("순두부")}&lat=${O.lat}&lng=${O.lng}`, { token: t }), "GET /search");

    const menus = (await call("GET", `/search?q=${encodeURIComponent("찌개")}&lat=${O.lat}&lng=${O.lng}&type=menu`)).menus;
    const menuId = menus[0]?.menu.id;
    const list = await call("GET", `/restaurants?lat=${O.lat}&lng=${O.lng}&limit=50`, { token: t });
    add("RestaurantListResponse", list, "GET /restaurants");
    if (menuId) add("RestaurantListResponse", await call("GET", `/restaurants?lat=${O.lat}&lng=${O.lng}&menuId=${menuId}`, { token: t }), "GET /restaurants?menuId");
    const place = list.items[20];

    await call("PUT", `/me/favorites/${place.placeId}`, { token: t });
    add("CursorPage<Restaurant>", await call("GET", `/me/favorites?lat=${O.lat}&lng=${O.lng}`, { token: t }), "GET /me/favorites");

    add("ReviewForm", await call("GET", `/restaurants/${place.placeId}/review-form`), "GET review-form");
    const slots = await call("POST", "/uploads/review-photos", { token: t, body: { count: 1 } });
    add("{ items: PhotoUploadSlot[] }", slots, "POST /uploads/review-photos");
    await call("PUT", slots.items[0].uploadUrl, { raw: PNG });
    const created = await call("POST", `/restaurants/${place.placeId}/reviews`, {
      token: t,
      body: { rating: 4, menus: ["점심"], tags: ["친절해요"], content: "계약 검사", photoIds: [slots.items[0].photoId] },
    });
    add("CreateReviewResponse", created, "POST reviews");
    const reviewId = created.review.id;
    cleanup.unshift(async () => call("DELETE", `/reviews/${reviewId}`, { token: t }));
    add("CreateReviewResponse", await call("PATCH", `/reviews/${reviewId}`, { token: t, body: { rating: 5 } }), "PATCH /reviews/{id}");
    add("CursorPage<Review>", await call("GET", `/restaurants/${place.placeId}/reviews`, { token: t }), "GET reviews");
    add("CursorPage<Review>", await call("GET", "/me/reviews", { token: t }), "GET /me/reviews");
    add("RestaurantDetail", await call("GET", `/restaurants/${place.placeId}?lat=${O.lat}&lng=${O.lng}`, { token: t }), "GET /restaurants/{id}");
    await call("POST", `/reviews/${reviewId}/reports`, { token: other.accessToken, body: { reason: "ad", memo: "계약 검사" } });

    // ---------- 어드민 ----------
    const adminLogin = await call("POST", "/admin/auth/login", { body: { loginId: "admin", password: "admin1234", otp: "123456" } });
    add("AdminLoginResponse", adminLogin, "POST /admin/auth/login");
    const a = adminLogin.accessToken;
    add("AdminProfile", await call("GET", "/admin/me", { token: a }), "GET /admin/me");
    add("AdminUsersSummary", await call("GET", "/admin/users/summary", { token: a }), "GET /admin/users/summary");
    add("AdminPage<AdminUser>", await call("GET", "/admin/users?size=5", { token: a }), "GET /admin/users");
    const me = await call("GET", "/me", { token: other.accessToken });
    add("AdminUser", await call("POST", `/admin/users/${me.id}/suspend`, { token: a, body: { days: 1, reason: "계약 검사" } }), "POST suspend");
    add("AdminUser", await call("POST", `/admin/users/${me.id}/unsuspend`, { token: a }), "POST unsuspend");
    add("AdminReportsSummary", await call("GET", "/admin/reports/summary", { token: a }), "GET /admin/reports/summary");
    add("AdminPage<ReportGroup>", await call("GET", "/admin/reports?size=5", { token: a }), "GET /admin/reports");
    add("ReportGroup", await call("POST", `/admin/reports/${reviewId}/resolve`, { token: a, body: { action: "dismiss" } }), "POST resolve");
    add("AdminMenusResponse", await call("GET", "/admin/menus?size=3", { token: a }), "GET /admin/menus");
    add("{ items: string[] }", await call("GET", "/admin/ingredients", { token: a }), "GET /admin/ingredients");
    add("AdminSponsoredSummary", await call("GET", "/admin/sponsored/summary", { token: a }), "GET /admin/sponsored/summary");
    add("AdminPage<Sponsored>", await call("GET", "/admin/sponsored?size=5", { token: a }), "GET /admin/sponsored");
    add("{ items: SponsoredPlace[] }", await call("GET", `/admin/places/search?q=${encodeURIComponent("순두부")}&lat=${O.lat}&lng=${O.lng}`, { token: a }), "GET /admin/places/search");
  } finally {
    for (const c of cleanup) await c().catch((e) => console.log("cleanup:", e.message));
  }

  const imports = {
    "@/types/user": ["LoginResponse", "User", "EmailCodeResponse"],
    "@/types/location": ["SavedLocation", "LocationSearchResult", "Neighborhood"],
    "@/types/preferences": ["Preferences", "PreferenceOptions", "PreferencePreview"],
    "@/types/recommendation": ["RecommendationResponse", "SearchResponse"],
    "@/types/weather": ["Weather"],
    "@/types/restaurant": ["RestaurantListResponse", "RestaurantDetail", "Restaurant"],
    "@/types/common": ["CursorPage"],
    "@/types/review": ["Review", "ReviewForm", "PhotoUploadSlot", "CreateReviewResponse"],
    "@/types/admin": ["AdminLoginResponse", "AdminProfile", "AdminUsersSummary", "AdminPage", "AdminUser", "AdminReportsSummary", "ReportGroup", "AdminMenusResponse", "AdminSponsoredSummary", "Sponsored", "SponsoredPlace"],
  };
  const lines = Object.entries(imports).map(([m, names]) => `import type { ${names.join(", ")} } from "${m}";`);
  samples.forEach((s, i) => lines.push(`\n// ${s.label}\nexport const c${i} = ${JSON.stringify(s.value, null, 2)} satisfies ${s.type};`));
  fs.writeFileSync(path.join(__dirname, "generated.ts"), lines.join("\n") + "\n");
  console.log(`captured ${samples.length} responses`);
})().catch((e) => {
  console.log("ERROR", e.message);
  process.exit(1);
});
