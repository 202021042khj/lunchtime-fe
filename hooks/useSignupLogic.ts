"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { afterLoginRoute, ROUTES, safeNext, withNext } from "@/constants/navigation";
import { EmailVerification, useEmailVerification } from "@/hooks/useEmailVerification";
import { ApiError } from "@/lib/api/client";
import { signupWithEmailAccount } from "@/lib/sessionStore";
import { checkName, checkPassword, normalizeEmail } from "@/lib/validation";

interface SignupErrors {
  password?: string | null;
  passwordConfirm?: string | null;
  name?: string | null;
}

export interface UseSignupLogicResult {
  step: 1 | 2;
  verification: EmailVerification;
  password: string;
  setPassword: (v: string) => void;
  passwordConfirm: string;
  setPasswordConfirm: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  errors: SignupErrors;
  pending: boolean;
  submit: (e: FormEvent) => void;
  loginHref: string;
  goBack: () => void;
}

// 이메일 가입: 1) 이메일 인증번호 확인 2) 비밀번호 · 이름 → 가입 → 온보딩
export function useSignupLogic(): UseSignupLogicResult {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const verification = useEmailVerification("signup", params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({});
  const [pending, setPending] = useState(false);

  const step = verification.verificationToken ? 2 : 1;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: SignupErrors = {
      password: checkPassword(password),
      passwordConfirm: password !== passwordConfirm ? "비밀번호가 서로 달라요." : null,
      name: checkName(name),
    };
    setErrors(found);
    if (Object.values(found).some(Boolean) || !verification.verificationToken) return;
    setPending(true);
    try {
      const res = await signupWithEmailAccount({
        email: normalizeEmail(verification.email),
        password,
        name: name.trim(),
        verificationToken: verification.verificationToken,
      });
      notify.success(`${res.user.name}님, 반가워요! 취향을 알려 주세요.`);
      router.replace(afterLoginRoute(res.user.onboardingCompleted, next));
    } catch (error) {
      setPending(false);
      const code = error instanceof ApiError ? error.code : null;
      if (code === "EMAIL_TAKEN" || code === "INVALID_CODE") {
        // 인증이 무효가 됐으면 처음부터
        verification.changeEmail();
        notify.error(code === "EMAIL_TAKEN" ? "이미 가입된 이메일이에요. 로그인해 주세요." : "이메일 인증을 다시 해 주세요.");
      } else if (code === "VALIDATION_FAILED") {
        notify.error((error as ApiError).message);
      } else {
        notify.error("가입하지 못했어요. 다시 시도해 주세요.");
      }
    }
  };

  const clear = (key: keyof SignupErrors) => setErrors((e) => ({ ...e, [key]: null }));

  return {
    step,
    verification,
    password,
    setPassword: (v) => {
      setPassword(v);
      clear("password");
    },
    passwordConfirm,
    setPasswordConfirm: (v) => {
      setPasswordConfirm(v);
      clear("passwordConfirm");
    },
    name,
    setName: (v) => {
      setName(v);
      clear("name");
    },
    errors,
    pending,
    submit,
    loginHref: withNext(ROUTES.emailLogin, next),
    // 2단계에서 뒤로 → 이메일 단계, 1단계에서 뒤로 → 이메일 로그인
    goBack: () => (step === 2 ? verification.changeEmail() : router.push(withNext(ROUTES.emailLogin, next))),
  };
}
