// 어드민 목 API. 사용자 쪽 목(handlers.ts)과 상태를 나눠 둔다.
import { PROVIDER_LABELS } from "@/constants/user";
import { ADMIN_TOKEN, AdminHandler, fail, page, requireAdmin } from "@/lib/api/mock/adminCommon";
import { MOCK_ADMIN, MOCK_ADMIN_OTP, MOCK_ADMIN_USERS, MOCK_PAST_RESOLVED, MOCK_REPORT_GROUPS } from "@/lib/api/mock/adminData";
import { AdminLoginRequest, AdminUser, ReportGroup, ResolveReportInput, SuspendUserInput, UserStatus } from "@/types/admin";

const DAY = 24 * 60 * 60 * 1000;

const state = {
  users: structuredClone(MOCK_ADMIN_USERS),
  reports: structuredClone(MOCK_REPORT_GROUPS),
  loginFailures: new Map<string, number>(),
};

function filteredUsers(query: URLSearchParams): AdminUser[] {
  const q = query.get("q")?.trim().toLowerCase() ?? "";
  const status = query.get("status") as UserStatus | null;
  return state.users
    .filter((u) => !status || u.status === status)
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.maskedEmail.toLowerCase().includes(q));
}

function findUser(id: string): AdminUser {
  return state.users.find((u) => u.id === id) ?? fail(404, "NOT_FOUND", "유저를 찾을 수 없어요.");
}

function suspend(user: AdminUser, days: number | null) {
  user.status = "suspended";
  user.suspendedUntil = days ? new Date(Date.now() + days * DAY).toISOString() : null;
}

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const csvCell = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const STATUS_LABELS: Record<UserStatus, string> = { active: "정상", suspended: "정지", withdrawn: "탈퇴" };

export function createAdminRoutes(deps: { removeReview: (reviewId: string) => void }): Record<string, AdminHandler> {
  return {
    // ---------- 인증 ----------
    "POST /admin/auth/login": ({ body }) => {
      const { loginId = "", password = "", otp = "" } = (body ?? {}) as Partial<AdminLoginRequest>;
      const id = loginId.trim();
      if ((state.loginFailures.get(id) ?? 0) >= 5) fail(429, "RATE_LIMITED", "로그인을 여러 번 실패했어요. 잠시 후 다시 시도해 주세요.");
      if (id !== MOCK_ADMIN.loginId || password !== MOCK_ADMIN.password || otp !== MOCK_ADMIN_OTP) {
        state.loginFailures.set(id, (state.loginFailures.get(id) ?? 0) + 1);
        // 어느 칸이 틀렸는지 알려 주지 않는다
        fail(401, "INVALID_CREDENTIALS", "아이디, 비밀번호 또는 OTP가 맞지 않아요.");
      }
      state.loginFailures.delete(id);
      const { id: adminId, name } = MOCK_ADMIN;
      return { accessToken: ADMIN_TOKEN, refreshToken: "mock-admin-refresh", admin: { id: adminId, loginId: id, name } };
    },
    "POST /admin/auth/logout": () => undefined,
    "GET /admin/me": () => {
      requireAdmin();
      return { id: MOCK_ADMIN.id, loginId: MOCK_ADMIN.loginId, name: MOCK_ADMIN.name };
    },

    // ---------- 유저 관리 ----------
    "GET /admin/users/summary": () => {
      requireAdmin();
      const now = Date.now();
      const created = (from: number, to: number) =>
        state.users.filter((u) => now - new Date(u.createdAt).getTime() >= from && now - new Date(u.createdAt).getTime() < to).length;
      const thisWeek = created(0, 7 * DAY);
      const lastWeek = created(7 * DAY, 14 * DAY);
      return {
        total: state.users.filter((u) => u.status !== "withdrawn").length,
        newThisWeek: thisWeek,
        newWeekChangePercent: lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null,
        activeToday: state.users.filter((u) => u.lastActiveAt && now - new Date(u.lastActiveAt).getTime() < DAY).length,
        suspended: state.users.filter((u) => u.status === "suspended").length,
      };
    },
    "GET /admin/users": ({ query }) => {
      requireAdmin();
      return page(filteredUsers(query), query);
    },
    "GET /admin/users/export.csv": ({ query }) => {
      requireAdmin();
      const header = ["id", "이름", "이메일", "로그인", "가입일", "최근 접속", "리뷰", "찜", "받은 신고", "상태"];
      const rows = filteredUsers(query).map((u) => [
        u.id, u.name, u.maskedEmail, PROVIDER_LABELS[u.provider], u.createdAt.slice(0, 10), u.lastActiveAt?.slice(0, 10) ?? "",
        u.reviewCount, u.favoriteCount, u.reportCount, STATUS_LABELS[u.status],
      ]);
      return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    },
    "POST /admin/users/:id/suspend": ({ params, body }) => {
      requireAdmin();
      const { days = null, reason = "" } = (body ?? {}) as Partial<SuspendUserInput>;
      if (!reason.trim()) fail(400, "VALIDATION_FAILED", "정지 사유를 적어 주세요.");
      const user = findUser(params.id);
      if (user.status === "withdrawn") fail(409, "CONFLICT", "탈퇴한 유저는 정지할 수 없어요.");
      suspend(user, days);
      return user;
    },
    "POST /admin/users/:id/unsuspend": ({ params }) => {
      requireAdmin();
      const user = findUser(params.id);
      user.status = "active";
      user.suspendedUntil = null;
      return user;
    },

    // ---------- 리뷰 신고 ----------
    "GET /admin/reports/summary": () => {
      requireAdmin();
      // 실제 서버는 처리 시각으로 이번 달을 거른다. 목은 예전 처리 건(MOCK_PAST_RESOLVED)을 더한다
      const resolved = state.reports.filter((r) => r.status === "resolved");
      const dismissed = MOCK_PAST_RESOLVED.dismissed + resolved.filter((r) => r.resolution === "dismissed").length;
      const deleted = MOCK_PAST_RESOLVED.deleted + resolved.filter((r) => r.resolution === "deleted").length;
      return {
        pending: state.reports.filter((r) => r.status === "pending").length,
        today: state.reports.filter((r) => isToday(r.lastReportedAt)).length,
        resolvedThisMonth: dismissed + deleted,
        deleteRatePercent: Math.round((deleted / Math.max(1, dismissed + deleted)) * 100),
      };
    },
    "GET /admin/reports": ({ query }) => {
      requireAdmin();
      const status = query.get("status");
      const items = state.reports
        .filter((r) => !status || r.status === status)
        .sort((a, b) => b.lastReportedAt.localeCompare(a.lastReportedAt));
      return page(items, query);
    },
    "POST /admin/reports/:reviewId/resolve": ({ params, body }) => {
      requireAdmin();
      const { action, suspendAuthorDays } = (body ?? {}) as Partial<ResolveReportInput>;
      if (action !== "dismiss" && action !== "delete") fail(400, "VALIDATION_FAILED", "처리 방법을 골라 주세요.");
      const report: ReportGroup = state.reports.find((r) => r.review.id === params.reviewId) ?? fail(404, "NOT_FOUND", "신고를 찾을 수 없어요.");
      if (report.status === "resolved") fail(409, "CONFLICT", "이미 처리한 신고예요.");
      report.status = "resolved";
      report.resolution = action === "delete" ? "deleted" : "dismissed";
      if (action === "delete") {
        report.authorHistory.deletedCount += 1;
        // 리뷰를 지우면 식당 별점 · 리뷰 수도 다시 계산된다 (사용자 쪽 목 상태)
        deps.removeReview(report.review.id);
      }
      if (suspendAuthorDays) {
        const author = state.users.find((u) => u.id === report.review.author.id);
        if (author && author.status !== "withdrawn") suspend(author, suspendAuthorDays);
      }
      return report;
    },
  };
}
