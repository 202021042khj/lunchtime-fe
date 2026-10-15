import { AlertTriangle } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import SelectChip from "@/components/common/SelectChip";
import { AdminPageHeader, AdminStatCard, AdminStatSkeleton } from "@/components/domain/admin/AdminWidgets";
import ReportDetailSection from "@/components/pages/admin/reports/sections/ReportDetailSection";
import ReportListSection from "@/components/pages/admin/reports/sections/ReportListSection";
import { ReportTab, UseAdminReportsLogicResult } from "@/hooks/useAdminReportsLogic";

// Figma: A4 Admin · 리뷰 신고 (30:920) — 요약 4개 · 탭 · 왼쪽 신고 목록 / 오른쪽 400px 상세
export default function ReportsPage(logic: UseAdminReportsLogicResult) {
  const s = logic.summary;
  const tabs: { value: ReportTab; label: string }[] = [
    { value: "pending", label: s ? `처리 대기 ${s.pending}` : "처리 대기" },
    { value: "resolved", label: "처리 완료" },
    { value: "all", label: "전체" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title="리뷰 신고" description="신고된 리뷰를 확인하고 유지하거나 삭제해요. 반복 신고된 작성자는 이용을 정지할 수 있어요." />

      <div className="flex flex-wrap gap-4">
        {s ? (
          <>
            <AdminStatCard label="처리 대기" value={`${s.pending}건`} tone={s.pending ? "alert" : "default"} />
            <AdminStatCard label="오늘 접수" value={`${s.today}건`} />
            <AdminStatCard label="이번 달 처리" value={`${s.resolvedThisMonth}건`} />
            <AdminStatCard label="삭제 비율" value={`${s.deleteRatePercent}%`} />
          </>
        ) : (
          [0, 1, 2, 3].map((i) => <AdminStatSkeleton key={i} />)
        )}
      </div>

      <div role="group" aria-label="처리 상태" className="flex gap-2">
        {tabs.map((t) => (
          <SelectChip key={t.value} label={t.label} selected={logic.tab === t.value} onToggle={() => logic.setTab(t.value)} />
        ))}
      </div>

      {logic.listStatus === "error" ? (
        <EmptyState
          icon={<AlertTriangle />}
          title="신고 목록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          primaryAction={{ label: "다시 시도", onClick: logic.retry }}
        />
      ) : (
        <div className="flex flex-col items-start gap-6 lg:flex-row">
          <ReportListSection logic={logic} />
          <ReportDetailSection logic={logic} />
        </div>
      )}
    </div>
  );
}
