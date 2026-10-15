"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { afterLoginRoute, ROUTES, safeNext, withNext } from "@/constants/navigation";
import { ApiError } from "@/lib/api/client";
import { loginWithEmailAccount } from "@/lib/sessionStore";
import { checkEmail, normalizeEmail } from "@/lib/validation";

export interface UseEmailLoginLogicResult {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  emailError: string | null;
  formError: string | null;
  pending: boolean;
  submit: (e: FormEvent) => void;
  signupHref: string;
  resetHref: string;
  goBack: () => void;
}

// 이메일 로그인 (자체 계정). 틀리면 어느 쪽이 틀렸는지 밝히지 않는다
export function useEmailLoginLogic(): UseEmailLoginLogicResult {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  // 비밀번호 재설정 뒤에는 이메일을 채워 둔다
  const [email, setEmailRaw] = useState(params.get("email") ?? "");
  const [password, setPasswordRaw] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = checkEmail(email);
    if (problem) return setEmailError(problem);
    if (!password) return setFormError("비밀번호를 입력해 주세요.");
    setPending(true);
    try {
      const res = await loginWithEmailAccount({ email: normalizeEmail(email), password });
      if (res.user.onboardingCompleted) notify.success("로그인했어요.");
      router.replace(afterLoginRoute(res.user.onboardingCompleted, next));
    } catch (error) {
      setPending(false);
      const code = error instanceof ApiError ? error.code : null;
      setFormError(
        code === "INVALID_CREDENTIALS" || code === "RATE_LIMITED"
          ? (error as ApiError).message
          : "로그인하지 못했어요. 다시 시도해 주세요.",
      );
    }
  };

  const withEmail = (route: string) => {
    const base = withNext(route, next);
    const trimmed = email.trim();
    return trimmed ? `${base}${base.includes("?") ? "&" : "?"}email=${encodeURIComponent(trimmed)}` : base;
  };

  return {
    email,
    setEmail: (v) => {
      setEmailRaw(v);
      setEmailError(null);
      setFormError(null);
    },
    password,
    setPassword: (v) => {
      setPasswordRaw(v);
      setFormError(null);
    },
    emailError,
    formError,
    pending,
    submit,
    signupHref: withEmail(ROUTES.signup),
    resetHref: withEmail(ROUTES.passwordReset),
    goBack: () => router.push(withNext(ROUTES.login, next)),
  };
}
