"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { confirm } from "@/components/common/ConfirmDialog";
import { notify } from "@/components/ui/notify/notify-utils";
import { refreshPendingReports } from "@/lib/adminStore";
import { getAdminReports, getAdminReportsSummary, resolveReport } from "@/lib/api/admin";
import { AdminPage, AdminReportsSummary, ReportGroup, ReportStatus } from "@/types/admin";

export type ReportTab = ReportStatus | "all";
// 정지를 같이 처리할 때 기간 (Figma A4: 작성자 7일 이용 정지)
export const SUSPEND_WITH_REPORT_DAYS = 7;
const TABS: ReportTab[] = ["pending", "resolved", "all"];

export interface UseAdminReportsLogicResult {
  summary: AdminReportsSummary | null;
  tab: ReportTab;
  setTab: (tab: ReportTab) => void;
  list: AdminPage<ReportGroup> | null;
  listStatus: "loading" | "ready" | "error";
  selected: ReportGroup | null;
  select: (report: ReportGroup) => void;
  suspendAuthor: boolean;
  setSuspendAuthor: (v: boolean) => void;
  resolving: boolean;
  dismiss: () => void;
  remove: () => void;
  retry: () => void;
}

// 리뷰 신고 (어드민 A4). 탭은 ?status=, 고른 신고는 ?id=(리뷰 id)
export function useAdminReportsLogic(): UseAdminReportsLogicResult {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const rawTab = params.get("status") as ReportTab | null;
  const tab = rawTab && TABS.includes(rawTab) ? rawTab : "pending";
  const selectedId = params.get("id");

  const [version, setVersion] = useState(0);
  const [summary, setSummary] = useState<AdminReportsSummary | null>(null);
  const [result, setResult] = useState<{ key: string; list: AdminPage<ReportGroup> | null; failed: boolean } | null>(null);
  // 정지 같이 처리: 고른 신고마다 기본값(작성자가 받은 신고 3건 이상이면 켬)에서 시작
  const [suspendChoice, setSuspendChoice] = useState<{ id: string; value: boolean } | null>(null);
  const [resolving, setResolving] = useState(false);

  const replaceParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    let cancelled = false;
    getAdminReportsSummary()
      .then((s) => !cancelled && setSummary(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [version]);

  const key = JSON.stringify([tab, version]);
  useEffect(() => {
    let cancelled = false;
    getAdminReports({ status: tab === "all" ? undefined : tab, size: 50 })
      .then((list) => !cancelled && setResult({ key, list, failed: false }))
      .catch(() => !cancelled && setResult({ key, list: null, failed: true }));
    return () => {
      cancelled = true;
    };
    // key가 탭 · 새로 고침을 담는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const listStatus = !result || result.key !== key ? "loading" : result.failed ? "error" : "ready";
  const list = result?.list ?? null;
  const items = list?.items ?? [];
  const selected = items.find((r) => r.review.id === selectedId) ?? items[0] ?? null;
  const suspendAuthor =
    selected && suspendChoice?.id === selected.review.id ? suspendChoice.value : (selected?.authorHistory.reportCount ?? 0) >= 3;

  const resolve = async (action: "dismiss" | "delete") => {
    if (!selected) return;
    const suspendDays = suspendAuthor ? SUSPEND_WITH_REPORT_DAYS : undefined;
    if (action === "delete") {
      const ok = await confirm({
        title: "리뷰를 삭제할까요?",
        description: `신고 ${selected.reportCount}건이 함께 처리되고 식당 별점이 다시 계산돼요.${suspendDays ? ` 작성자는 ${suspendDays}일 정지돼요.` : ""}`,
        confirmLabel: "삭제",
        destructive: true,
      });
      if (!ok) return;
    }
    setResolving(true);
    try {
      await resolveReport(selected.review.id, { action, suspendAuthorDays: suspendDays });
      notify.success(
        `${action === "delete" ? "리뷰를 삭제했어요" : "신고를 기각했어요"}${suspendDays ? ` · ${selected.review.author.name}님 ${suspendDays}일 정지` : ""}.`,
      );
      // 다음 신고로 넘어간다 (목록 첫 건)
      replaceParams({ id: null });
      setVersion((v) => v + 1);
      refreshPendingReports();
    } catch {
      notify.error("처리하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setResolving(false);
    }
  };

  return {
    summary,
    tab,
    setTab: (t) => replaceParams({ status: t === "pending" ? null : t, id: null }),
    list,
    listStatus,
    selected,
    select: (r) => replaceParams({ id: r.review.id }),
    suspendAuthor,
    setSuspendAuthor: (value) => selected && setSuspendChoice({ id: selected.review.id, value }),
    resolving,
    dismiss: () => resolve("dismiss"),
    remove: () => resolve("delete"),
    retry: () => setVersion((v) => v + 1),
  };
}
