"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { openLocationPicker } from "@/components/domain/LocationPickerModal";
import { notify } from "@/components/ui/notify/notify-utils";
import { DEFAULT_RADIUS_M, EXPANDED_RADIUS_M } from "@/constants/recommendation";
import { mapRoute, ROUTES } from "@/constants/navigation";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { getRecommendations } from "@/lib/api/recommendations";
import { CurrentLocation, LocationStatus, locateCurrentPosition } from "@/lib/locationStore";
import { RecommendationResponse } from "@/types/recommendation";
import { Restaurant } from "@/types/restaurant";

export interface UseHomeLogicResult {
  locationStatus: LocationStatus;
  location: CurrentLocation | null;
  reco: RecommendationResponse | null;
  status: "loading" | "ready" | "error";
  isShuffling: boolean;
  radiusM: number;
  showTasteBanner: boolean;
  dismissTasteBanner: () => void;
  shuffle: () => void;
  expandRadius: () => void;
  retry: () => void;
  toggleFavorite: (restaurant: Restaurant) => void;
  goToMap: (menuId?: string) => void;
  goToTaste: () => void;
  openLocationPicker: () => void;
  requestLocationPermission: () => void;
}

interface FetchResult {
  key: string;
  data?: RecommendationResponse;
  failed?: boolean;
}

export function useHomeLogic(): UseHomeLogicResult {
  const router = useRouter();
  const { status: locationStatus, location } = useCurrentLocation();
  const [radiusM, setRadiusM] = useState(DEFAULT_RADIUS_M);
  const [excludeMenuIds, setExcludeMenuIds] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<FetchResult>({ key: "" });
  const { applyFavorite, toggleFavorite } = useFavoriteToggle();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const requestKey = location ? JSON.stringify([location.lat, location.lng, radiusM, excludeMenuIds, retryCount]) : "";

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    getRecommendations({ lat: location.lat, lng: location.lng, radiusM, excludeMenuIds })
      .then((data) => {
        if (cancelled) return;
        // [다른 메뉴 추천]을 계속 눌러 후보가 바닥나면 처음 후보부터 다시 보여 준다
        if (!data.today && excludeMenuIds.length) {
          notify.success("추천할 메뉴를 다 봤어요. 처음부터 다시 보여 드릴게요.");
          setExcludeMenuIds([]);
          return;
        }
        setResult({ key: requestKey, data });
      })
      .catch(() => {
        if (!cancelled) setResult((prev) => ({ key: requestKey, data: prev.data, failed: true }));
      });
    return () => {
      cancelled = true;
    };
    // requestKey가 위치·반경·제외 목록·재시도를 모두 담는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const settled = result.key === requestKey;
  const status = !settled ? "loading" : result.failed ? "error" : "ready";

  // 찜 토글을 바로 반영한 추천 결과
  const reco = useMemo(() => {
    const data = result.data;
    if (!data?.today) return data ?? null;
    return { ...data, today: { ...data.today, restaurants: data.today.restaurants.map(applyFavorite) } };
  }, [result.data, applyFavorite]);

  const shuffle = () => {
    const todayId = result.data?.today?.menu.id;
    if (todayId) setExcludeMenuIds((ids) => [...ids, todayId]);
  };

  const requestLocationPermission = async () => {
    const ok = await locateCurrentPosition();
    if (!ok) notify.error("브라우저 설정에서 위치 권한을 허용해 주세요.");
  };

  return {
    locationStatus,
    location,
    reco,
    status,
    isShuffling: status === "loading" && !!result.data,
    radiusM,
    showTasteBanner: !!reco?.promptTaste && !bannerDismissed,
    dismissTasteBanner: () => setBannerDismissed(true),
    shuffle,
    expandRadius: () => setRadiusM(EXPANDED_RADIUS_M),
    retry: () => setRetryCount((n) => n + 1),
    toggleFavorite,
    goToMap: (menuId) => router.push(mapRoute(menuId)),
    // 취향 배너는 온보딩으로 (기능명세 5)
    goToTaste: () => router.push(ROUTES.onboarding),
    openLocationPicker,
    requestLocationPermission,
  };
}
