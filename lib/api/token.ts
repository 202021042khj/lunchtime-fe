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
