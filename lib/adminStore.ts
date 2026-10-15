import { getAdminMe, getAdminReportsSummary } from "@/lib/api/admin";
import { AdminProfile } from "@/types/admin";

// 어드민 로그인 상태 + 사이드바 "리뷰 신고" 처리 대기 배지. 사용자 sessionStore와 따로 둔다
export interface AdminState {
  status: "unknown" | "admin" | "guest";
  admin: AdminProfile | null;
  pendingReports: number | null;
}

const INITIAL: AdminState = { status: "unknown", admin: null, pendingReports: null };
let state: AdminState = INITIAL;
const listeners = new Set<() => void>();

function set(patch: Partial<AdminState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function subscribeAdmin(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getAdminState = () => state;
export const getAdminStateServer = () => INITIAL;

export async function refreshAdmin(): Promise<void> {
  try {
    set({ status: "admin", admin: await getAdminMe() });
  } catch {
    // 401 · 네트워크 오류 모두 로그인 화면으로 (어드민은 확인 안 되면 막는다)
    set({ status: "guest", admin: null });
  }
}

export async function refreshPendingReports(): Promise<void> {
  try {
    set({ pendingReports: (await getAdminReportsSummary()).pending });
  } catch {
    // 배지는 못 받아도 화면은 쓴다
  }
}

export function setPendingReports(count: number) {
  set({ pendingReports: count });
}

export function markAdminGuest() {
  set({ status: "guest", admin: null, pendingReports: null });
}
