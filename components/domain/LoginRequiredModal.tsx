"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Flag, Heart, LucideIcon, Megaphone, SlidersHorizontal, SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import { useState } from "react";
import { SocialLoginButton } from "@/components/domain/SocialLoginButtons";
import Button from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { notify } from "@/components/ui/notify/notify-utils";
import { ROUTES, withNext } from "@/constants/navigation";
import { getSession, loginWith, setFlash } from "@/lib/sessionStore";
import { startSocialLogin, usesSocialRedirect } from "@/lib/socialLogin";

// 어떤 동작에서 막혔는지에 따라 아이콘 · 문구만 바꾼다 (Figma 09 Login Required는 찜)
export type LoginReason = "favorite" | "review" | "report" | "menuReport" | "taste";

const REASONS: Record<LoginReason, { icon: LucideIcon; description: string }> = {
  favorite: { icon: Heart, description: "로그인하면 찜한 식당을 어디서든 다시 볼 수 있어요." },
  review: { icon: SquarePen, description: "로그인하면 다녀온 식당에 리뷰를 남길 수 있어요." },
  report: { icon: Flag, description: "로그인하면 문제가 있는 리뷰를 신고할 수 있어요." },
  menuReport: { icon: Megaphone, description: "로그인하면 잘못된 메뉴 정보를 알려 줄 수 있어요." },
  taste: { icon: SlidersHorizontal, description: "로그인하면 취향을 저장하고 맞춤 추천을 받을 수 있어요." },
};

const currentPath = () => window.location.pathname + window.location.search;

export function openLoginRequired(reason: LoginReason) {
  overlay.open(({ isOpen, close, unmount }) => (
    <LoginRequiredModal
      isOpen={isOpen}
      reason={reason}
      onClose={() => {
        close();
        window.setTimeout(unmount, 200);
      }}
    />
  ));
}

// 로그인해야 하는 동작 앞에서 부른다. 비로그인으로 확인됐으면 팝업을 띄우고 false.
// 아직 확인 전이면 막지 않고 서버 응답(401)에서 다시 팝업을 띄운다
export function requireLogin(reason: LoginReason): boolean {
  if (getSession().status !== "guest") return true;
  openLoginRequired(reason);
  return false;
}

interface LoginRequiredModalProps {
  isOpen: boolean;
  reason: LoginReason;
  onClose: () => void;
}

// Figma: 09 Login Required (34:1494) — [카카오로 계속하기] [다른 방법으로 로그인] 다음에 할게요
export default function LoginRequiredModal({ isOpen, reason, onClose }: LoginRequiredModalProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { icon: Icon, description } = REASONS[reason];

  const loginKakao = async () => {
    setPending(true);
    try {
      // 웹 카카오는 카카오 로그인 화면으로 이동했다가 지금 화면으로 돌아온다 (페이지가 새로 열리므로 데이터도 다시 받는다)
      if (usesSocialRedirect("kakao")) {
        startSocialLogin("kakao", currentPath());
        return;
      }
      const res = await loginWith("kakao");
      onClose();
      if (!res.user.onboardingCompleted) {
        router.push(withNext(ROUTES.onboarding, currentPath()));
        return;
      }
      // 찜 · 리뷰 등 화면의 데이터를 로그인 상태로 다시 받기 위해 새로 고친다
      setFlash("로그인했어요.");
      window.location.reload();
    } catch {
      setPending(false);
      notify.error("로그인하지 못했어요. 다시 시도해 주세요.");
    }
  };

  const otherMethods = () => {
    onClose();
    router.push(withNext(ROUTES.login, currentPath()));
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(31,20,13,0.4)]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-dialog flex w-[min(400px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2.5 rounded-[28px] border border-white bg-white/95 px-7 pt-8 pb-6 text-center shadow-[0_24px_64px_rgba(51,26,13,0.25)] outline-none backdrop-blur-[20px]"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-primary-tint text-brand-primary">
            <Icon aria-hidden className="size-6 fill-current" />
          </span>
          <DialogPrimitive.Title className="text-title-3 font-semibold text-labels-primary">로그인이 필요해요</DialogPrimitive.Title>
          <p className="text-subheadline break-keep text-labels-secondary">{description}</p>
          <div className="h-2" />
          <SocialLoginButton provider="kakao" loading={pending} disabled={pending} onClick={loginKakao} className="h-[50px]" />
          <Button
            type="button"
            variant="outlined"
            color="brand"
            shape="round"
            disabled={pending}
            onClick={otherMethods}
            className="h-[50px] w-full text-[17px] font-semibold"
          >
            다른 방법으로 로그인
          </Button>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="px-2 py-1 text-subheadline font-semibold text-labels-tertiary hover:text-labels-secondary"
          >
            다음에 할게요
          </button>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
