// 사용자 화면 경로. 아직 만들지 않은 화면도 미리 정의해 둔다 (지도·찜·취향·MY·검색은 다음 단계)
export const ROUTES = {
  home: "/",
  map: "/map",
  favorites: "/favorites",
  taste: "/taste",
  my: "/my",
  search: "/search",
} as const;

export const mapRoute = (menuId?: string) => (menuId ? `${ROUTES.map}?menuId=${menuId}` : ROUTES.map);

// 데스크톱 상단 메뉴바
export const DESKTOP_NAV_ITEMS = [
  { href: ROUTES.home, label: "추천" },
  { href: ROUTES.map, label: "지도" },
  { href: ROUTES.favorites, label: "찜한 식당" },
] as const;
