"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { confirm } from "@/components/common/ConfirmDialog";
import { openMenuEditor } from "@/components/domain/admin/MenuEditorDrawer";
import { notify } from "@/components/ui/notify/notify-utils";
import { MENU_CUISINE_FILTERS } from "@/constants/admin";
import { getAdminMenus, importMenusCsv } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { AdminMenu, AdminMenusResponse } from "@/types/admin";

export const ADMIN_MENU_PAGE_SIZE = 20;

// 필터: 전체 · 종류 · 숨김 (?filter=한식 | hidden)
export type MenuFilter = "all" | "hidden" | (typeof MENU_CUISINE_FILTERS)[number];

export interface UseAdminMenusLogicResult {
  list: AdminMenusResponse | null;
  listStatus: "loading" | "ready" | "error";
  query: string;
  search: string;
  setSearch: (v: string) => void;
  filter: MenuFilter;
  setFilter: (f: MenuFilter) => void;
  setPage: (p: number) => void;
  edit: (menu: AdminMenu | null) => void;
  importing: boolean;
  importCsv: (e: ChangeEvent<HTMLInputElement>) => void;
  downloadTemplate: () => void;
  retry: () => void;
}

const TEMPLATE = [
  "이름,종류,카테고리,재료,맛,맵기,날씨,카카오 키워드,카카오 카테고리,노출",
  "얼큰 순두부찌개,한식,찌개류,두부|바지락|계란|고춧가루,매운맛|국물,3,쌀쌀함|비,순두부찌개,\"찌개,전골\",Y",
  "냉모밀,일식,면류,메밀면|무|파,시원함|담백,0,더움,냉모밀,일식,N",
].join("\n");

function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// 메뉴 관리 (어드민 A3). 검색어 · 필터 · 페이지는 URL(?q= &filter= &page=)
export function useAdminMenusLogic(): UseAdminMenusLogicResult {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const rawFilter = params.get("filter");
  const filter: MenuFilter =
    rawFilter === "hidden" || (MENU_CUISINE_FILTERS as readonly string[]).includes(rawFilter ?? "") ? (rawFilter as MenuFilter) : "all";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [search, setSearchRaw] = useState(query);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ key: string; list: AdminMenusResponse | null; failed: boolean } | null>(null);
  const [importing, setImporting] = useState(false);

  const setParams = (patch: { q?: string; filter?: MenuFilter; page?: number }) => {
    // 디바운스된 검색이 늦게 불려도 그사이 바뀐 필터를 덮지 않게, 지금 주소에서 읽는다
    const next = new URLSearchParams(window.location.search);
    const set = (k: string, v: string | null) => (v ? next.set(k, v) : next.delete(k));
    if ("q" in patch) set("q", patch.q?.trim() || null);
    if ("filter" in patch) set("filter", patch.filter === "all" ? null : (patch.filter ?? null));
    set("page", patch.page && patch.page > 1 ? String(patch.page) : null);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    if (search.trim() === query) return;
    const timer = window.setTimeout(() => setParams({ q: search, page: 1 }), 300);
    return () => window.clearTimeout(timer);
    // 검색어가 바뀔 때만 URL로 넘긴다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const key = JSON.stringify([query, filter, page, version]);
  useEffect(() => {
    let cancelled = false;
    getAdminMenus({
      q: query || undefined,
      cuisine: filter !== "all" && filter !== "hidden" ? filter : undefined,
      visible: filter === "hidden" ? false : undefined,
      page,
      size: ADMIN_MENU_PAGE_SIZE,
    })
      .then((list) => !cancelled && setResult({ key, list, failed: false }))
      .catch(() => !cancelled && setResult({ key, list: null, failed: true }));
    return () => {
      cancelled = true;
    };
    // key가 검색어 · 필터 · 페이지 · 새로 고침을 담는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const listStatus = !result || result.key !== key ? "loading" : result.failed ? "error" : "ready";

  const edit = async (menu: AdminMenu | null) => {
    if (await openMenuEditor(menu)) setVersion((v) => v + 1);
  };

  // CSV 가져오기: 같은 이름은 덮어쓰고, 실패한 줄은 알려 준다
  const importCsv = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const res = await importMenusCsv(file);
      setVersion((v) => v + 1);
      const summary = `새로 ${res.created}개 · 고침 ${res.updated}개`;
      if (!res.failed.length) {
        notify.success(`CSV를 가져왔어요. ${summary}`);
      } else {
        await confirm({
          title: `${res.failed.length}줄을 가져오지 못했어요`,
          description: `${summary}\n\n${res.failed
            .slice(0, 6)
            .map((f) => `${f.line}번째 줄: ${f.reason}`)
            .join("\n")}${res.failed.length > 6 ? `\n외 ${res.failed.length - 6}줄` : ""}`,
          confirmLabel: "확인",
          hideCancel: true,
        });
      }
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : "가져오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setImporting(false);
    }
  };

  return {
    list: result?.list ?? null,
    listStatus,
    query,
    search,
    setSearch: setSearchRaw,
    filter,
    setFilter: (f) => setParams({ filter: f, page: 1 }),
    setPage: (p) => setParams({ page: p }),
    edit,
    importing,
    importCsv,
    downloadTemplate: () => downloadText("lunchtime-menus-template.csv", TEMPLATE),
    retry: () => setVersion((v) => v + 1),
  };
}
