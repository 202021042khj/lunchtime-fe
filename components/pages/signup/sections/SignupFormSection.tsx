import Link from "next/link";
import AuthCard from "@/components/domain/auth/AuthCard";
import AuthTextField, { PasswordField } from "@/components/domain/auth/AuthTextField";
import EmailCodeStep from "@/components/domain/auth/EmailCodeStep";
import Button from "@/components/ui/button";
import { AUTH_RULES } from "@/constants/user";
import { UseSignupLogicResult } from "@/hooks/useSignupLogic";

// 이메일 가입 카드 (Figma 시안 없음 — 09 Login 카드 스타일). 1/2 이메일 인증 → 2/2 비밀번호 · 이름
export default function SignupFormSection({ logic }: { logic: UseSignupLogicResult }) {
  const v = logic.verification;
  return (
    <AuthCard
      title="이메일로 가입하기"
      description={logic.step === 1 ? "이메일로 받은 인증번호를 확인할게요." : "로그인할 비밀번호와 리뷰에 보일 이름을 정해 주세요."}
      onBack={logic.goBack}
    >
      <p className="text-footnote font-semibold text-brand-primary">{logic.step} / 2</p>

      {logic.step === 1 ? (
        <EmailCodeStep
          v={v}
          emailFooter={
            <p className="text-footnote text-labels-secondary">
              이미 가입했나요?{" "}
              <Link href={logic.loginHref} className="font-semibold text-brand-primary">
                로그인
              </Link>
            </p>
          }
        />
      ) : (
        <form onSubmit={logic.submit} noValidate className="flex w-full flex-col gap-4">
          <AuthTextField label="이메일" type="email" value={v.email} readOnly autoComplete="username" hint="인증을 마쳤어요" />
          <PasswordField
            label="비밀번호"
            autoComplete="new-password"
            value={logic.password}
            onChange={(e) => logic.setPassword(e.target.value)}
            error={logic.errors.password}
            hint={AUTH_RULES.passwordHint}
          />
          <PasswordField
            label="비밀번호 확인"
            autoComplete="new-password"
            value={logic.passwordConfirm}
            onChange={(e) => logic.setPasswordConfirm(e.target.value)}
            error={logic.errors.passwordConfirm}
          />
          <AuthTextField
            label="이름"
            autoComplete="nickname"
            placeholder="리뷰에 보일 이름"
            maxLength={AUTH_RULES.nameMax}
            value={logic.name}
            onChange={(e) => logic.setName(e.target.value)}
            error={logic.errors.name}
            hint={`${AUTH_RULES.nameMin}~${AUTH_RULES.nameMax}자`}
          />
          <Button type="submit" color="brand" shape="round" isLoading={logic.pending} className="h-[52px] w-full text-[17px] font-semibold">
            가입하기
          </Button>
          <p className="text-footnote break-keep text-center text-labels-tertiary">가입하면 이용약관과 개인정보 처리방침에 동의하게 돼요.</p>
        </form>
      )}
    </AuthCard>
  );
}
