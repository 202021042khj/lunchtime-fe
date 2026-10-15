import { AuthTokens } from "@/types/user";

const ACCESS_KEY = "lunchtime.accessToken";
const REFRESH_KEY = "lunchtime.refreshToken";

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return read(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return read(REFRESH_KEY);
}

export function saveTokens(tokens: AuthTokens): void {
  try {
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } catch {
    // 저장 못 하면 이번 세션만 비로그인처럼 동작
  }
}

export function clearTokens(): void {
  try {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  } catch {
    // 무시
  }
}

// ---------- 어드민 토큰 (사용자 토큰과 따로 둔다) ----------
// 실서버에서는 httpOnly 쿠키로 받는 걸 권장한다 (어드민은 웹에서만 쓰므로). 목 단계에서는 localStorage

const ADMIN_ACCESS_KEY = "lunchtime.adminAccessToken";

export function getAdminAccessToken(): string | null {
  return read(ADMIN_ACCESS_KEY);
}

export function saveAdminToken(accessToken: string): void {
  try {
    window.localStorage.setItem(ADMIN_ACCESS_KEY, accessToken);
  } catch {
    // 저장 못 하면 이번 세션만
  }
}

export function clearAdminToken(): void {
  try {
    window.localStorage.removeItem(ADMIN_ACCESS_KEY);
  } catch {
    // 무시
  }
}
