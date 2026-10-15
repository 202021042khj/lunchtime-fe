import { AlertTriangle, ImageIcon, Plus, Search } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import SelectChip from "@/components/common/SelectChip";
import { AdminTag } from "@/components/domain/admin/AdminDrawer";
import { ADMIN_CARD, AdminPageHeader, AdminPagination, AdminStatusBadge } from "@/components/domain/admin/AdminWidgets";
import Button from "@/components/ui/button";
import { MENU_CUISINE_FILTERS, weatherLabel } from "@/constants/admin";
import { ADMIN_MENU_PAGE_SIZE, MenuFilter, UseAdminMenusLogicResult } from "@/hooks/useAdminMenusLogic";
import { cn } from "@/lib/utils";
import { AdminMenu } from "@/types/admin";

// Figma A3 Menu Table (29:1220) 열 너비
const COLS = "grid grid-cols-[170px_72px_170px_130px_130px_110px_60px_70px_minmax(60px,1fr)] items-center gap-3 px-5";
const HEADERS = ["메뉴", "카테고리", "주요 재료", "맛", "어울리는 날씨", "카카오 검색 키워드", "7일 추천", "상태", ""];

function Tags({ items, empty }: { items: string[]; empty?: string }) {
  if (!items.length) return empty ? <span><AdminTag label={empty} /></span> : <span className="text-labels-tertiary">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((t) => (
        <AdminTag key={t} label={t} />
      ))}
    </span>
  );
}

function MenuRow({ menu, onEdit }: { menu: AdminMenu; onEdit: () => void }) {
  return (
    <li className={cn(COLS, "py-3 text-subheadline")}>
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-placeholder text-labels-tertiary">
          <ImageIcon aria-hidden className="size-4" />
        </span>
        <span className="truncate font-semibold text-labels-primary">{menu.name}</span>
      </span>
      <span className="text-labels-primary">{menu.cuisine}</span>
      <Tags items={menu.ingredients} />
      <Tags items={menu.tastes} />
      <Tags items={menu.weathers.map(weatherLabel)} empty="상관없음" />
      <span className="truncate text-labels-secondary">{menu.kakaoKeyword}</span>
      <span className="text-labels-primary">{menu.recommendCount7d.toLocaleString("ko-KR")}</span>
      <span>
        <AdminStatusBadge label={menu.visible ? "노출" : "숨김"} tone={menu.visible ? "green" : "gray"} />
      </span>
      <span className="text-right">
        <button type="button" onClick={onEdit} className="font-semibold text-brand-primary hover:underline">
          편집
        </button>
      </span>
    </li>
  );
}

// Figma: A3 Admin · 메뉴 관리 (29:891)
export default function MenusPage(logic: UseAdminMenusLogicResult) {
  const counts = logic.list?.counts;
  const filters: { value: MenuFilter; label: string }[] = [
    { value: "all", label: counts ? `전체 ${counts.all}` : "전체" },
    ...MENU_CUISINE_FILTERS.map((c) => ({ value: c as MenuFilter, label: c })),
    { value: "hidden", label: counts ? `숨김 ${counts.hidden}` : "숨김" },
  ];
  const list = logic.list;

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="메뉴 관리"
        description="추천에 쓰이는 메뉴와 재료·맛·날씨 속성을 관리해요. 재료는 취향 필터에 바로 쓰여요."
        actions={
          <div className="flex items-center gap-3">
            <button type="button" onClick={logic.downloadTemplate} className="text-footnote font-semibold text-labels-secondary underline hover:text-labels-primary">
              CSV 양식 내려받기
            </button>
            <label
              className={cn(
                "inline-flex h-[43px] cursor-pointer items-center rounded-full border border-glass-border bg-glass-card px-4 text-[16px] font-semibold text-labels-primary shadow-glass",
                logic.importing && "pointer-events-none opacity-60",
              )}
            >
              {logic.importing ? "가져오는 중…" : "CSV 가져오기"}
              <input type="file" accept=".csv,text/csv" onChange={logic.importCsv} className="sr-only" aria-label="CSV 가져오기" />
            </label>
            <Button type="button" color="brand" shape="round" size="md" onClick={() => logic.edit(null)} leftIcon={<Plus aria-hidden className="size-4" />} className="gap-1 font-semibold">
              메뉴 추가
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-10 w-[280px] items-center gap-2 rounded-full border border-separators-non-opaque bg-white/80 px-3.5">
          <Search aria-hidden className="size-4 shrink-0 text-labels-secondary" />
          <input
            value={logic.search}
            onChange={(e) => logic.setSearch(e.target.value)}
            placeholder="메뉴, 재료로 검색"
            aria-label="메뉴, 재료로 검색"
            className="min-w-0 flex-1 bg-transparent text-subheadline text-labels-primary outline-none placeholder:text-labels-tertiary"
          />
        </label>
        <div role="group" aria-label="종류" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <SelectChip key={f.value} label={f.label} selected={logic.filter === f.value} onToggle={() => logic.setFilter(f.value)} />
          ))}
        </div>
      </div>

      {logic.listStatus === "error" ? (
        <EmptyState icon={<AlertTriangle />} title="메뉴를 불러오지 못했어요" description="잠시 후 다시 시도해 주세요." primaryAction={{ label: "다시 시도", onClick: logic.retry }} />
      ) : (
        <section aria-label="메뉴 목록" className={cn("overflow-hidden", ADMIN_CARD)}>
          <div className="overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className={cn(COLS, "bg-[rgba(117,117,128,0.06)] py-3 text-footnote font-semibold text-labels-secondary")}>
                {HEADERS.map((h, i) => (
                  <span key={i}>{h}</span>
                ))}
              </div>
              {!list ? (
                <div aria-busy className="flex flex-col gap-2 p-5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-placeholder" />
                  ))}
                </div>
              ) : list.items.length ? (
                <ul className={cn("divide-y-[0.5px] divide-separators-non-opaque border-t-[0.5px] border-separators-non-opaque", logic.listStatus === "loading" && "opacity-60")}>
                  {list.items.map((m) => (
                    <MenuRow key={m.id} menu={m} onEdit={() => logic.edit(m)} />
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-12 text-center text-subheadline text-labels-secondary">
                  {logic.query ? `'${logic.query}'에 맞는 메뉴가 없어요.` : "해당하는 메뉴가 없어요."}
                </p>
              )}
            </div>
          </div>
          {list && <AdminPagination page={list.page} total={list.total} size={ADMIN_MENU_PAGE_SIZE} onChange={logic.setPage} />}
        </section>
      )}
    </div>
  );
}
