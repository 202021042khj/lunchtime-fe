"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { ROUTES } from "@/constants/navigation";
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
  const step = Math.min(Math.max(Number(searchParams.get("step")) || 1, 1), total);
  const form = useTasteForm();
  const { reset: resetForm } = form;
  const [saving, setSaving] = useState(false);

  // 이미 고른 취향이 있으면 채워 둔다 (비로그인이면 빈 값으로 시작)
  useEffect(() => {
    let cancelled = false;
    getMyPreferences()
      .then((prefs) => !cancelled && resetForm(prefs))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [resetForm]);

  const goTo = (n: number) => router.push(`${ROUTES.onboarding}?step=${n}`);

  const submit = async (prefs: Preferences) => {
    setSaving(true);
    try {
      await saveMyPreferences({ ...prefs, completeOnboarding: true });
      router.replace(ROUTES.home);
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError && error.code === "UNAUTHORIZED") {
        notify.error("취향을 저장하려면 로그인이 필요해요.");
        router.push(ROUTES.login);
      } else {
        notify.error("저장하지 못했어요. 다시 시도해 주세요.");
      }
    }
  };

  return {
    step,
    total,
    form,
    saving,
    next: () => goTo(step + 1),
    prev: () => (step > 1 ? router.replace(`${ROUTES.onboarding}?step=${step - 1}`) : undefined),
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
