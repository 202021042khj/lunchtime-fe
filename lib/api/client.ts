import { ApiErrorBody, ErrorCode } from "@/types/common";
import { AuthTokens } from "@/types/user";
import {
  clearAdminToken,
  clearTokens,
  getAccessToken,
  getAdminAccessToken,
  getAdminRefreshToken,
  getRefreshToken,
  saveAdminToken,
  saveTokens,
} from "@/lib/api/token";

// 배포 환경은 NEXT_PUBLIC_API_BASE_URL을 꼭 넣는다. 없으면 로컬 백엔드(lunchtime-be, 4000)
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1";
// 백엔드 없이 화면만 볼 때 NEXT_PUBLIC_API_MOCK=true (목 데이터 · NEXT_PUBLIC_MOCK_SCENARIO)
export const USE_MOCK = process.env.NEXT_PUBLIC_API_MOCK === "true";

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
let refreshingAdmin: Promise<boolean> | null = null;

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

// 어드민 accessToken(30분)이 끝나면 refreshToken으로 다시 받는다. 실패하면 어드민 로그인 화면으로
function refreshAdminTokens(): Promise<boolean> {
  refreshingAdmin ??= (async () => {
    const refreshToken = getAdminRefreshToken();
    if (!refreshToken) return false;
    const res = await fetch(`${BASE_URL}/admin/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearAdminToken();
      const { markAdminGuest } = await import("@/lib/adminStore");
      markAdminGuest();
      return false;
    }
    const tokens = (await res.json()) as AuthTokens;
    saveAdminToken(tokens.accessToken, tokens.refreshToken);
    return true;
  })().finally(() => {
    refreshingAdmin = null;
  });
  return refreshingAdmin;
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
  if (!body?.error) return new ApiError(res.status, "UPSTREAM_UNAVAILABLE", "잠시 후 다시 시도해 주세요.");
  const { code, message, fields, until } = body.error;
  return new ApiError(res.status, code, message, fields, until);
}

export async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  if (USE_MOCK) {
    const { handleMock } = await import("@/lib/api/mock/handlers");
    return handleMock(method, path, toSearchParams(options.query), options.form ?? options.body) as Promise<T>;
  }

  let res = await send(method, path, options);
  // 로그인 API의 401(비밀번호 틀림 등)은 토큰 문제가 아니라서 재발급하지 않는다
  if (res.status === 401 && options.auth !== "admin" && !path.startsWith("/auth/") && (await refreshTokens())) {
    res = await send(method, path, options);
  }
  if (res.status === 401 && options.auth === "admin" && !path.startsWith("/admin/auth/") && (await refreshAdminTokens())) {
    res = await send(method, path, options);
  }
  if (!res.ok) throw await toApiError(res);
  let result: unknown = undefined;
  if (res.status !== 204) result = options.text ? await res.text() : await res.json();
  return result as T;
}
