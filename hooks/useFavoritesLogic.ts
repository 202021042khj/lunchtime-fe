"use client";

import { useRouter } from "next/navigation";
import { createElement, useEffect, useMemo, useState } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { FAVORITE_CUISINES } from "@/constants/user";
import { ROUTES } from "@/constants/navigation";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { ApiError } from "@/lib/api/client";
import { addFavorite, getFavorites, removeFavorite } from "@/lib/api/restaurants";
import { Restaurant } from "@/types/restaurant";

export type FavoriteCuisine = (typeof FAVORITE_CUISINES)[number];

export interface UseFavoritesLogicResult {
  status: "loading" | "ready" | "error" | "guest";
  restaurants: Restaurant[];
  cuisine: FavoriteCuisine;
  setCuisine: (cuisine: FavoriteCuisine) => void;
  unfavorite: (restaurant: Restaurant) => void;
  openRestaurant: (restaurant: Restaurant) => void;
  goToMap: () => void;
  retry: () => void;
}

interface FetchResult {
  key: string;
  items: Restaurant[];
  status: "ready" | "error" | "guest";
}

export function useFavoritesLogic(): UseFavoritesLogicResult {
  const router = useRouter();
  const { location } = useCurrentLocation();
  const [cuisine, setCuisine] = useState<FavoriteCuisine>("전체");
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<FetchResult>({ key: "", items: [], status: "ready" });
  // 찜 해제한 식당은 바로 목록에서 뺀다 (되돌리기를 누르면 다시 보인다)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const key = JSON.stringify([cuisine, location?.lat, location?.lng, retryCount]);

  useEffect(() => {
    let cancelled = false;
    getFavorites({ cuisine: cuisine === "전체" ? undefined : cuisine, lat: location?.lat, lng: location?.lng, sort: "recent", limit: 50 })
      .then((res) => !cancelled && setResult({ key, items: res.items, status: "ready" }))
      .catch((error) => {
        if (cancelled) return;
        const guest = error instanceof ApiError && error.code === "UNAUTHORIZED";
        setResult({ key, items: [], status: guest ? "guest" : "error" });
      });
    return () => {
      cancelled = true;
    };
    // key가 종류 · 위치 · 재시도를 모두 담는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const restaurants = useMemo(() => result.items.filter((r) => !removedIds.has(r.placeId)), [result.items, removedIds]);

  const restore = async (restaurant: Restaurant) => {
    setRemovedIds((ids) => {
      const next = new Set(ids);
      next.delete(restaurant.placeId);
      return next;
    });
    try {
      await addFavorite(restaurant.placeId);
    } catch {
      notify.error("되돌리지 못했어요.");
    }
  };

  const unfavorite = async (restaurant: Restaurant) => {
    setRemovedIds((ids) => new Set(ids).add(restaurant.placeId));
    try {
      await removeFavorite(restaurant.placeId);
      notify.success(
        createElement(
          "span",
          { className: "flex items-center gap-3" },
          "찜을 해제했어요",
          createElement(
            "button",
            { type: "button", className: "font-semibold text-brand-primary underline", onClick: () => restore(restaurant) },
            "되돌리기",
          ),
        ),
      );
    } catch {
      setRemovedIds((ids) => {
        const next = new Set(ids);
        next.delete(restaurant.placeId);
        return next;
      });
      notify.error("찜을 해제하지 못했어요.");
    }
  };

  return {
    status: result.key === key ? result.status : "loading",
    restaurants,
    cuisine,
    setCuisine,
    unfavorite,
    openRestaurant: (restaurant) => router.push(`${ROUTES.map}?placeId=${restaurant.placeId}`),
    goToMap: () => router.push(ROUTES.map),
    retry: () => setRetryCount((n) => n + 1),
  };
}
