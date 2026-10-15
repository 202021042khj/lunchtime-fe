"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { confirm } from "@/components/common/ConfirmDialog";
import { openLocationPicker } from "@/components/domain/LocationPickerModal";
import { openEditReview } from "@/components/domain/WriteReviewModal";
import { notify } from "@/components/ui/notify/notify-utils";
import { ROUTES } from "@/constants/navigation";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { getMe, logout, withdraw } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { getMyPreferences } from "@/lib/api/preferences";
import { deleteReview, getMyReviews } from "@/lib/api/reviews";
import { getLunchAlert, getLunchAlertServer, setLunchAlert, subscribeLunchAlert } from "@/lib/lunchAlertStore";
import { markGuest } from "@/lib/sessionStore";
import { hasTaste } from "@/lib/taste";
import { Preferences } from "@/types/preferences";
import { Review } from "@/types/review";
import { User } from "@/types/user";

export interface UseMyLogicResult {
  status: "loading" | "ready" | "error" | "guest";
  user: User | null;
  preferences: Preferences | null;
  reviews: Review[];
  hasMoreReviews: boolean;
  savedLocationLabel: string;
  lunchAlert: string | null;
  setLunchAlert: (time: string | null) => void;
  loadMoreReviews: () => void;
  editReview: (review: Review) => void;
  removeReview: (review: Review) => void;
  openPlace: (review: Review) => void;
  goToTaste: () => void;
  goToFavorites: () => void;
  openLocationPicker: () => void;
  openTerms: () => void;
  logout: () => void;
  withdraw: () => void;
  retry: () => void;
}

interface MyData {
  key: number;
  status: "ready" | "error" | "guest";
  user: User | null;
  preferences: Preferences | null;
  reviews: Review[];
  nextCursor: string | null;
}

export function useMyLogic(): UseMyLogicResult {
  const router = useRouter();
  const { location } = useCurrentLocation();
  const lunchAlert = useSyncExternalStore(subscribeLunchAlert, getLunchAlert, getLunchAlertServer);
  const [retryCount, setRetryCount] = useState(0);
  const [data, setData] = useState<MyData>({ key: -1, status: "ready", user: null, preferences: null, reviews: [], nextCursor: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMe(), getMyPreferences(), getMyReviews({ limit: 20 })])
      .then(([user, preferences, reviews]) => {
        if (!cancelled) setData({ key: retryCount, status: "ready", user, preferences, reviews: reviews.items, nextCursor: reviews.nextCursor });
      })
      .catch((error) => {
        if (cancelled) return;
        const guest = error instanceof ApiError && error.code === "UNAUTHORIZED";
        setData({ key: retryCount, status: guest ? "guest" : "error", user: null, preferences: null, reviews: [], nextCursor: null });
      });
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const loadMoreReviews = async () => {
    if (!data.nextCursor) return;
    try {
      const res = await getMyReviews({ cursor: data.nextCursor, limit: 20 });
      setData((d) => ({ ...d, reviews: [...d.reviews, ...res.items], nextCursor: res.nextCursor }));
    } catch {
      notify.error("리뷰를 더 불러오지 못했어요.");
    }
  };

  const editReview = (review: Review) =>
    openEditReview(review, ({ review: updated }) =>
      setData((d) => ({ ...d, reviews: d.reviews.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)) })),
    );

  const removeReview = async (review: Review) => {
    const ok = await confirm({
      title: "리뷰를 삭제할까요?",
      description: "삭제한 리뷰는 되돌릴 수 없고, 식당 별점에서도 빠져요.",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteReview(review.id);
      setData((d) => ({
        ...d,
        reviews: d.reviews.filter((r) => r.id !== review.id),
        user: d.user && { ...d.user, stats: { ...d.user.stats, reviewCount: Math.max(0, d.user.stats.reviewCount - 1) } },
      }));
      notify.success("리뷰를 삭제했어요.");
    } catch {
      notify.error("리뷰를 삭제하지 못했어요.");
    }
  };

  const doLogout = async () => {
    const ok = await confirm({ title: "로그아웃할까요?", confirmLabel: "로그아웃" });
    if (!ok) return;
    try {
      await logout();
      markGuest();
      notify.success("로그아웃했어요.");
      router.push(ROUTES.home);
    } catch {
      notify.error("로그아웃하지 못했어요.");
    }
  };

  const doWithdraw = async () => {
    const ok = await confirm({
      title: "정말 탈퇴할까요?",
      description: "내 리뷰 · 찜 · 취향 정보가 모두 지워지고 되돌릴 수 없어요.",
      confirmLabel: "탈퇴하기",
      destructive: true,
    });
    if (!ok) return;
    try {
      await withdraw();
      markGuest();
      notify.success("탈퇴했어요. 그동안 고마웠어요.");
      router.push(ROUTES.home);
    } catch {
      notify.error("탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const savedLocationLabel = !location
    ? "설정 안 함"
    : location.source === "saved" && location.label
      ? `${location.name} · ${location.label}`
      : location.name;

  return {
    status: data.key === retryCount ? data.status : "loading",
    user: data.user,
    preferences: data.preferences,
    reviews: data.reviews,
    hasMoreReviews: !!data.nextCursor,
    savedLocationLabel,
    lunchAlert,
    setLunchAlert: (time) => {
      setLunchAlert(time);
      notify.success(time ? `매일 ${time}에 점심 추천을 알려드릴게요.` : "점심 알림을 껐어요.");
    },
    loadMoreReviews,
    editReview,
    removeReview,
    openPlace: (review) => router.push(`${ROUTES.map}?placeId=${review.placeId}`),
    // 취향이 없으면 [알려주기] → 온보딩, 있으면 [수정] → 취향 설정
    goToTaste: () => router.push(data.preferences && hasTaste(data.preferences) ? ROUTES.taste : ROUTES.onboarding),
    goToFavorites: () => router.push(ROUTES.favorites),
    openLocationPicker,
    // 약관 · 개인정보 처리방침 문서는 아직 없다
    openTerms: () => notify.success("약관 페이지는 준비 중이에요."),
    logout: doLogout,
    withdraw: doWithdraw,
    retry: () => setRetryCount((n) => n + 1),
  };
}
