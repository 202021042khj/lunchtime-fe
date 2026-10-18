import { Menu } from "@/types/menu";
import { RestaurantHours } from "@/types/restaurant";
import { Review } from "@/types/review";
import { LoginProvider } from "@/types/user";

export type UserStatus = "active" | "suspended" | "withdrawn";

export type SponsoredStatus = "scheduled" | "active" | "ended";
export type PaymentStatus = "pending" | "paid";

export interface SponsoredPlace {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
}

export interface Sponsored {
  id: string;
  place: SponsoredPlace;
  targetMenuIds: string[];
  targetCategories: string[];
  radiusM: number;
  startDate: string;
  endDate: string;
  hours: RestaurantHours | null;
  priority: number;
  feeKrw: number;
  paymentStatus: PaymentStatus;
  status: SponsoredStatus; // 서버가 기간으로 계산
  canceled: boolean; // 기간 중에 취소해 종료된 광고
  targetMenuNames: string[]; // 표 표시용 (targetMenuIds의 이름)
  imageUrl: string | null; // 식당 사진 (어드민이 올림). 사진 없는 식당 목록에서 이 사진을 쓴다
  impressions: number;
  clicks: number;
}

export interface ReportGroup {
  review: Review;
  status: ReportStatus;
  resolution: ReportResolution | null;
  lastReportedAt: string;
  reasonCounts: { abuse: number; ad: number; false_info: number; irrelevant: number };
  reportCount: number;
  firstReportedAt: string;
  memos: string[];
  authorHistory: { reviewCount: number; reportCount: number; deletedCount: number };
}

// ---------- 어드민 인증 (사용자 로그인과 분리, API.md에 없어 FE에서 정함) ----------

export interface AdminProfile {
  id: string;
  loginId: string;
  name: string;
}

// POST /admin/auth/login — 아이디 · 비밀번호 + OTP 6자리
export interface AdminLoginRequest {
  loginId: string;
  password: string;
  otp: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminProfile;
}

// 목록 공통: 페이지 번호 방식 (API.md 어드민 API)
export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// ---------- 유저 관리 ----------

// GET /admin/users/summary
export interface AdminUsersSummary {
  total: number;
  newThisWeek: number;
  newWeekChangePercent: number | null; // 지난주 대비
  activeToday: number;
  suspended: number;
}

// GET /admin/users 한 줄 (이메일은 서버가 가려서 준다)
export interface AdminUser {
  id: string;
  name: string;
  maskedEmail: string;
  provider: LoginProvider;
  createdAt: string;
  lastActiveAt: string | null;
  reviewCount: number;
  favoriteCount: number;
  reportCount: number; // 받은 신고
  status: UserStatus;
  suspendedUntil: string | null; // 무기한이면 null
}

export interface AdminUsersQuery {
  q?: string;
  status?: UserStatus;
  page?: number;
  size?: number;
}

// POST /admin/users/{id}/suspend — days 없으면 무기한
export interface SuspendUserInput {
  days: number | null;
  reason: string;
}

// ---------- 리뷰 신고 ----------

export type ReportStatus = "pending" | "resolved";
export type ReportResolution = "dismissed" | "deleted";

// GET /admin/reports/summary
export interface AdminReportsSummary {
  pending: number;
  today: number;
  resolvedThisMonth: number;
  deleteRatePercent: number; // 처리한 것 중 삭제 비율
}

export interface AdminReportsQuery {
  status?: ReportStatus;
  page?: number;
  size?: number;
}

// POST /admin/reports/{reviewId}/resolve
export interface ResolveReportInput {
  action: "dismiss" | "delete";
  suspendAuthorDays?: number;
}

// ---------- 메뉴 관리 ----------

// GET /admin/menus 한 줄: 메뉴 마스터 + 7일 추천 수
export interface AdminMenu extends Menu {
  recommendCount7d: number;
}

export interface AdminMenusQuery {
  q?: string; // 메뉴 이름 · 재료
  cuisine?: string;
  visible?: boolean;
  page?: number;
  size?: number;
}

// GET /admin/menus 응답: 목록 + 종류별 · 숨김 개수 (필터 칩 숫자)
export interface AdminMenusResponse extends AdminPage<AdminMenu> {
  counts: { all: number; hidden: number };
}

// POST /admin/menus · PATCH /admin/menus/{id}
export type MenuInput = Omit<Menu, "id">;

// POST /admin/menus/import 결과
export interface MenuImportResult {
  created: number;
  updated: number;
  failed: { line: number; reason: string }[];
}

// ---------- 광고 식당 고정 ----------

// GET /admin/sponsored/summary
export interface AdminSponsoredSummary {
  active: number;
  monthRevenueKrw: number;
  avgCtrPercent: number | null;
  pendingPayment: number;
}

// POST /admin/sponsored · PATCH /admin/sponsored/{id} · POST /admin/sponsored/{id}/renew
export type SponsoredInput = Pick<
  Sponsored,
  "place" | "targetMenuIds" | "targetCategories" | "radiusM" | "startDate" | "endDate" | "hours" | "priority" | "feeKrw" | "paymentStatus" | "imageUrl"
>;

// POST /admin/uploads/images (multipart: file, purpose) → 메뉴 · 광고 저장 때 imageUrl로 보낸다
export type AdminImagePurpose = "menu" | "sponsored";
