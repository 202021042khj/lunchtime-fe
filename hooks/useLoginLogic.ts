"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { afterLoginRoute, ROUTES, safeNext, withNext } from "@/constants/navigation";
import { ApiError } from "@/lib/api/client";
import { loginWith } from "@/lib/sessionStore";
import { startSocialLogin, usesSocialRedirect } from "@/lib/socialLogin";
import { SocialProvider } from "@/types/user";

export interface UseLoginLogicResult {
  pending: SocialProvider | null;
  login: (provider: SocialProvider) => void;
  browse: () => void;
  emailHref: string;
}

// 로그인 (기능명세 9): 소셜 로그인 → 처음이면 온보딩, 아니면 ?next= 로 돌아간다
export function useLoginLogic(): UseLoginLogicResult {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [pending, setPending] = useState<SocialProvider | null>(null);

  const login = async (provider: SocialProvider) => {
    setPending(provider);
    try {
      // 웹 카카오 · 구글은 각 회사 로그인 화면으로 이동한다. 돌아오면 /login/<회사>/callback이 마무리
      if (usesSocialRedirect(provider)) {
        startSocialLogin(provider, next);
        return;
      }
      const res = await loginWith(provider);
      if (res.user.onboardingCompleted) notify.success("로그인했어요.");
      router.replace(afterLoginRoute(res.user.onboardingCompleted, next));
    } catch (error) {
      setPending(null);
      // 소셜 SDK가 아직 연결되지 않았으면 그 안내를, 서버 오류면 일반 안내를
      notify.error(!(error instanceof ApiError) && error instanceof Error ? error.message : "로그인하지 못했어요. 다시 시도해 주세요.");
    }
  };

  return { pending, login, browse: () => router.replace(ROUTES.home), emailHref: withNext(ROUTES.emailLogin, next) };
}
