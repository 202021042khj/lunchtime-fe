"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { afterLoginRoute, ROUTES, withNext } from "@/constants/navigation";
import { PROVIDER_LABELS } from "@/constants/user";
import { ApiError } from "@/lib/api/client";
import { loginWithSocialCode } from "@/lib/sessionStore";
import { RedirectProvider, socialRedirectUri, takeSocialLoginState } from "@/lib/socialLogin";

// 카카오 · 구글 로그인 화면에서 돌아온 곳: ?code=&state= (취소하면 ?error=access_denied)
// 인가 코드로 로그인하고 온보딩 또는 원래 가려던 곳(next)으로 보낸다. 실패하면 로그인 화면으로
export function useSocialCallbackLogic(provider: RedirectProvider): void {
  const router = useRouter();
  const params = useSearchParams();
  // 인가 코드는 한 번만 쓸 수 있어서, 개발 모드에서 effect가 두 번 돌아도 한 번만 보낸다
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const label = PROVIDER_LABELS[provider];
    const saved = takeSocialLoginState(provider);
    const next = saved?.next ?? ROUTES.home;
    const backToLogin = (message: string) => {
      notify.error(message);
      router.replace(withNext(ROUTES.login, next));
    };

    const error = params.get("error");
    if (error) {
      backToLogin(error === "access_denied" ? `${label} 로그인을 취소했어요.` : `${label} 로그인을 하지 못했어요. 다시 시도해 주세요.`);
      return;
    }
    const code = params.get("code");
    if (!code || !saved || saved.state !== params.get("state")) {
      backToLogin("로그인을 처음부터 다시 시도해 주세요.");
      return;
    }

    loginWithSocialCode(provider, code, socialRedirectUri(provider))
      .then((res) => {
        if (res.user.onboardingCompleted) notify.success("로그인했어요.");
        router.replace(afterLoginRoute(res.user.onboardingCompleted, next));
      })
      .catch((err: unknown) => {
        backToLogin(err instanceof ApiError ? err.message : "로그인하지 못했어요. 다시 시도해 주세요.");
      });
  }, [params, provider, router]);
}
