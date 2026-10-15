import AuthCard from "@/components/domain/auth/AuthCard";
import { PasswordField } from "@/components/domain/auth/AuthTextField";
import EmailCodeStep from "@/components/domain/auth/EmailCodeStep";
import Button from "@/components/ui/button";
import { AUTH_RULES } from "@/constants/user";
import { UsePasswordResetLogicResult } from "@/hooks/usePasswordResetLogic";

// 비밀번호 재설정 카드 (Figma 시안 없음 — 09 Login 카드 스타일)
export default function PasswordResetFormSection({ logic }: { logic: UsePasswordResetLogicResult }) {
  return (
    <AuthCard
      title="비밀번호 재설정"
      description={
        logic.step === 1 ? "가입한 이메일로 인증번호를 보내 드릴게요." : `${logic.verification.email.trim()} 계정의 새 비밀번호를 정해 주세요.`
      }
      onBack={logic.goBack}
    >
      <p className="text-footnote font-semibold text-brand-primary">{logic.step} / 2</p>
      {logic.step === 1 ? (
        <EmailCodeStep v={logic.verification} />
      ) : (
        <form onSubmit={logic.submit} noValidate className="flex w-full flex-col gap-4">
          <PasswordField
            label="새 비밀번호"
            autoComplete="new-password"
            value={logic.password}
            onChange={(e) => logic.setPassword(e.target.value)}
            error={logic.errors.password}
            hint={AUTH_RULES.passwordHint}
          />
          <PasswordField
            label="새 비밀번호 확인"
            autoComplete="new-password"
            value={logic.passwordConfirm}
            onChange={(e) => logic.setPasswordConfirm(e.target.value)}
            error={logic.errors.passwordConfirm}
          />
          <Button type="submit" color="brand" shape="round" isLoading={logic.pending} className="h-[52px] w-full text-[17px] font-semibold">
            비밀번호 바꾸기
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
