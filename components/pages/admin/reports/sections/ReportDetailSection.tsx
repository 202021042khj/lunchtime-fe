import { MessageCircle, TriangleAlert } from "lucide-react";
import StarRating from "@/components/domain/StarRating";
import { ADMIN_CARD } from "@/components/domain/admin/AdminWidgets";
import { reasonLabel, REASON_TONES, topReason } from "@/components/pages/admin/reports/sections/ReportListSection";
import Button from "@/components/ui/button";
import { SUSPEND_WITH_REPORT_DAYS, UseAdminReportsLogicResult } from "@/hooks/useAdminReportsLogic";
import { formatMonthDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReportReason } from "@/types/review";

// Figma A4 오른쪽 "신고 상세": 사유별 건수 · 리뷰 원문 · 신고자 메모 · 작성자 이력 · 처리 버튼
export default function ReportDetailSection({ logic }: { logic: UseAdminReportsLogicResult }) {
  const r = logic.selected;
  if (!r) return null;
  const reasons = (Object.entries(r.reasonCounts) as [ReportReason, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${reason === "irrelevant" ? "관련 없음" : reasonLabel(reason)} ${count}`)
    .join(" · ");
  const h = r.authorHistory;

  return (
    <section aria-label="신고 상세" className={cn("flex w-full shrink-0 flex-col gap-4 p-6 lg:sticky lg:top-8 lg:w-[400px]", ADMIN_CARD)}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-title-3 font-semibold text-labels-primary">신고 상세</h2>
        <span className={cn("rounded-md px-1.5 py-0.5 text-footnote font-semibold", REASON_TONES[topReason(r)])}>{reasons}</span>
      </div>

      <div className="flex flex-col gap-1.5 rounded-2xl bg-[rgba(117,117,128,0.07)] px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-footnote font-semibold text-labels-primary">{r.review.author.name}</span>
          <StarRating rating={r.review.rating} starClassName="size-3" />
          <span className="flex-1" />
          <span className="text-footnote text-labels-tertiary">
            {r.review.placeName} · {formatMonthDay(r.review.createdAt)}
          </span>
        </div>
        <p className="text-body break-keep text-labels-primary">{r.review.content ?? "(후기 없이 별점만 남긴 리뷰)"}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-subheadline font-semibold text-labels-primary">신고자 메모</h3>
        {r.memos.length ? (
          <ul className="flex flex-col gap-1">
            {r.memos.map((m, i) => (
              <li key={i} className="flex gap-1.5 text-footnote text-labels-secondary">
                <MessageCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-footnote text-labels-tertiary">메모 없이 신고했어요.</p>
        )}
      </div>

      <p className="flex items-center gap-2 rounded-xl bg-[rgba(255,56,60,0.08)] px-3 py-2.5 text-footnote text-labels-secondary">
        <TriangleAlert aria-hidden className="size-4 shrink-0 text-accents-red" />
        이 작성자: 리뷰 {h.reviewCount}개 · 받은 신고 {h.reportCount}건 · 삭제된 리뷰 {h.deletedCount}개
      </p>

      {r.status === "resolved" ? (
        <p className="rounded-xl bg-fills-quaternary px-3 py-2.5 text-center text-subheadline font-semibold text-labels-secondary">
          처리 완료 · {r.resolution === "deleted" ? "리뷰를 삭제했어요" : "신고를 기각했어요 (리뷰 유지)"}
        </p>
      ) : (
        <>
          <label className="flex cursor-pointer items-center gap-2 text-subheadline text-labels-primary">
            <input
              type="checkbox"
              checked={logic.suspendAuthor}
              onChange={(e) => logic.setSuspendAuthor(e.target.checked)}
              className="size-[18px] accent-brand-primary"
            />
            작성자 {SUSPEND_WITH_REPORT_DAYS}일 이용 정지도 함께 처리
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outlined"
              color="brand"
              shape="round"
              disabled={logic.resolving}
              onClick={logic.dismiss}
              className="h-[50px] flex-1 px-3 text-[15px] font-semibold"
            >
              신고 기각 (리뷰 유지)
            </Button>
            <Button
              type="button"
              color="red"
              shape="round"
              isLoading={logic.resolving}
              onClick={logic.remove}
              className="h-[50px] flex-1 px-3 text-[15px] font-semibold"
            >
              리뷰 삭제
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
