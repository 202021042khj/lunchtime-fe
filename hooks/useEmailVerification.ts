"use client";

import { useEffect, useState } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { sendEmailCode, verifyEmailCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { checkEmail, isCode, normalizeEmail } from "@/lib/validation";
import { EmailCodePurpose } from "@/types/user";

export interface EmailVerification {
  email: string;
  setEmail: (email: string) => void;
  emailError: string | null;
  code: string;
  setCode: (code: string) => void;
  codeError: string | null;
  sent: boolean;
  sending: boolean;
  verifying: boolean;
  remainingSec: number; // 인증번호 남은 시간
  resendInSec: number; // 0이면 다시 받기 가능
  verificationToken: string | null;
  send: () => void;
  verify: () => void;
  changeEmail: () => void;
}

interface SentState {
  expiresAt: number;
  resendAt: number;
}

// 이메일 → 인증번호 받기 → 6자리 확인 → verificationToken (가입 · 비밀번호 재설정 공용)
export function useEmailVerification(purpose: EmailCodePurpose, initialEmail = ""): EmailVerification {
  const [email, setEmailRaw] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCodeRaw] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [sentState, setSentState] = useState<SentState | null>(null);
  const [now, setNow] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // 타이머: 1초마다 지금 시각을 갱신
  useEffect(() => {
    if (!sentState || verificationToken) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sentState, verificationToken]);

  const remainingSec = sentState ? Math.max(0, Math.ceil((sentState.expiresAt - now) / 1000)) : 0;
  const resendInSec = sentState ? Math.max(0, Math.ceil((sentState.resendAt - now) / 1000)) : 0;

  const send = async () => {
    const problem = checkEmail(email);
    if (problem) return setEmailError(problem);
    setSending(true);
    try {
      const res = await sendEmailCode({ email: normalizeEmail(email), purpose });
      const at = Date.now();
      setNow(at);
      setSentState({ expiresAt: at + res.expiresInSec * 1000, resendAt: at + res.resendAfterSec * 1000 });
      setCodeRaw("");
      setCodeError(null);
      notify.success("인증번호를 보냈어요. 메일함을 확인해 주세요.");
    } catch (error) {
      const errorCode = error instanceof ApiError ? error.code : null;
      if (errorCode === "EMAIL_TAKEN") setEmailError("이미 가입된 이메일이에요. 로그인해 주세요.");
      else if (errorCode === "VALIDATION_FAILED") setEmailError("이메일 형식이 맞지 않아요.");
      else if (errorCode === "RATE_LIMITED") setCodeError("잠시 후 다시 받아 주세요.");
      else notify.error("인증번호를 보내지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (!isCode(code)) return setCodeError("인증번호 6자리를 입력해 주세요.");
    if (remainingSec === 0) return setCodeError("인증번호 시간이 지났어요. 다시 받아 주세요.");
    setVerifying(true);
    try {
      const res = await verifyEmailCode({ email: normalizeEmail(email), purpose, code });
      setVerificationToken(res.verificationToken);
    } catch (error) {
      const message = error instanceof ApiError && (error.code === "INVALID_CODE" || error.code === "CODE_EXPIRED") ? error.message : null;
      setCodeError(message ?? "확인하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setVerifying(false);
    }
  };

  return {
    email,
    setEmail: (value) => {
      setEmailRaw(value);
      setEmailError(null);
    },
    emailError,
    code,
    // 숫자만, 최대 6자리
    setCode: (value) => {
      setCodeRaw(value.replace(/\D/g, "").slice(0, 6));
      setCodeError(null);
    },
    codeError,
    sent: !!sentState,
    sending,
    verifying,
    remainingSec,
    resendInSec,
    verificationToken,
    send,
    verify,
    changeEmail: () => {
      setSentState(null);
      setCodeRaw("");
      setCodeError(null);
      setVerificationToken(null);
    },
  };
}

// 600 → "10:00"
export const formatTimer = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
