"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { ROUTES, safeNext, withNext } from "@/constants/navigation";
import { EmailVerification, useEmailVerification } from "@/hooks/useEmailVerification";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { checkPassword, normalizeEmail } from "@/lib/validation";

export interface UsePasswordResetLogicResult {
  step: 1 | 2;
  verification: EmailVerification;
  password: string;
  setPassword: (v: string) => void;
  passwordConfirm: string;
  setPasswordConfirm: (v: string) => void;
  errors: { password?: string | null; passwordConfirm?: string | null };
  pending: boolean;
  submit: (e: FormEvent) => void;
  goBack: () => void;
}

// 비밀번호 재설정: 1) 이메일 인증번호 2) 새 비밀번호 → 이메일 로그인으로 (이메일 채워 둠)
export function usePasswordResetLogic(): UsePasswordResetLogicResult {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const verification = useEmailVerification("reset", params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<UsePasswordResetLogicResult["errors"]>({});
  const [pending, setPending] = useState(false);

  const step = verification.verificationToken ? 2 : 1;
  const loginRoute = (email?: string) => {
    const base = withNext(ROUTES.emailLogin, next);
    return email ? `${base}${base.includes("?") ? "&" : "?"}email=${encodeURIComponent(email)}` : base;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = {
      password: checkPassword(password),
      passwordConfirm: password !== passwordConfirm ? "비밀번호가 서로 달라요." : null,
    };
    setErrors(found);
    if (found.password || found.passwordConfirm || !verification.verificationToken) return;
    setPending(true);
    const email = normalizeEmail(verification.email);
    try {
      await resetPassword({ email, password, verificationToken: verification.verificationToken });
      notify.success("비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.");
      router.replace(loginRoute(email));
    } catch (error) {
      setPending(false);
      if (error instanceof ApiError && error.code === "INVALID_CODE") {
        verification.changeEmail();
        notify.error("이메일 인증을 다시 해 주세요.");
      } else {
        notify.error("비밀번호를 바꾸지 못했어요. 다시 시도해 주세요.");
      }
    }
  };

  return {
    step,
    verification,
    password,
    setPassword: (v) => {
      setPassword(v);
      setErrors((e) => ({ ...e, password: null }));
    },
    passwordConfirm,
    setPasswordConfirm: (v) => {
      setPasswordConfirm(v);
      setErrors((e) => ({ ...e, passwordConfirm: null }));
    },
    errors,
    pending,
    submit,
    goBack: () => (step === 2 ? verification.changeEmail() : router.push(loginRoute(verification.email.trim()))),
  };
}
