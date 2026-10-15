"use client";

import { useCallback, useState } from "react";
import { openLoginRequired, requireLogin } from "@/components/domain/LoginRequiredModal";
import { notify } from "@/components/ui/notify/notify-utils";
import { ApiError } from "@/lib/api/client";
import { addFavorite, removeFavorite } from "@/lib/api/restaurants";

interface Favoritable {
  placeId: string;
  isFavorite: boolean;
}

// 찜 토글은 바로 화면에 반영하고(applyFavorite), 실패하면 되돌린다
export function useFavoriteToggle() {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const applyFavorite = useCallback(
    <T extends Favoritable>(item: T): T => (item.placeId in overrides ? { ...item, isFavorite: overrides[item.placeId] } : item),
    [overrides],
  );

  const toggleFavorite = async (item: Favoritable) => {
    if (!requireLogin("favorite")) return;
    const next = !item.isFavorite;
    setOverrides((o) => ({ ...o, [item.placeId]: next }));
    try {
      await (next ? addFavorite(item.placeId) : removeFavorite(item.placeId));
    } catch (error) {
      setOverrides((o) => ({ ...o, [item.placeId]: !next }));
      if (error instanceof ApiError && error.code === "UNAUTHORIZED") openLoginRequired("favorite");
      else notify.error("찜하지 못했어요.");
    }
  };

  return { applyFavorite, toggleFavorite };
}
