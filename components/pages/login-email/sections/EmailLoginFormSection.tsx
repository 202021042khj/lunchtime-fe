import Link from "next/link";
import AuthCard from "@/components/domain/auth/AuthCard";
import AuthTextField, { PasswordField } from "@/components/domain/auth/AuthTextField";
import Button from "@/components/ui/button";
import { UseEmailLoginLogicResult } from "@/hooks/useEmailLoginLogic";

// 이메일 로그인 카드 (Figma 시안 없음 — 09 Login 카드 스타일)
export default function EmailLoginFormSection({ logic }: { logic: UseEmailLoginLogicResult }) {
  return (
    <AuthCard title="이메일로 로그인" description="가입한 이메일과 비밀번호를 입력해 주세요." onBack={logic.goBack}>
      <form onSubmit={logic.submit} noValidate className="mt-3 flex w-full flex-col gap-4">
        <AuthTextField
          label="이메일"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@example.com"
          value={logic.email}
          onChange={(e) => logic.setEmail(e.target.value)}
          error={logic.emailError}
        />
        <PasswordField
          label="비밀번호"
          autoComplete="current-password"
          value={logic.password}
          onChange={(e) => logic.setPassword(e.target.value)}
          error={logic.formError}
        />
        <Button type="submit" color="brand" shape="round" isLoading={logic.pending} className="h-[52px] w-full text-[17px] font-semibold">
          로그인
        </Button>
      </form>
      <div className="flex items-center gap-3 text-subheadline font-semibold">
        <Link href={logic.resetHref} className="text-labels-secondary hover:text-labels-primary">
          비밀번호를 잊었어요
        </Link>
        <span aria-hidden className="h-3 w-px bg-separators-non-opaque" />
        <Link href={logic.signupHref} className="text-brand-primary">
          이메일로 가입하기
        </Link>
      </div>
    </AuthCard>
  );
}
