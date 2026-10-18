"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { confirm } from "@/components/common/ConfirmDialog";
import { askSuspendUser } from "@/components/domain/admin/SuspendUserDialog";
import { notify } from "@/components/ui/notify/notify-utils";
import { exportAdminUsersCsv, getAdminUsers, getAdminUsersSummary, suspendUser, unsuspendUser } from "@/lib/api/admin";
import { AdminPage, AdminUser, AdminUsersSummary, UserStatus } from "@/types/admin";

export const ADMIN_PAGE_SIZE = 20;
const STATUSES: UserStatus[] = ["active", "suspended", "withdrawn"];

export interface UseAdminUsersLogicResult {
  summary: AdminUsersSummary | null;
  list: AdminPage<AdminUser> | null;
  listStatus: "loading" | "ready" | "error";
  query: string;
  search: string;
  setSearch: (v: string) => void;
  status: UserStatus | null;
  setStatus: (s: UserStatus | null) => void;
  setPage: (p: number) => void;
  suspend: (user: AdminUser) => void;
  unsuspend: (user: AdminUser) => void;
  exportCsv: () => void;
  exporting: boolean;
  retry: () => void;
}

// 유저 관리 (어드민 A1). 검색어 · 상태 · 페이지는 URL(?q= &status= &page=)에 둔다
export function useAdminUsersLogic(): UseAdminUsersLogicResult {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const rawStatus = params.get("status") as UserStatus | null;
  const status = rawStatus && STATUSES.includes(rawStatus) ? rawStatus : null;
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [search, setSearchRaw] = useState(query);
  const [version, setVersion] = useState(0);
  const [summary, setSummary] = useState<AdminUsersSummary | null>(null);
  const [result, setResult] = useState<{ key: string; list: AdminPage<AdminUser> | null; failed: boolean } | null>(null);
  const [exporting, setExporting] = useState(false);

  const setParams = (patch: { q?: string; status?: UserStatus | null; page?: number }) => {
    // 디바운스된 검색이 늦게 불려도 그사이 바뀐 필터를 덮지 않게, 지금 주소에서 읽는다
    const next = new URLSearchParams(window.location.search);
    const set = (k: string, v: string | null) => (v ? next.set(k, v) : next.delete(k));
    if ("q" in patch) set("q", patch.q?.trim() || null);
    if ("status" in patch) set("status", patch.status ?? null);
    set("page", patch.page && patch.page > 1 ? String(patch.page) : null);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  // 검색은 입력을 멈추고 300ms 뒤에 URL로 (첫 페이지부터)
  useEffect(() => {
    if (search.trim() === query) return;
    const timer = window.setTimeout(() => setParams({ q: search, page: 1 }), 300);
    return () => window.clearTimeout(timer);
    // setParams는 params에 따라 바뀌지만, 검색어가 바뀔 때만 부르면 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    getAdminUsersSummary()
      .then((s) => !cancelled && setSummary(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [version]);

  const key = JSON.stringify([query, status, page, version]);
  useEffect(() => {
    let cancelled = false;
    getAdminUsers({ q: query || undefined, status: status ?? undefined, page, size: ADMIN_PAGE_SIZE })
      .then((list) => !cancelled && setResult({ key, list, failed: false }))
      .catch(() => !cancelled && setResult({ key, list: null, failed: true }));
    return () => {
      cancelled = true;
    };
    // key가 검색어 · 상태 · 페이지 · 새로 고침을 담는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const listStatus = !result || result.key !== key ? "loading" : result.failed ? "error" : "ready";

  const suspend = async (user: AdminUser) => {
    const input = await askSuspendUser(user.name);
    if (!input) return;
    try {
      await suspendUser(user.id, input);
      notify.success(`${user.name}님을 ${input.days ? `${input.days}일` : "무기한"} 정지했어요.`);
      setVersion((v) => v + 1);
    } catch {
      notify.error("정지하지 못했어요. 다시 시도해 주세요.");
    }
  };

  const unsuspend = async (user: AdminUser) => {
    const ok = await confirm({ title: `${user.name}님의 정지를 풀까요?`, description: "바로 리뷰 · 신고를 다시 쓸 수 있어요.", confirmLabel: "정지 해제" });
    if (!ok) return;
    try {
      await unsuspendUser(user.id);
      notify.success(`${user.name}님의 정지를 풀었어요.`);
      setVersion((v) => v + 1);
    } catch {
      notify.error("정지를 풀지 못했어요. 다시 시도해 주세요.");
    }
  };

  // 지금 검색어 · 상태 필터 그대로 내려받는다. 엑셀에서 한글이 깨지지 않게 BOM을 붙인다
  const exportCsv = async () => {
    setExporting(true);
    try {
      const csv = await exportAdminUsersCsv({ q: query || undefined, status: status ?? undefined });
      const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      // 이 컴퓨터 날짜 (UTC로 하면 한국 0~9시에 어제 날짜가 된다)
      a.download = `lunchtime-users-${new Date().toLocaleDateString("sv-SE")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notify.error("내보내지 못했어요. 다시 시도해 주세요.");
    } finally {
      setExporting(false);
    }
  };

  return {
    summary,
    list: result?.list ?? null,
    listStatus,
    query,
    search,
    setSearch: setSearchRaw,
    status,
    setStatus: (s) => setParams({ status: s, page: 1 }),
    setPage: (p) => setParams({ page: p }),
    suspend,
    unsuspend,
    exportCsv,
    exporting,
    retry: () => setVersion((v) => v + 1),
  };
}
