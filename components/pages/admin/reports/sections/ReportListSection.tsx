import { ADMIN_CARD, AdminStatusBadge } from "@/components/domain/admin/AdminWidgets";
import { REPORT_REASONS } from "@/constants/review";
import { UseAdminReportsLogicResult } from "@/hooks/useAdminReportsLogic";
import { formatMonthDayTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReportGroup } from "@/types/admin";
import { ReportReason } from "@/types/review";

// 사유 배지 색 (Figma A4: 욕설·비방 빨강, 광고·홍보 브랜드, 나머지 회색)
export const REASON_TONES: Record<ReportReason, string> = {
  abuse: "bg-[rgba(255,56,60,0.12)] text-accents-red",
  ad: "bg-brand-primary-tint text-brand-primary",
  false_info: "bg-[rgba(60,60,67,0.1)] text-labels-secondary",
  irrelevant: "bg-[rgba(60,60,67,0.1)] text-labels-secondary",
};

// 가장 많이 받은 사유
export function topReason(r: ReportGroup): ReportReason {
  return (Object.entries(r.reasonCounts) as [ReportReason, number][]).sort((a, b) => b[1] - a[1])[0][0];
}

export const reasonLabel = (reason: ReportReason) => REPORT_REASONS.find((x) => x.value === reason)?.label ?? reason;

// Figma A4 왼쪽 목록: 사유 배지 · 식당 · 신고 수 · 접수 시각 / 리뷰 한 줄
export default function ReportListSection({ logic }: { logic: UseAdminReportsLogicResult }) {
  const items = logic.list?.items ?? [];
  if (logic.listStatus === "loading" && !logic.list) {
    return <div aria-busy className={cn("h-[300px] flex-1 animate-pulse", ADMIN_CARD, "bg-surface-placeholder")} />;
  }
  if (!items.length) {
    return (
      <div className={cn("flex-1 px-5 py-16 text-center text-subheadline text-labels-secondary", ADMIN_CARD)}>
        {logic.tab === "pending" ? "처리할 신고가 없어요." : "신고가 없어요."}
      </div>
    );
  }
  return (
    <ul aria-label="신고 목록" className={cn("min-w-0 flex-1 divide-y-[0.5px] divide-separators-non-opaque overflow-hidden", ADMIN_CARD)}>
      {items.map((r) => {
        const reason = topReason(r);
        const active = logic.selected?.review.id === r.review.id;
        return (
          <li key={r.review.id}>
            <button
              type="button"
              aria-current={active ? "true" : undefined}
              onClick={() => logic.select(r)}
              className={cn("flex w-full flex-col gap-1 px-4 py-3 text-left", active ? "bg-brand-primary-tint" : "hover:bg-white/70")}
            >
              <span className="flex w-full items-center gap-2">
                <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-caption-1 font-semibold", REASON_TONES[reason])}>{reasonLabel(reason)}</span>
                <span className="min-w-0 truncate text-subheadline font-semibold text-labels-primary">{r.review.placeName}</span>
                {r.status === "resolved" && (
                  <AdminStatusBadge label={r.resolution === "deleted" ? "삭제됨" : "기각"} tone={r.resolution === "deleted" ? "red" : "gray"} />
                )}
                <span className="flex-1" />
                <span className="shrink-0 text-footnote text-labels-tertiary">
                  신고 {r.reportCount}건 · {formatMonthDayTime(r.lastReportedAt)}
                </span>
              </span>
              <span className="truncate text-subheadline text-labels-secondary">{r.review.content ?? `별점 ${r.review.rating}점 리뷰`}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
