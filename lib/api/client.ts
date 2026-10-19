import { ApiErrorBody, ErrorCode } from "@/types/common";
import { AuthTokens } from "@/types/user";
import { clearTokens, getAccessToken, getAdminAccessToken, getRefreshToken, saveTokens } from "@/lib/api/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.lunchtime.example/v1";
// 백엔드가 생기기 전까지 기본은 목. 실서버를 쓰려면 NEXT_PUBLIC_API_MOCK=false
export const USE_MOCK = process.env.NEXT_PUBLIC_API_MOCK !== "false";
// 2단계 중간 확인용: 목을 쓰면서 백엔드가 만들어진 기능만 실서버로 보낸다.
// NEXT_PUBLIC_API_REAL=auth,taste,locations (쉼표로 기능 묶음). 백엔드 단계가 끝날 때마다 묶음을 늘린다
const REAL_GROUPS: Record<string, (path: string) => boolean> = {
  auth: (p) => p.startsWith("/auth/") || p === "/me" || p === "/me/password",
  taste: (p) => p === "/me/preferences" || p.startsWith("/preferences/") || p === "/ingredients",
  locations: (p) => p === "/me/locations" || p.startsWith("/me/locations/") || p.startsWith("/locations/"),
  restaurants: (p) => p === "/restaurants" || p.startsWith("/restaurants/") || p === "/me/favorites" || p.startsWith("/me/favorites/"),
  weather: (p) => p === "/weather",
  recommendations: (p) => p === "/recommendations" || p === "/search",
  // 어드민 로그인 · 메뉴 관리 · 광고 · 사진 (유저 관리 · 리뷰 신고는 2단계-5까지 목)
  admin: (p) =>
    p.startsWith("/admin/auth/") ||
    p === "/admin/me" ||
    ["/admin/menus", "/admin/ingredients", "/admin/sponsored", "/admin/places", "/admin/uploads"].some((x) => p === x || p.startsWith(`${x}/`)),
};
const REAL = USE_MOCK
  ? (process.env.NEXT_PUBLIC_API_REAL ?? "")
      .split(",")
      .map((g) => REAL_GROUPS[g.trim()])
      .filter(Boolean)
  : [];

// 어드민 로그인을 실서버로 하면 아직 목인 어드민 화면도 그 토큰을 받아야 한다
export const realAdminAuth = () => REAL.includes(REAL_GROUPS.admin);

// 이 경로를 목으로 처리하는지
export const usesMock = (path: string) => USE_MOCK && !REAL.some((isReal) => isReal(path));

// 실서버로 로그인 · 로그아웃 · 탈퇴하면 목 로그인 상태도 맞춘다 (아직 목인 리뷰 화면이 같은 상태로 보이게)
const SIGN_IN_PATHS = ["/auth/login", "/auth/email/login", "/auth/email/signup"];
async function syncMock(method: HttpMethod, path: string) {
  const signedIn = SIGN_IN_PATHS.includes(path) ? true : path === "/auth/logout" || (method === "DELETE" && path === "/me") ? false : null;
  if (signedIn === null) return;
  const { setMockSignedIn } = await import("@/lib/api/mock/handlers");
  setMockSignedIn(signedIn);
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public fields?: Record<string, string>,
    public until?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  query?: object;
  body?: unknown;
  // admin: 어드민 토큰을 싣는다 (/admin/*). 사용자 토큰과 섞지 않는다
  auth?: "user" | "admin";
  // CSV 내려받기처럼 JSON이 아닌 응답
  text?: boolean;
  // 파일 올리기 (multipart). body 대신 쓴다
  form?: FormData;
}

// 배열은 콤마로 합치고(excludeMenuIds=m_12,m_7), 빈 값은 뺀다
export function toSearchParams(query: object = {}): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  return params;
}

async function send(method: HttpMethod, path: string, { query, body, form, auth = "user" }: RequestOptions): Promise<Response> {
  const qs = toSearchParams(query).toString();
  const token = auth === "admin" ? getAdminAccessToken() : getAccessToken();
  return fetch(`${BASE_URL}${path}${qs ? `?${qs}` : ""}`, {
    method,
    headers: {
      ...(body !== undefined && !form && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
}

let refreshing: Promise<boolean> | null = null;

// 동시에 여러 요청이 401을 받아도 refresh는 한 번만
function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    saveTokens((await res.json()) as AuthTokens);
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
  if (!body?.error) return new ApiError(res.status, "UPSTREAM_UNAVAILABLE", "잠시 후 다시 시도해 주세요.");
  const { code, message, fields, until } = body.error;
  return new ApiError(res.status, code, message, fields, until);
}

export async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  if (usesMock(path)) {
    const { handleMock } = await import("@/lib/api/mock/handlers");
    return handleMock(method, path, toSearchParams(options.query), options.form ?? options.body) as Promise<T>;
  }

  let res = await send(method, path, options);
  // 로그인 API의 401(비밀번호 틀림 등)은 토큰 문제가 아니라서 재발급하지 않는다
  if (res.status === 401 && options.auth !== "admin" && !path.startsWith("/auth/") && (await refreshTokens())) {
    res = await send(method, path, options);
  }
  if (!res.ok) throw await toApiError(res);
  let result: unknown = undefined;
  if (res.status !== 204) result = options.text ? await res.text() : await res.json();
  if (REAL.length) await syncMock(method, path);
  return result as T;
}
