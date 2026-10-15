"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { openLocationPicker } from "@/components/domain/LocationPickerModal";
import { mapRoute, ROUTES } from "@/constants/navigation";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { search } from "@/lib/api/recommendations";
import { CurrentLocation, locateCurrentPosition, LocationStatus } from "@/lib/locationStore";
import {
  addRecentSearch,
  getRecentSearches,
  getRecentSearchesServer,
  removeRecentSearch,
  subscribeRecentSearches,
} from "@/lib/recentSearches";
import { MenuSearchItem, SearchType } from "@/types/recommendation";
import { Restaurant } from "@/types/restaurant";
import { MenuSummary } from "@/types/menu";

// 전체 탭에서 식당은 이만큼만 먼저 보여 주고 "식당 n곳 더 보기"
export const SEARCH_PREVIEW_COUNT = 4;
// 검색 반경 (API 기본값과 같다)
export const SEARCH_RADIUS_M = 1000;

export interface UseSearchLogicResult {
  query: string;
  type: SearchType;
  setType: (type: SearchType) => void;
  submit: (q: string) => void;
  status: "idle" | "loading" | "ready" | "error";
  locationStatus: LocationStatus;
  location: CurrentLocation | null;
  menus: MenuSearchItem[];
  restaurants: Restaurant[];
  showAllRestaurants: boolean;
  expandRestaurants: () => void;
  recentSearches: string[];
  removeRecent: (q: string) => void;
  openMenu: (menu: MenuSummary) => void;
  openRestaurant: (restaurant: Restaurant) => void;
  openMap: () => void;
  toggleFavorite: (restaurant: Restaurant) => void;
  openLocationPicker: () => void;
  requestLocationPermission: () => void;
  retry: () => void;
}

interface SearchResult {
  key: string;
  status: "ready" | "error";
  menus: MenuSearchItem[];
  restaurants: Restaurant[];
}

const TYPES: SearchType[] = ["all", "menu", "restaurant"];

// 검색 결과 (기능명세 10): ?q= 검색어, ?type= 탭. 메뉴 · 식당을 한 번에 받아 탭은 화면에서 나눈다(개수 표시 때문)
export function useSearchLogic(): UseSearchLogicResult {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const rawType = params.get("type") as SearchType | null;
  const type = rawType && TYPES.includes(rawType) ? rawType : "all";
  const { status: locationStatus, location } = useCurrentLocation();
  const { applyFavorite, toggleFavorite } = useFavoriteToggle();
  const recentSearches = useSyncExternalStore(subscribeRecentSearches, getRecentSearches, getRecentSearchesServer);
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const key = query && location ? JSON.stringify([query, location.lat, location.lng, retryCount]) : "";

  useEffect(() => {
    if (!key || !location) return;
    let cancelled = false;
    // 메뉴바 · 주소로 바로 들어와도 최근 검색에 남긴다
    addRecentSearch(query);
    search({ q: query, lat: location.lat, lng: location.lng, type: "all" })
      .then((res) => !cancelled && setResult({ key, status: "ready", menus: res.menus, restaurants: res.restaurants }))
      .catch(() => !cancelled && setResult({ key, status: "error", menus: [], restaurants: [] }));
    return () => {
      cancelled = true;
    };
    // key가 검색어 · 위치 · 재시도를 모두 담는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const status = !query ? "idle" : !result || result.key !== key ? "loading" : result.status;
  const settled = status === "ready" && result ? result : null;
  const menus = settled?.menus ?? [];
  const restaurants = (settled?.restaurants ?? []).map(applyFavorite);
  // 지도로 넘길 때: 맞는 메뉴가 있으면 그 메뉴로(근거 · 칩이 살아 있게), 없으면 검색어로
  const firstMenuId = menus[0]?.menu.id;
  const mapQuery = (extra: Record<string, string> = {}) =>
    `${ROUTES.map}?${new URLSearchParams({ ...(firstMenuId ? { menuId: firstMenuId } : { q: query }), ...extra })}`;

  const setParams = (next: { q?: string; type?: SearchType }) => {
    const sp = new URLSearchParams();
    const q = next.q ?? query;
    const t = next.type ?? type;
    if (q) sp.set("q", q);
    if (t !== "all") sp.set("type", t);
    return `${ROUTES.search}${sp.size ? `?${sp}` : ""}`;
  };

  return {
    query,
    type,
    setType: (t) => router.replace(setParams({ type: t }), { scroll: false }),
    submit: (q) => {
      const term = q.trim();
      if (!term) return;
      addRecentSearch(term);
      router.push(setParams({ q: term, type: "all" }));
    },
    status,
    locationStatus,
    location,
    menus,
    restaurants,
    showAllRestaurants: type === "restaurant" || expandedKey === key,
    expandRestaurants: () => setExpandedKey(key),
    recentSearches,
    removeRecent: removeRecentSearch,
    openMenu: (menu) => router.push(mapRoute(menu.id)),
    openRestaurant: (r) => router.push(mapQuery({ placeId: r.placeId })),
    openMap: () => router.push(mapQuery()),
    toggleFavorite,
    openLocationPicker,
    requestLocationPermission: () => locateCurrentPosition(),
    retry: () => setRetryCount((c) => c + 1),
  };
}
