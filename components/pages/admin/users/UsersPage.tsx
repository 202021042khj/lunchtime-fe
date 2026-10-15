import { Search } from "lucide-react";
import SelectChip from "@/components/common/SelectChip";
import { AdminPageHeader, AdminStatCard, AdminStatSkeleton } from "@/components/domain/admin/AdminWidgets";
import UsersTableSection from "@/components/pages/admin/users/sections/UsersTableSection";
import Button from "@/components/ui/button";
import { UseAdminUsersLogicResult } from "@/hooks/useAdminUsersLogic";
import { UserStatus } from "@/types/admin";

const FILTERS: { value: UserStatus | null; label: string }[] = [
  { value: null, label: "전체" },
  { value: "active", label: "정상" },
  { value: "suspended", label: "정지" },
  { value: "withdrawn", label: "탈퇴" },
];

const n = (v: number) => v.toLocaleString("ko-KR");

// Figma: A1 Admin · 유저 관리 (27:834). 어드민은 데스크톱 전용이라 화면 하나 (좁으면 표가 가로 스크롤)
export default function UsersPage(logic: UseAdminUsersLogicResult) {
  const s = logic.summary;
  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        title="유저 관리"
        description="가입한 유저를 조회하고 이용을 정지하거나 해제해요."
        actions={
          <Button type="button" variant="outlined" color="brand" shape="round" size="md" isLoading={logic.exporting} onClick={logic.exportCsv} className="font-semibold">
            CSV 내보내기
          </Button>
        }
      />

      <div className="flex flex-wrap gap-4">
        {s ? (
          <>
            <AdminStatCard label="전체 유저" value={n(s.total)} />
            <AdminStatCard
              label="이번 주 신규"
              value={n(s.newThisWeek)}
              sub={
                s.newWeekChangePercent !== null && (
                  <p className={s.newWeekChangePercent >= 0 ? "text-footnote font-semibold text-accents-green" : "text-footnote font-semibold text-accents-red"}>
                    지난주 대비 {s.newWeekChangePercent >= 0 ? "+" : ""}
                    {s.newWeekChangePercent}%
                  </p>
                )
              }
            />
            <AdminStatCard label="오늘 활성" value={n(s.activeToday)} />
            <AdminStatCard label="이용 정지" value={n(s.suspended)} />
          </>
        ) : (
          [0, 1, 2, 3].map((i) => <AdminStatSkeleton key={i} />)
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-10 w-[320px] items-center gap-2 rounded-full border border-separators-non-opaque bg-white/80 px-3.5">
          <Search aria-hidden className="size-4 shrink-0 text-labels-secondary" />
          <input
            value={logic.search}
            onChange={(e) => logic.setSearch(e.target.value)}
            placeholder="이름, 이메일로 검색"
            aria-label="이름, 이메일로 검색"
            className="min-w-0 flex-1 bg-transparent text-subheadline text-labels-primary outline-none placeholder:text-labels-tertiary"
          />
        </label>
        <div role="group" aria-label="상태" className="flex gap-2">
          {FILTERS.map((f) => (
            <SelectChip key={f.label} label={f.label} selected={logic.status === f.value} onToggle={() => logic.setStatus(f.value)} />
          ))}
        </div>
      </div>

      <UsersTableSection logic={logic} />
    </div>
  );
}
