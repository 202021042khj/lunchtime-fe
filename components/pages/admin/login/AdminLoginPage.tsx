import { ShieldCheck } from "lucide-react";
import AuthCard from "@/components/domain/auth/AuthCard";
import AuthScreen from "@/components/domain/auth/AuthScreen";
import AuthTextField, { PasswordField } from "@/components/domain/auth/AuthTextField";
import Button from "@/components/ui/button";
import { ROUTES } from "@/constants/navigation";
import { UseAdminLoginLogicResult } from "@/hooks/useAdminLoginLogic";
import { USE_MOCK } from "@/lib/api/client";

// 어드민 로그인 (Figma 시안 없음 — 09 Login 카드 스타일). 사용자 로그인과 완전히 분리된 화면 · 계정 · 토큰
export default function AdminLoginPage(logic: UseAdminLoginLogicResult) {
  return (
    <AuthScreen variant="desktop">
      <AuthCard
        showLogo
        title="lunchtime 관리자"
        description="운영자 계정과 OTP 앱의 6자리 번호로 로그인해요."
      >
        <form onSubmit={logic.submit} noValidate className="mt-3 flex w-full flex-col gap-4">
          <AuthTextField
            label="아이디"
            autoComplete="username"
            value={logic.loginId}
            onChange={(e) => logic.setLoginId(e.target.value)}
          />
          <PasswordField
            label="비밀번호"
            autoComplete="current-password"
            value={logic.password}
            onChange={(e) => logic.setPassword(e.target.value)}
          />
          <AuthTextField
            label="OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6자리 숫자"
            value={logic.otp}
            onChange={(e) => logic.setOtp(e.target.value)}
            error={logic.error}
            hint={USE_MOCK ? "목 서버: admin / admin1234 / OTP 123456" : undefined}
            trailing={<ShieldCheck aria-hidden className="size-5 text-labels-tertiary" />}
          />
          <Button type="submit" color="brand" shape="round" isLoading={logic.pending} className="h-[52px] w-full text-[17px] font-semibold">
            로그인
          </Button>
        </form>
        <a href={ROUTES.home} className="px-2 py-1 text-subheadline font-semibold text-labels-secondary hover:text-labels-primary">
          서비스로 가기
        </a>
      </AuthCard>
    </AuthScreen>
  );
}
