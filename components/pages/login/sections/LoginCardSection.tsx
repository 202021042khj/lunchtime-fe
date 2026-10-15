import AuthCard from "@/components/domain/auth/AuthCard";
import SocialLoginButtons, { EmailLoginLink } from "@/components/domain/SocialLoginButtons";
import { UseLoginLogicResult } from "@/hooks/useLoginLogic";

// Figma: 09 Login Card (34:1332) — 로고 · 제목 · 소셜 버튼 3개 + 이메일(시안 외 추가) · 약관 안내 · 로그인 없이 둘러보기
export default function LoginCardSection({ logic }: { logic: UseLoginLogicResult }) {
  return (
    <AuthCard showLogo title="lunchtime 시작하기" description="취향을 저장하고, 찜과 리뷰를 남길 수 있어요.">
      <div className="h-3" />
      <SocialLoginButtons pending={logic.pending} onLogin={logic.login} />
      <EmailLoginLink href={logic.emailHref} disabled={logic.pending !== null} />
      <div className="h-1" />
      <p className="text-footnote break-keep text-center text-labels-tertiary">계속하면 이용약관과 개인정보 처리방침에 동의하게 돼요.</p>
      <button
        type="button"
        onClick={logic.browse}
        disabled={logic.pending !== null}
        className="px-2 py-1 text-subheadline font-semibold text-labels-secondary hover:text-labels-primary"
      >
        로그인 없이 둘러보기
      </button>
    </AuthCard>
  );
}
