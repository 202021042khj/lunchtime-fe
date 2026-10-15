"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { openLocationPicker } from "@/components/domain/LocationPickerModal";
import { openReportReview } from "@/components/domain/ReportReviewModal";
import { openWriteReview } from "@/components/domain/WriteReviewModal";
import { notify } from "@/components/ui/notify/notify-utils";
import { ROUTES } from "@/constants/navigation";
import { DEFAULT_RADIUS_M, EXPANDED_RADIUS_M } from "@/constants/recommendation";
import { useCopyClipboard } from "@/hooks/useCopyClipboard";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { ApiError } from "@/lib/api/client";
import { getRestaurant, getRestaurants, reportMenuNotSold, trackSponsoredClick } from "@/lib/api/restaurants";
import { formatRadius } from "@/lib/format";
import { distanceM } from "@/lib/geo";
import { CurrentLocation, LocationStatus, locateCurrentPosition } from "@/lib/locationStore";
import { LatLng } from "@/types/common";
import { Restaurant, RestaurantDetail, RestaurantSort, SearchedMenu } from "@/types/restaurant";
import { Review } from "@/types/review";

// 지도를 이만큼 이상 옮기면 [이 지역에서 다시 검색]을 띄운다
const RESEARCH_THRESHOLD_M = 200;

export interface MapFilters {
  menuOn: boolean; // 메뉴 칩 (끄면 메뉴 상관없이 근처 식당)
  within1km: boolean; // 켜면 1km, 끄면 3km
  minRating4: boolean;
  sort: RestaurantSort;
}

export interface UseMapLogicResult {
  locationStatus: LocationStatus;
  location: CurrentLocation | null;
  menu: SearchedMenu | null;
  query: string | null;
  filters: MapFilters;
  radiusM: number;
  title: string; // 얼큰 순두부찌개 · "순두부" 검색 결과 · 근처 식당
  summary: string; // 역삼동 반경 1km · 식당 7곳
  restaurants: Restaurant[];
  total: number;
  status: "loading" | "ready" | "error";
  hasMore: boolean;
  isLoadingMore: boolean;
  // 바뀌면 지도를 결과에 맞춘다. 검색 중심은 빠져 있어서 [이 지역에서 다시 검색]은 지도를 움직이지 않는다
  fitKey: string;
  fitCenter: LatLng | null;
  showResearch: boolean;
  selected: Restaurant | null;
  detail: RestaurantDetail | null;
  toggleMenuFilter: () => void;
  toggleWithin1km: () => void;
  toggleMinRating: () => void;
  setSort: (sort: RestaurantSort) => void;
  loadMore: () => void;
  retry: () => void;
  onUserMove: (center: LatLng) => void;
  researchHere: () => void;
  select: (placeId: string) => void;
  closeDetail: () => void;
  toggleFavorite: (restaurant: Restaurant) => void;
  share: (restaurant: Restaurant) => void;
  // 리뷰 모두 보기(상세 패널 자리)를 열었는지. URL ?view=reviews
  showReviews: boolean;
  // 리뷰를 등록하면 올라간다 → 상세·리뷰 목록을 다시 불러온다
  reviewsVersion: number;
  openAllReviews: () => void;
  closeReviews: () => void;
  writeReview: (restaurant: Restaurant) => void;
  shareReview: (review: Review) => void;
  reportReview: (review: Review) => void;
  reportMenu: (restaurant: Restaurant) => void;
  expandRadius: () => void;
  goHome: () => void;
  goBack: () => void;
  locateMe: () => void;
  openLocationPicker: () => void;
  requestLocationPermission: () => void;
}

interface ListResult {
  key: string;
  items: Restaurant[];
  total: number;
  nextCursor: string | null;
  menu: SearchedMenu | null;
  failed?: boolean;
}

export function useMapLogic(): UseMapLogicResult {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const menuId = params.get("menuId");
  const query = params.get("q");
  const selectedId = params.get("placeId");
  const view = params.get("view");

  const { status: locationStatus, location } = useCurrentLocation();
  const { applyFavorite, toggleFavorite } = useFavoriteToggle();
  const { copy } = useCopyClipboard();

  const [filters, setFilters] = useState<MapFilters>({ menuOn: true, within1km: true, minRating4: false, sort: "distance" });
  // 다시 검색한 지역. 기준 위치가 바뀌면(동네 변경) 자동으로 무시된다
  const [area, setArea] = useState<{ baseKey: string; center: LatLng } | null>(null);
  const [movedCenter, setMovedCenter] = useState<LatLng | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<ListResult>({ key: "", items: [], total: 0, nextCursor: null, menu: null });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [knownMenu, setKnownMenu] = useState<SearchedMenu | null>(null);
  const [detailResult, setDetailResult] = useState<{ placeId: string; detail: RestaurantDetail } | null>(null);
  const [reviewsVersion, setReviewsVersion] = useState(0);
  // 리뷰를 등록한 식당은 서버가 돌려준 별점·리뷰 수로 바로 바꿔 보여 준다
  const [statsOverrides, setStatsOverrides] = useState<Record<string, { rating: number | null; reviewCount: number }>>({});

  const locationKey = location ? `${location.lat},${location.lng}` : "";
  const searchCenter = area && area.baseKey === locationKey ? area.center : location;
  const radiusM = filters.within1km ? DEFAULT_RADIUS_M : EXPANDED_RADIUS_M;
  const activeMenuId = filters.menuOn ? menuId : null;

  const requestKey = searchCenter
    ? JSON.stringify([searchCenter.lat, searchCenter.lng, radiusM, activeMenuId, query, filters.minRating4, filters.sort, retryCount])
    : "";

  useEffect(() => {
    if (!searchCenter) return;
    let cancelled = false;
    getRestaurants({
      lat: searchCenter.lat,
      lng: searchCenter.lng,
      radiusM,
      menuId: activeMenuId ?? undefined,
      q: activeMenuId ? undefined : (query ?? undefined),
      minRating: filters.minRating4 ? 4 : undefined,
      sort: filters.sort,
    })
      .then((res) => {
        if (cancelled) return;
        setResult({ key: requestKey, items: res.items, total: res.total, nextCursor: res.nextCursor, menu: res.menu });
        if (res.menu) setKnownMenu(res.menu);
      })
      .catch(() => {
        if (!cancelled) setResult({ key: requestKey, items: [], total: 0, nextCursor: null, menu: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
    // requestKey가 검색 조건을 모두 담는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  // 선택한 식당 상세 (최근 리뷰·별점 분포)
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    getRestaurant(selectedId)
      .then((detail) => {
        if (!cancelled) setDetailResult({ placeId: selectedId, detail });
      })
      .catch(() => {
        if (!cancelled) notify.error("식당 정보를 불러오지 못했어요.");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, reviewsVersion]);

  const settled = result.key === requestKey;
  const status = !settled ? "loading" : result.failed ? "error" : "ready";
  const restaurants = useMemo(
    () => result.items.map((r) => applyFavorite(r.placeId in statsOverrides ? { ...r, ...statsOverrides[r.placeId] } : r)),
    [result.items, applyFavorite, statsOverrides],
  );
  const detail = detailResult && detailResult.placeId === selectedId ? applyFavorite(detailResult.detail) : null;
  // 목록에 있으면 목록 값(거리·근거 포함), 없으면(링크로 바로 들어온 경우) 상세 값
  const selected = restaurants.find((r) => r.placeId === selectedId) ?? detail ?? null;

  const setParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const select = (placeId: string) => {
    if (placeId === selectedId) return;
    setParams({ placeId, view: null });
    const target = restaurants.find((r) => r.placeId === placeId);
    if (target?.sponsored) trackSponsoredClick(placeId).catch(() => {});
  };

  const loadMore = async () => {
    if (!result.nextCursor || !searchCenter || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await getRestaurants({
        lat: searchCenter.lat,
        lng: searchCenter.lng,
        radiusM,
        menuId: activeMenuId ?? undefined,
        q: activeMenuId ? undefined : (query ?? undefined),
        minRating: filters.minRating4 ? 4 : undefined,
        sort: filters.sort,
        cursor: result.nextCursor,
      });
      setResult((prev) => (prev.key === requestKey ? { ...prev, items: [...prev.items, ...res.items], nextCursor: res.nextCursor } : prev));
    } catch {
      notify.error("식당을 더 불러오지 못했어요.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Web Share가 있으면 OS 공유 창, 없으면 링크 복사
  const shareLink = async (title: string, query: Record<string, string>) => {
    const url = `${window.location.origin}${pathname}?${new URLSearchParams({ ...(menuId && { menuId }), ...query })}`;
    if (navigator.share) {
      await navigator.share({ title, text: `${title} · lunchtime`, url }).catch(() => {});
      return;
    }
    await copy(url);
    notify.success("링크를 복사했어요.");
  };

  const share = (restaurant: Restaurant) => shareLink(restaurant.name, { placeId: restaurant.placeId });

  const writeReview = (restaurant: Restaurant) =>
    openWriteReview(restaurant, ({ placeStats }) => {
      setStatsOverrides((o) => ({ ...o, [restaurant.placeId]: placeStats }));
      setReviewsVersion((v) => v + 1);
    });

  const reportMenu = async (restaurant: Restaurant) => {
    if (!menuId) return;
    try {
      await reportMenuNotSold(restaurant.placeId, menuId);
      notify.success("제보해 주셔서 고마워요. 확인 후 반영할게요.");
    } catch (error) {
      const code = error instanceof ApiError ? error.code : null;
      notify.error(
        code === "ALREADY_REPORTED_MENU" ? "이미 제보한 식당이에요." : code === "UNAUTHORIZED" ? "제보하려면 로그인이 필요해요." : "제보하지 못했어요.",
      );
    }
  };

  const menu = knownMenu && knownMenu.id === menuId ? knownMenu : null;
  const areaLabel = area && area.baseKey === locationKey ? "이 지역" : (location?.name ?? "");
  const title = menu?.name ?? (query ? `"${query}" 검색 결과` : "근처 식당");
  const summary = `${areaLabel} 반경 ${formatRadius(radiusM)}${settled && !result.failed ? ` · 식당 ${result.total}곳` : ""}`;

  const showResearch = !!movedCenter && !!searchCenter && distanceM(movedCenter, searchCenter) > RESEARCH_THRESHOLD_M;

  return {
    locationStatus,
    location,
    menu,
    query,
    filters,
    radiusM,
    title,
    summary,
    restaurants,
    total: settled ? result.total : 0,
    status,
    hasMore: settled && !!result.nextCursor,
    isLoadingMore,
    fitKey: settled ? JSON.stringify([locationKey, radiusM, activeMenuId, query, filters.minRating4, filters.sort, retryCount]) : "",
    fitCenter: searchCenter,
    showResearch,
    selected,
    detail,
    toggleMenuFilter: () => setFilters((f) => ({ ...f, menuOn: !f.menuOn })),
    toggleWithin1km: () => setFilters((f) => ({ ...f, within1km: !f.within1km })),
    toggleMinRating: () => setFilters((f) => ({ ...f, minRating4: !f.minRating4 })),
    setSort: (sort) => setFilters((f) => ({ ...f, sort })),
    loadMore,
    retry: () => setRetryCount((n) => n + 1),
    onUserMove: setMovedCenter,
    researchHere: () => {
      if (movedCenter) setArea({ baseKey: locationKey, center: movedCenter });
      setMovedCenter(null);
    },
    select,
    closeDetail: () => setParams({ placeId: null, view: null }),
    toggleFavorite,
    share,
    showReviews: view === "reviews" && !!selected,
    reviewsVersion,
    openAllReviews: () => setParams({ view: "reviews" }),
    closeReviews: () => setParams({ view: null }),
    writeReview,
    shareReview: (review) => shareLink(`${review.placeName} 리뷰`, { placeId: review.placeId, view: "reviews" }),
    reportReview: openReportReview,
    reportMenu,
    expandRadius: () => setFilters((f) => ({ ...f, within1km: false })),
    goHome: () => router.push(ROUTES.home),
    goBack: () => (window.history.length > 1 ? router.back() : router.push(ROUTES.home)),
    locateMe: async () => {
      setArea(null);
      setMovedCenter(null);
      const ok = await locateCurrentPosition();
      if (!ok) notify.error("브라우저 설정에서 위치 권한을 허용해 주세요.");
    },
    openLocationPicker,
    requestLocationPermission: async () => {
      const ok = await locateCurrentPosition();
      if (!ok) notify.error("브라우저 설정에서 위치 권한을 허용해 주세요.");
    },
  };
}
