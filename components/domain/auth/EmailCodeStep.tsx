import { FormEvent, ReactNode } from "react";
import AuthTextField from "@/components/domain/auth/AuthTextField";
import Button from "@/components/ui/button";
import { MOCK_EMAIL_CODE_HINT } from "@/constants/user";
import { formatTimer, EmailVerification } from "@/hooks/useEmailVerification";
import { usesMock } from "@/lib/api/client";

interface EmailCodeStepProps {
  v: EmailVerification;
  // 이메일 칸 아래 보조 링크 (예: 이미 가입했다면 로그인)
  emailFooter?: ReactNode;
}

// 이메일 → [인증번호 받기] → 6자리 + 남은 시간 → [확인] (가입 · 비밀번호 재설정 1단계)
export default function EmailCodeStep({ v, emailFooter }: EmailCodeStepProps) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (v.sent) v.verify();
    else v.send();
  };

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-4">
      <AuthTextField
        label="이메일"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="name@example.com"
        value={v.email}
        onChange={(e) => v.setEmail(e.target.value)}
        readOnly={v.sent}
        error={v.emailError}
        trailing={
          v.sent && (
            <button type="button" onClick={v.changeEmail} className="shrink-0 text-footnote font-semibold text-brand-primary">
              변경
            </button>
          )
        }
      />
      {!v.sent && emailFooter}

      {v.sent && (
        <>
          <AuthTextField
            label="인증번호"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6자리 숫자"
            value={v.code}
            onChange={(e) => v.setCode(e.target.value)}
            error={v.codeError}
            hint={usesMock("/auth/email/code") ? MOCK_EMAIL_CODE_HINT : "메일이 안 보이면 스팸함도 확인해 주세요."}
            trailing={
              <span aria-label="남은 시간" className="shrink-0 text-footnote font-semibold tabular-nums text-brand-primary">
                {formatTimer(v.remainingSec)}
              </span>
            }
          />
          <button
            type="button"
            onClick={v.send}
            disabled={v.resendInSec > 0 || v.sending}
            className="self-start text-footnote font-semibold text-labels-secondary underline disabled:text-labels-tertiary disabled:no-underline"
          >
            {v.resendInSec > 0 ? `인증번호 다시 받기 (${v.resendInSec}초 후)` : "인증번호 다시 받기"}
          </button>
        </>
      )}

      <Button
        type="submit"
        color="brand"
        shape="round"
        isLoading={v.sending || v.verifying}
        className="h-[52px] w-full text-[17px] font-semibold"
      >
        {v.sent ? "확인" : "인증번호 받기"}
      </Button>
    </form>
  );
}
