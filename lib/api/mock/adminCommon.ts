// 어드민 목 핸들러 공용: 에러 · 어드민 토큰 확인 · 페이지 나눔
import { ApiError } from "@/lib/api/client";
import { getAdminAccessToken } from "@/lib/api/token";
import { ErrorCode } from "@/types/common";

export type AdminCtx = { params: Record<string, string>; query: URLSearchParams; body: unknown };
export type AdminHandler = (ctx: AdminCtx) => unknown;

export const ADMIN_TOKEN = "mock-admin-access";

export function fail(status: number, code: ErrorCode, message: string): never {
  throw new ApiError(status, code, message);
}

// 어드민 토큰은 사용자 토큰과 따로 확인한다 (사용자로 로그인했어도 어드민 API는 401)
export function requireAdmin(): void {
  const token = getAdminAccessToken();
  if (token !== ADMIN_TOKEN) fail(401, "UNAUTHORIZED", "관리자 로그인이 필요해요.");
}

export function page<T>(items: T[], query: URLSearchParams) {
  const size = Math.min(Number(query.get("size") ?? 20) || 20, 100);
  const total = items.length;
  const last = Math.max(1, Math.ceil(total / size));
  const p = Math.min(Math.max(Number(query.get("page") ?? 1) || 1, 1), last);
  return { items: items.slice((p - 1) * size, p * size), total, page: p, size };
}
