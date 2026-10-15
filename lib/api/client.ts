import { ApiErrorBody, ErrorCode } from "@/types/common";
import { AuthTokens } from "@/types/user";
import { clearTokens, getAccessToken, getAdminAccessToken, getRefreshToken, saveTokens } from "@/lib/api/token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.lunchtime.example/v1";
// 백엔드가 생기기 전까지 기본은 목. 실서버를 쓰려면 NEXT_PUBLIC_API_MOCK=false
export const USE_MOCK = process.env.NEXT_PUBLIC_API_MOCK !== "false";

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

async function send(method: HttpMethod, path: string, { query, body, auth = "user" }: RequestOptions): Promise<Response> {
  const qs = toSearchParams(query).toString();
  const token = auth === "admin" ? getAdminAccessToken() : getAccessToken();
  return fetch(`${BASE_URL}${path}${qs ? `?${qs}` : ""}`, {
    method,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
  if (USE_MOCK) {
    const { handleMock } = await import("@/lib/api/mock/handlers");
    return handleMock(method, path, toSearchParams(options.query), options.body) as Promise<T>;
  }

  let res = await send(method, path, options);
  // 로그인 API의 401(비밀번호 틀림 등)은 토큰 문제가 아니라서 재발급하지 않는다
  if (res.status === 401 && options.auth !== "admin" && !path.startsWith("/auth/") && (await refreshTokens())) {
    res = await send(method, path, options);
  }
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  if (options.text) return (await res.text()) as T;
  return (await res.json()) as T;
}
