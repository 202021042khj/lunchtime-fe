import { Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import Loading from "@/components/ui/loading";
import { UNAVAILABLE_PROVIDERS } from "@/lib/socialLogin";
import { cn } from "@/lib/utils";
import { SocialProvider } from "@/types/user";

// 각 회사 가이드의 버튼 색 (Figma 09 Social 버튼)
const STYLES: Record<SocialProvider, { label: string; className: string }> = {
  kakao: { label: "카카오로 계속하기", className: "bg-[#fee500] text-black/85" },
  apple: { label: "Apple로 계속하기", className: "bg-black text-white" },
  google: { label: "Google로 계속하기", className: "border border-[#d9d9de] bg-white text-[#1f1f1f]" },
};

interface SocialLoginButtonProps {
  provider: SocialProvider;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  className?: string;
}

// 소셜 로그인 버튼 하나 (로그인 화면 · 로그인 필요 팝업 공용)
export function SocialLoginButton({ provider, loading, disabled, onClick, className }: SocialLoginButtonProps) {
  const style = STYLES[provider];
  // 아직 열지 않은 로그인(Apple)은 누를 수 없고 "서비스 준비 중"을 작게 붙인다
  const unavailable = UNAVAILABLE_PROVIDERS.includes(provider);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || unavailable}
      aria-busy={loading}
      className={cn(
        "flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] text-headline transition-[filter] hover:brightness-[0.97] disabled:cursor-default",
        (disabled || unavailable) && !loading && "opacity-60",
        unavailable && "hover:brightness-100",
        style.className,
        className,
      )}
    >
      {loading ? (
        <Loading className="size-5" color={provider === "apple" ? "#ffffff" : "#000000"} />
      ) : (
        <>
          {provider === "kakao" && <MessageCircle aria-hidden className="size-[18px] fill-current" />}
          {style.label}
          {unavailable && <span className="text-caption-1 font-normal opacity-80">(서비스 준비 중)</span>}
        </>
      )}
    </button>
  );
}

interface SocialLoginButtonsProps {
  providers?: SocialProvider[];
  pending: SocialProvider | null;
  onLogin: (provider: SocialProvider) => void;
}

// 카카오 · Apple · Google 세로 묶음
export default function SocialLoginButtons({ providers = ["kakao", "apple", "google"], pending, onLogin }: SocialLoginButtonsProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {providers.map((p) => (
        <SocialLoginButton key={p} provider={p} loading={pending === p} disabled={pending !== null} onClick={() => onLogin(p)} />
      ))}
    </div>
  );
}

// 자체 계정: 소셜 버튼 아래 한 칸 (흰 유리 버튼 + 메일 아이콘) → 이메일 로그인 화면
export function EmailLoginLink({ href, disabled }: { href: string; disabled: boolean }) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      className={cn(
        "flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border border-glass-border bg-white/60 text-headline text-labels-primary shadow-glass transition-colors hover:bg-white/90",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <Mail aria-hidden className="size-[18px]" />
      이메일로 계속하기
    </Link>
  );
}
