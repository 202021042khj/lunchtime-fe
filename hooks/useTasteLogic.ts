"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { ROUTES } from "@/constants/navigation";
import { EMPTY_PREFERENCES, TasteForm, useTasteForm } from "@/hooks/useTasteForm";
import { ApiError } from "@/lib/api/client";
import { getMyPreferences, previewPreferences, saveMyPreferences } from "@/lib/api/preferences";
import { PreferencePreview, Preferences } from "@/types/preferences";

export interface UseTasteLogicResult {
  status: "loading" | "ready" | "error" | "guest";
  form: TasteForm;
  preview: PreferencePreview | null;
  dirty: boolean;
  saving: boolean;
  reset: () => void;
  save: () => void;
  retry: () => void;
}

const sameTaste = (a: Preferences, b: Preferences) =>
  JSON.stringify([...a.dislikedIngredients].sort()) === JSON.stringify([...b.dislikedIngredients].sort()) &&
  JSON.stringify([...a.allergies].sort()) === JSON.stringify([...b.allergies].sort()) &&
  JSON.stringify([...a.favoriteCuisines].sort()) === JSON.stringify([...b.favoriteCuisines].sort()) &&
  a.spiceLevel === b.spiceLevel;

// 취향 설정 (기능명세 2): 저장된 취향 불러오기 → 고치기 → 미리보기 → 저장
export function useTasteLogic(): UseTasteLogicResult {
  const router = useRouter();
  const form = useTasteForm();
  const { reset: resetForm, value } = form;
  const [retryCount, setRetryCount] = useState(0);
  const [loaded, setLoaded] = useState<{ key: number; status: "ready" | "error" | "guest"; value: Preferences } | null>(null);
  const [preview, setPreview] = useState<PreferencePreview | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyPreferences()
      .then((prefs) => {
        if (cancelled) return;
        setLoaded({ key: retryCount, status: "ready", value: prefs });
        resetForm(prefs);
      })
      .catch((error) => {
        if (cancelled) return;
        const guest = error instanceof ApiError && error.code === "UNAUTHORIZED";
        setLoaded({ key: retryCount, status: guest ? "guest" : "error", value: EMPTY_PREFERENCES });
      });
    return () => {
      cancelled = true;
    };
  }, [retryCount, resetForm]);

  const status = !loaded || loaded.key !== retryCount ? "loading" : loaded.status;

  // 고를 때마다 미리보기를 다시 계산한다 (연속으로 누르면 마지막 것만)
  const previewKey = JSON.stringify(value);
  useEffect(() => {
    if (status !== "ready") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      previewPreferences(JSON.parse(previewKey))
        .then((res) => !cancelled && setPreview(res))
        .catch(() => !cancelled && setPreview(null));
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [previewKey, status]);

  const save = async () => {
    setSaving(true);
    try {
      await saveMyPreferences({ ...value, completeOnboarding: true });
      notify.success("취향을 저장했어요. 이제 이 기준으로 추천해요.");
      if (window.history.length > 1) router.back();
      else router.push(ROUTES.home);
    } catch (error) {
      setSaving(false);
      notify.error(error instanceof ApiError && error.code === "UNAUTHORIZED" ? "저장하려면 로그인이 필요해요." : "저장하지 못했어요. 다시 시도해 주세요.");
    }
  };

  return {
    status,
    form,
    preview,
    dirty: !!loaded && !sameTaste(loaded.value, value),
    saving,
    reset: () => resetForm(loaded?.value ?? EMPTY_PREFERENCES),
    save,
    retry: () => setRetryCount((c) => c + 1),
  };
}
