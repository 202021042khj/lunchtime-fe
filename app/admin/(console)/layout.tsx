"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useSyncExternalStore } from "react";
import { confirm } from "@/components/common/ConfirmDialog";
import AdminSidebar from "@/components/layout/admin/AdminSidebar";
import { ADMIN_ROUTES, withNext } from "@/constants/navigation";
import { adminLogout } from "@/lib/api/admin";
import { getAdminState, getAdminStateServer, markAdminGuest, refreshAdmin, refreshPendingReports, subscribeAdmin } from "@/lib/adminStore";

// 어드민 콘솔 틀: 왼쪽 사이드바 + 본문. 어드민 로그인이 확인돼야 본문을 그린다 (사용자 로그인과 별개)
export default function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const admin = useSyncExternalStore(subscribeAdmin, getAdminState, getAdminStateServer);

  useEffect(() => {
    refreshAdmin().then(refreshPendingReports);
  }, []);

  useEffect(() => {
    if (admin.status === "guest") router.replace(withNext(ADMIN_ROUTES.login, pathname));
  }, [admin.status, pathname, router]);

  const logout = async () => {
    if (!(await confirm({ title: "로그아웃할까요?", confirmLabel: "로그아웃" }))) return;
    await adminLogout().catch(() => {});
    markAdminGuest();
  };

  if (admin.status !== "admin") {
    return (
      <div aria-busy aria-label="관리자 확인 중" className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AdminSidebar admin={admin.admin} pendingReports={admin.pendingReports} onLogout={logout} />
      <main className="min-w-0 flex-1 px-6 pt-8 pb-10 lg:px-8">{children}</main>
    </div>
  );
}
