"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { overlay } from "overlay-kit";
import { FormEvent, useState } from "react";
import Button from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { openLoginRequired } from "@/components/domain/LoginRequiredModal";
import { notify } from "@/components/ui/notify/notify-utils";
import { REPORT_REASONS, REVIEW_LIMITS } from "@/constants/review";
import { ApiError } from "@/lib/api/client";
import { reportReview } from "@/lib/api/reviews";
import { formatMonthDay, suspendedNotice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReportReason, Review } from "@/types/review";

interface ReportReviewModalProps {
  isOpen: boolean;
  review: Review;
  onClose: () => void;
}

// 리뷰 ⋯ 메뉴의 [신고하기]에서 연다
export function openReportReview(review: Review) {
  overlay.open(({ isOpen, close, unmount }) => (
    <ReportReviewModal
      isOpen={isOpen}
      review={review}
      onClose={() => {
        close();
        window.setTimeout(unmount, 200);
      }}
    />
  ));
}

const ERROR_MESSAGES: Partial<Record<string, string>> = {
  ALREADY_REPORTED: "이미 신고한 리뷰예요.",
  FORBIDDEN: "내 리뷰는 신고할 수 없어요.",
};

// Figma: 11 Report Review (36:1877) — 사유 1개 선택 + 메모(선택, 200자)
export default function ReportReviewModal({ isOpen, review, onClose }: ReportReviewModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    try {
      await reportReview(review.id, { reason, memo: memo.trim() || null });
      notify.success("신고를 접수했어요.");
      onClose();
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "";
      if (code === "UNAUTHORIZED") return openLoginRequired("report");
      if (error instanceof ApiError && code === "USER_SUSPENDED") return notify.error(suspendedNotice(error.message, error.until, "신고할"));
      notify.error(ERROR_MESSAGES[code] ?? "신고하지 못했어요. 잠시 후 다시 시도해 주세요.");
      if (code === "ALREADY_REPORTED" || code === "FORBIDDEN") onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(31,20,13,0.4)]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-dialog flex flex-col bg-white outline-none",
            "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-[28px] pb-[env(safe-area-inset-bottom)]",
            "md:inset-auto md:top-1/2 md:left-1/2 md:w-[480px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px] md:bg-white/96 md:pb-0 md:shadow-[0_24px_64px_rgba(51,26,13,0.25)] md:backdrop-blur-[20px]",
          )}
        >
          <form onSubmit={submit} className="flex min-h-0 flex-col gap-[18px] overflow-y-auto px-7 py-6">
            <div className="flex items-center">
              <DialogPrimitive.Title className="text-title-2 font-bold text-labels-primary">리뷰 신고</DialogPrimitive.Title>
              <span className="flex-1" />
              <DialogPrimitive.Close aria-label="닫기" className="text-labels-secondary hover:text-labels-primary">
                <X aria-hidden className="size-5" />
              </DialogPrimitive.Close>
            </div>

            <div className="flex flex-col gap-1 rounded-[14px] bg-[rgba(117,117,128,0.07)] px-3.5 py-3">
              <p className="text-footnote font-semibold text-labels-secondary">
                {review.author.name} · {formatMonthDay(review.createdAt)}
              </p>
              <p className="line-clamp-2 text-subheadline text-labels-primary">{review.content ?? `별점 ${review.rating}점 리뷰`}</p>
            </div>

            <fieldset className="flex flex-col">
              <legend className="text-subheadline font-semibold text-labels-primary">신고 사유</legend>
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-center gap-3 py-[11px]">
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="peer sr-only"
                  />
                  {/* 라디오: 선택하면 브랜드 색 테두리 + 가운데 점 */}
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary/40",
                      reason === r.value ? "border-brand-primary" : "border-[rgba(60,60,67,0.3)]",
                    )}
                  >
                    {reason === r.value && <span className="size-2.5 rounded-full bg-brand-primary" />}
                  </span>
                  <span className="text-body text-labels-primary">{r.label}</span>
                </label>
              ))}
            </fieldset>

            <div className="flex h-[88px] flex-col rounded-[14px] border border-separators-non-opaque bg-white px-3.5 py-3 focus-within:border-brand-primary">
              <textarea
                value={memo}
                maxLength={REVIEW_LIMITS.reportMemo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="자세한 내용 (선택)"
                aria-label="자세한 내용"
                className="min-h-0 flex-1 resize-none bg-transparent text-subheadline outline-none placeholder:text-labels-tertiary"
              />
              <p className="text-right text-footnote text-labels-tertiary">
                {memo.length} / {REVIEW_LIMITS.reportMemo}
              </p>
            </div>

            <p className="text-footnote text-labels-secondary">운영자가 확인한 뒤 처리해요. 처리 결과는 따로 알려드리지 않아요.</p>

            <div className="flex gap-2.5">
              <Button type="button" variant="outlined" color="brand" shape="round" className="flex-1 px-5 text-[17px] font-medium" onClick={onClose}>
                취소
              </Button>
              <Button
                type="submit"
                color="red"
                shape="round"
                disabled={!reason}
                isLoading={submitting}
                // 사유를 고르기 전에는 비활성(회색), 고르면 빨간 버튼 (Figma: Destructive Prominent)
                className={cn("flex-1 px-5 text-[17px] font-medium", reason && "bg-accents-red")}
              >
                신고하기
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
