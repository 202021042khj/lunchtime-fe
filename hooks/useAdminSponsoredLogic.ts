"use client";

import { useEffect, useState } from "react";
import { openSponsoredEditor, SponsoredEditorMode } from "@/components/domain/admin/SponsoredEditorDrawer";
import { getSponsoredList, getSponsoredSummary } from "@/lib/api/admin";
import { AdminPage, AdminSponsoredSummary, Sponsored } from "@/types/admin";

export interface UseAdminSponsoredLogicResult {
  summary: AdminSponsoredSummary | null;
  list: AdminPage<Sponsored> | null;
  listStatus: "loading" | "ready" | "error";
  open: (mode: SponsoredEditorMode, sponsored?: Sponsored) => void;
  retry: () => void;
}

// 광고 식당 고정 (어드민 A2). 진행 중 → 예약 → 종료 순, 같은 상태는 우선순위 순
export function useAdminSponsoredLogic(): UseAdminSponsoredLogicResult {
  const [version, setVersion] = useState(0);
  const [summary, setSummary] = useState<AdminSponsoredSummary | null>(null);
  const [result, setResult] = useState<{ version: number; list: AdminPage<Sponsored> | null; failed: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSponsoredSummary()
      .then((s) => !cancelled && setSummary(s))
      .catch(() => {});
    getSponsoredList({ size: 100 })
      .then((list) => !cancelled && setResult({ version, list, failed: false }))
      .catch(() => !cancelled && setResult({ version, list: null, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [version]);

  const listStatus = !result || result.version !== version ? "loading" : result.failed ? "error" : "ready";

  return {
    summary,
    list: result?.list ?? null,
    listStatus,
    open: async (mode, sponsored) => {
      if (await openSponsoredEditor(mode, sponsored ?? null)) setVersion((v) => v + 1);
    },
    retry: () => setVersion((v) => v + 1),
  };
}
