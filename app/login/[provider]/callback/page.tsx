"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ROUTES } from "@/constants/navigation";
import { PROVIDER_LABELS } from "@/constants/user";
import { useSocialCallbackLogic } from "@/hooks/useSocialCallbackLogic";
import { isRedirectProvider, RedirectProvider } from "@/lib/socialLogin";

// 카카오 · 구글 로그인에서 돌아오는 화면 (/login/kakao/callback, /login/google/callback).
// 잠깐 보였다가 온보딩 · 원래 화면 · 로그인 화면으로 이동한다
function SocialCallbackContent({ provider }: { provider: RedirectProvider }) {
  useSocialCallbackLogic(provider);

  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 px-4">
      <Loader2 aria-hidden className="size-7 animate-spin text-brand-primary" />
      <p role="status" className="text-body text-labels-secondary">
        {PROVIDER_LABELS[provider]} 로그인 중…
      </p>
    </main>
  );
}

// 모르는 회사 이름이면 로그인 화면으로
function UnknownProvider() {
  const router = useRouter();
  useEffect(() => router.replace(ROUTES.login), [router]);
  return null;
}

// useSearchParams(?code=&state=)를 쓰므로 Suspense로 감싼다
export default function SocialCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  return <Suspense>{isRedirectProvider(provider) ? <SocialCallbackContent provider={provider} /> : <UnknownProvider />}</Suspense>;
}
