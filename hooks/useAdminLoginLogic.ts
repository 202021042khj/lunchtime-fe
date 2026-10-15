"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ADMIN_ROUTES } from "@/constants/navigation";
import { refreshAdmin } from "@/lib/adminStore";
import { adminLogin } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

export interface UseAdminLoginLogicResult {
  loginId: string;
  setLoginId: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  otp: string;
  setOtp: (v: string) => void;
  error: string | null;
  pending: boolean;
  submit: (e: FormEvent) => void;
}

// 어드민 로그인: 아이디 · 비밀번호 + OTP 6자리 → 어드민 전용 토큰. 끝나면 ?next=(어드민 경로만)로
export function useAdminLoginLogic(): UseAdminLoginLogicResult {
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  const next = nextParam?.startsWith(`${ADMIN_ROUTES.root}/`) && !nextParam.startsWith(ADMIN_ROUTES.login) ? nextParam : ADMIN_ROUTES.users;
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtpRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password || otp.length !== 6) return setError("아이디, 비밀번호, OTP 6자리를 모두 입력해 주세요.");
    setPending(true);
    try {
      await adminLogin({ loginId: loginId.trim(), password, otp });
      await refreshAdmin();
      router.replace(next);
    } catch (err) {
      setPending(false);
      setOtpRaw("");
      const code = err instanceof ApiError ? err.code : null;
      setError(code === "INVALID_CREDENTIALS" || code === "RATE_LIMITED" ? (err as ApiError).message : "로그인하지 못했어요. 다시 시도해 주세요.");
    }
  };

  const clearError = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setError(null);
  };

  return {
    loginId,
    setLoginId: clearError(setLoginId),
    password,
    setPassword: clearError(setPassword),
    otp,
    setOtp: clearError((v: string) => setOtpRaw(v.replace(/\D/g, "").slice(0, 6))),
    error,
    pending,
    submit,
  };
}
