"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { openLoginRequired } from "@/components/domain/LoginRequiredModal";
import { notify } from "@/components/ui/notify/notify-utils";
import { ROUTES, safeNext } from "@/constants/navigation";
import { EMPTY_PREFERENCES, TasteForm, useTasteForm } from "@/hooks/useTasteForm";
import { ApiError } from "@/lib/api/client";
import { getMyPreferences, saveMyPreferences } from "@/lib/api/preferences";
import { Preferences } from "@/types/preferences";

export const ONBOARDING_STEPS = [
  { field: "dislikedIngredients", title: "못 먹는 재료가 있나요?", description: "고른 재료가 들어간 메뉴는 추천하지 않아요. 없으면 건너뛰어도 돼요." },
  { field: "allergies", title: "알레르기가 있나요?", description: "선택한 알레르기 재료가 들어간 메뉴는 항상 제외돼요." },
  { field: "spiceLevel", title: "매운 음식은 어느 정도 드세요?", description: "맵기에 맞춰 메뉴 순서를 조정해요." },
  { field: "favoriteCuisines", title: "어떤 음식을 좋아하세요?", description: "고른 종류를 더 자주 추천해요. 여러 개 골라도 돼요." },
] as const satisfies readonly { field: keyof Preferences; title: string; description: string }[];

export interface UseOnboardingLogicResult {
  step: number; // 1 ~ 4
  total: number;
  form: TasteForm;
  saving: boolean;
  next: () => void;
  prev: () => void;
  skip: () => void;
  finish: () => void;
  later: () => void;
}

// 온보딩 (기능명세 5): 4단계, 단계는 ?step=으로 남겨 브라우저 뒤로가기가 이전 단계로 간다
export function useOnboardingLogic(): UseOnboardingLogicResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const total = ONBOARDING_STEPS.length;
  // 로그인 직후 온보딩이면 끝나고 원래 보던 화면(?next=)으로 돌아간다
  const nextParam = searchParams.get("next");
  const step = Math.min(Math.max(Number(searchParams.get("step")) || 1, 1), total);
  const form = useTasteForm();
  const { prefill } = form;
  const [saving, setSaving] = useState(false);

  // 이미 고른 취향이 있으면 채워 둔다 (비로그인이면 빈 값으로 시작).
  // 응답보다 먼저 사용자가 고르기 시작했으면 고른 값을 그대로 둔다
  useEffect(() => {
    let cancelled = false;
    getMyPreferences()
      .then((prefs) => !cancelled && prefill(prefs))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [prefill]);

  const stepUrl = (n: number) => {
    const params = new URLSearchParams({ step: String(n) });
    if (nextParam) params.set("next", nextParam);
    return `${ROUTES.onboarding}?${params}`;
  };
  const goTo = (n: number) => router.push(stepUrl(n));

  const submit = async (prefs: Preferences) => {
    setSaving(true);
    try {
      await saveMyPreferences({ ...prefs, completeOnboarding: true });
      router.replace(safeNext(nextParam));
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError && error.code === "UNAUTHORIZED") openLoginRequired("taste");
      else notify.error("저장하지 못했어요. 다시 시도해 주세요.");
    }
  };

  return {
    step,
    total,
    form,
    saving,
    next: () => goTo(step + 1),
    prev: () => (step > 1 ? router.replace(stepUrl(step - 1)) : undefined),
    // 건너뛰기: 이 질문은 고르지 않은 것으로 하고 다음으로
    skip: () => {
      form.clearField(ONBOARDING_STEPS[step - 1].field);
      goTo(step + 1);
    },
    finish: () => submit(form.value),
    // 나중에 할게요: 빈 값으로 온보딩만 끝낸다 → 인기 메뉴 추천
    later: () => submit(EMPTY_PREFERENCES),
  };
}
