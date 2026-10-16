import { getMe, login, loginWithEmail, signupWithEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { getProviderToken } from "@/lib/socialLogin";
import { EmailLoginRequest, EmailSignupRequest, LoginResponse, SocialProvider, User } from "@/types/user";

// 로그인 상태. 앱이 뜰 때 GET /me 한 번으로 정하고, 로그인 · 로그아웃 때 바꾼다.
// unknown(확인 전)이면 막지 않고 서버 응답(401)에 맡긴다
export type SessionStatus = "unknown" | "user" | "guest";

interface Session {
  status: SessionStatus;
  user: User | null;
}

const UNKNOWN: Session = { status: "unknown", user: null };
let session: Session = UNKNOWN;
const listeners = new Set<() => void>();

function set(next: Session) {
  session = next;
  listeners.forEach((l) => l());
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSession = () => session;
export const getSessionServer = () => UNKNOWN;

export async function refreshSession(): Promise<void> {
  try {
    set({ status: "user", user: await getMe() });
  } catch (error) {
    if (error instanceof ApiError && error.code === "UNAUTHORIZED") set({ status: "guest", user: null });
  }
}

export function markGuest() {
  set({ status: "guest", user: null });
}

// 새로 고친 뒤에 보여 줄 안내 한 줄 (팝업에서 로그인 → 새로 고침)
const FLASH_KEY = "lunchtime.flash";

export function setFlash(message: string) {
  try {
    window.sessionStorage.setItem(FLASH_KEY, message);
  } catch {
    // 못 남기면 안내 없이
  }
}

export function takeFlash(): string | null {
  try {
    const message = window.sessionStorage.getItem(FLASH_KEY);
    window.sessionStorage.removeItem(FLASH_KEY);
    return message;
  } catch {
    return null;
  }
}

// 소셜 토큰 받기 → POST /auth/login → 내 정보 다시 불러오기
export async function loginWith(provider: SocialProvider): Promise<LoginResponse> {
  const res = await login({ provider, providerToken: await getProviderToken(provider) });
  await refreshSession();
  return res;
}

// 웹(카카오 · 구글): 리다이렉트로 받은 인가 코드로 로그인
export async function loginWithSocialCode(provider: SocialProvider, code: string, redirectUri: string): Promise<LoginResponse> {
  const res = await login({ provider, code, redirectUri });
  await refreshSession();
  return res;
}

// 이메일 계정 로그인 · 가입도 끝나면 내 정보를 다시 불러온다
export async function loginWithEmailAccount(input: EmailLoginRequest): Promise<LoginResponse> {
  const res = await loginWithEmail(input);
  await refreshSession();
  return res;
}

export async function signupWithEmailAccount(input: EmailSignupRequest): Promise<LoginResponse> {
  const res = await signupWithEmail(input);
  await refreshSession();
  return res;
}
