// 사용자 화면 경로. 아직 만들지 않은 화면도 미리 정의해 둔다 (검색 · 로그인은 아직 없음)
export const ROUTES = {
  home: "/",
  map: "/map",
  favorites: "/favorites",
  taste: "/taste",
  onboarding: "/onboarding",
  my: "/my",
  search: "/search",
  login: "/login",
  emailLogin: "/login/email",
  signup: "/signup",
  passwordReset: "/password-reset",
} as const;

// 어드민 (사용자 화면과 로그인 · 레이아웃이 따로)
export const ADMIN_ROUTES = {
  root: "/admin",
  login: "/admin/login",
  users: "/admin/users",
  sponsored: "/admin/sponsored",
  menus: "/admin/menus",
  reports: "/admin/reports",
} as const;

// 소셜 로그인(웹)에서 돌아오는 곳: /login/kakao/callback · /login/google/callback
export const socialCallbackRoute = (provider: string) => `/login/${provider}/callback`;

export const mapRoute = (menuId?: string) => (menuId ? `${ROUTES.map}?menuId=${menuId}` : ROUTES.map);

// 로그인 · 온보딩 뒤 돌아갈 곳을 ?next=로 넘긴다
export const withNext = (route: string, next?: string | null) =>
  next && next !== ROUTES.home ? `${route}?next=${encodeURIComponent(next)}` : route;

// 앱 안 경로만 허용 (다른 사이트로 보내는 링크 방지)
export const safeNext = (raw: string | null) => (raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : ROUTES.home);

// 데스크톱 상단 메뉴바
export const DESKTOP_NAV_ITEMS = [
  { href: ROUTES.home, label: "추천" },
  { href: ROUTES.map, label: "지도" },
  { href: ROUTES.favorites, label: "찜한 식당" },
] as const;

// 로그인 · 가입 뒤 갈 곳: 온보딩 전이면 온보딩(끝나면 next로), 아니면 next
export const afterLoginRoute = (onboardingCompleted: boolean, next: string) =>
  onboardingCompleted ? next : withNext(ROUTES.onboarding, next);
