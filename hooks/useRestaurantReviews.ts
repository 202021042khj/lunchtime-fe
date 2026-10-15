"use client";

import { useEffect, useState } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { getRestaurantReviews } from "@/lib/api/reviews";
import { Review, ReviewSort } from "@/types/review";

interface ReviewsResult {
  key: string;
  items: Review[];
  nextCursor: string | null;
  failed?: boolean;
}

// 리뷰 모두 보기: 정렬별 목록 + cursor "더 보기". version이 바뀌면(리뷰 등록 후) 다시 불러온다
export function useRestaurantReviews(placeId: string, version: number) {
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [result, setResult] = useState<ReviewsResult>({ key: "", items: [], nextCursor: null });
  const [loadingMore, setLoadingMore] = useState(false);
  const key = `${placeId}|${sort}|${version}`;

  useEffect(() => {
    let cancelled = false;
    getRestaurantReviews(placeId, { sort })
      .then((res) => !cancelled && setResult({ key, items: res.items, nextCursor: res.nextCursor }))
      .catch(() => !cancelled && setResult({ key, items: [], nextCursor: null, failed: true }));
    return () => {
      cancelled = true;
    };
    // key가 식당·정렬·버전을 모두 담는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loadMore = async () => {
    if (!result.nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getRestaurantReviews(placeId, { sort, cursor: result.nextCursor });
      setResult((prev) => (prev.key === key ? { ...prev, items: [...prev.items, ...res.items], nextCursor: res.nextCursor } : prev));
    } catch {
      notify.error("리뷰를 더 불러오지 못했어요.");
    } finally {
      setLoadingMore(false);
    }
  };

  const settled = result.key === key;
  return {
    sort,
    setSort,
    reviews: settled ? result.items : [],
    status: !settled ? "loading" : result.failed ? "error" : "ready",
    hasMore: settled && !!result.nextCursor,
    loadingMore,
    loadMore,
  } as const;
}
