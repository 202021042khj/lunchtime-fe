import { request } from "@/lib/api/client";
import { clearAdminToken, saveAdminToken } from "@/lib/api/token";
import {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminPage,
  AdminProfile,
  AdminReportsQuery,
  AdminReportsSummary,
  AdminUser,
  AdminUsersQuery,
  AdminUsersSummary,
  ReportGroup,
  ResolveReportInput,
  SuspendUserInput,
} from "@/types/admin";

// 어드민 API는 모두 어드민 토큰으로 부른다 (사용자 토큰과 분리)
const admin = { auth: "admin" } as const;

// ---------- 인증 ----------

export async function adminLogin(input: AdminLoginRequest): Promise<AdminLoginResponse> {
  const res = await request<AdminLoginResponse>("POST", "/admin/auth/login", { ...admin, body: input });
  saveAdminToken(res.accessToken);
  return res;
}

export async function adminLogout(): Promise<void> {
  try {
    await request<void>("POST", "/admin/auth/logout", admin);
  } finally {
    clearAdminToken();
  }
}

export function getAdminMe(): Promise<AdminProfile> {
  return request<AdminProfile>("GET", "/admin/me", admin);
}

// ---------- 유저 관리 ----------

export function getAdminUsersSummary(): Promise<AdminUsersSummary> {
  return request<AdminUsersSummary>("GET", "/admin/users/summary", admin);
}

export function getAdminUsers(query: AdminUsersQuery): Promise<AdminPage<AdminUser>> {
  return request<AdminPage<AdminUser>>("GET", "/admin/users", { ...admin, query });
}

export function suspendUser(id: string, input: SuspendUserInput): Promise<AdminUser> {
  return request<AdminUser>("POST", `/admin/users/${id}/suspend`, { ...admin, body: input });
}

export function unsuspendUser(id: string): Promise<AdminUser> {
  return request<AdminUser>("POST", `/admin/users/${id}/unsuspend`, admin);
}

export function exportAdminUsersCsv(query: Pick<AdminUsersQuery, "q" | "status">): Promise<string> {
  return request<string>("GET", "/admin/users/export.csv", { ...admin, query, text: true });
}

// ---------- 리뷰 신고 ----------

export function getAdminReportsSummary(): Promise<AdminReportsSummary> {
  return request<AdminReportsSummary>("GET", "/admin/reports/summary", admin);
}

export function getAdminReports(query: AdminReportsQuery): Promise<AdminPage<ReportGroup>> {
  return request<AdminPage<ReportGroup>>("GET", "/admin/reports", { ...admin, query });
}

export function resolveReport(reviewId: string, input: ResolveReportInput): Promise<ReportGroup> {
  return request<ReportGroup>("POST", `/admin/reports/${reviewId}/resolve`, { ...admin, body: input });
}
