import { request } from "@/lib/api/client";
import { clearAdminToken, saveAdminToken } from "@/lib/api/token";
import {
  AdminLoginRequest,
  AdminMenu,
  AdminMenusQuery,
  AdminMenusResponse,
  AdminSponsoredSummary,
  MenuImportResult,
  MenuInput,
  Sponsored,
  SponsoredInput,
  SponsoredPlace,
  SponsoredStatus,
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

// ---------- 메뉴 관리 ----------

export function getAdminMenus(query: AdminMenusQuery): Promise<AdminMenusResponse> {
  return request<AdminMenusResponse>("GET", "/admin/menus", { ...admin, query });
}

export function createMenu(input: MenuInput): Promise<AdminMenu> {
  return request<AdminMenu>("POST", "/admin/menus", { ...admin, body: input });
}

export function updateMenu(id: string, input: Partial<MenuInput>): Promise<AdminMenu> {
  return request<AdminMenu>("PATCH", `/admin/menus/${id}`, { ...admin, body: input });
}

// CSV 가져오기 (multipart, 같은 이름은 덮어쓰기)
export function importMenusCsv(file: File): Promise<MenuImportResult> {
  const form = new FormData();
  form.append("file", file);
  return request<MenuImportResult>("POST", "/admin/menus/import", { ...admin, form });
}

// 재료 · 알레르기 사전 (취향 선택지와 같은 목록)
export function getAdminIngredients(): Promise<{ items: string[] }> {
  return request<{ items: string[] }>("GET", "/admin/ingredients", admin);
}

// ---------- 광고 식당 고정 ----------

export function getSponsoredSummary(): Promise<AdminSponsoredSummary> {
  return request<AdminSponsoredSummary>("GET", "/admin/sponsored/summary", admin);
}

export function getSponsoredList(query: { status?: SponsoredStatus; page?: number; size?: number } = {}): Promise<AdminPage<Sponsored>> {
  return request<AdminPage<Sponsored>>("GET", "/admin/sponsored", { ...admin, query });
}

// 카카오 장소 검색 (광고 등록용)
export function searchPlaces(query: { q: string; lat?: number; lng?: number }): Promise<{ items: SponsoredPlace[] }> {
  return request<{ items: SponsoredPlace[] }>("GET", "/admin/places/search", { ...admin, query });
}

export function createSponsored(input: SponsoredInput): Promise<Sponsored> {
  return request<Sponsored>("POST", "/admin/sponsored", { ...admin, body: input });
}

export function updateSponsored(id: string, input: Partial<SponsoredInput>): Promise<Sponsored> {
  return request<Sponsored>("PATCH", `/admin/sponsored/${id}`, { ...admin, body: input });
}

// 종료된 광고를 조건을 복사해 다시 등록 (기간 · 광고료 · 결제 상태 등은 새로)
export function renewSponsored(id: string, input: Omit<SponsoredInput, "place">): Promise<Sponsored> {
  return request<Sponsored>("POST", `/admin/sponsored/${id}/renew`, { ...admin, body: input });
}

// 광고 취소 (즉시 노출 중단, 기록은 "종료 · 취소"로 남음)
export function cancelSponsored(id: string): Promise<void> {
  return request<void>("DELETE", `/admin/sponsored/${id}`, admin);
}
