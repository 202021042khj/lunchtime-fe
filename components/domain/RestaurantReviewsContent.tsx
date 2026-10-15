"use client";

import { ChevronLeft, MessageSquare, SquarePen, X } from "lucide-react";
import { Fragment } from "react";
import EmptyState from "@/components/common/EmptyState";
import SelectChip from "@/components/common/SelectChip";
import ReviewItem from "@/components/domain/ReviewItem";
import StarRating from "@/components/domain/StarRating";
import { REVIEW_SORTS } from "@/constants/review";
import { useRestaurantReviews } from "@/hooks/useRestaurantReviews";
import { RatingSummary, Restaurant } from "@/types/restaurant";
import { Review } from "@/types/review";

interface RestaurantReviewsContentProps {
  restaurant: Restaurant;
  ratingSummary: RatingSummary | null;
  version: number;
  onBack: () => void;
  onClose: () => void;
  onWriteReview: () => void;
  onShareReview: (review: Review) => void;
  onReportReview: (review: Review) => void;
}

// Figma: 11 All Reviews (36:1523) — 상세 패널 자리에 열린다. 평균 별점, 별점별 막대, 정렬, 리뷰 목록
export default function RestaurantReviewsContent({
  restaurant: r,
  ratingSummary,
  version,
  onBack,
  onClose,
  onWriteReview,
  onShareReview,
  onReportReview,
}: RestaurantReviewsContentProps) {
  const { sort, setSort, reviews, status, hasMore, loadingMore, loadMore } = useRestaurantReviews(r.placeId, version);
  const total = ratingSummary ? Object.values(ratingSummary).reduce((a, b) => a + b, 0) : r.reviewCount;
  const max = ratingSummary ? Math.max(1, ...Object.values(ratingSummary)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="상세로 돌아가기" onClick={onBack} className="-ml-1 flex size-8 items-center justify-center text-labels-primary">
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-title-3 font-semibold text-labels-primary">{r.name} 리뷰</h2>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="-mr-1 flex size-8 items-center justify-center rounded-full text-labels-secondary hover:bg-fills-quaternary"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      {r.rating !== null && (
        <div className="flex items-center gap-5 rounded-[18px] bg-white/70 px-4 py-3.5">
          <div className="flex shrink-0 flex-col items-center gap-0.5">
            <span className="text-[34px] leading-[40px] font-bold text-labels-primary">{r.rating.toFixed(1)}</span>
            <StarRating rating={r.rating} starClassName="size-3" />
            <span className="text-footnote text-labels-secondary">리뷰 {total.toLocaleString("ko-KR")}개</span>
          </div>
          {ratingSummary && (
            <ul className="flex min-w-0 flex-1 flex-col gap-1" aria-label="별점별 리뷰 수">
              {([5, 4, 3, 2, 1] as const).map((score) => (
                <li key={score} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-footnote text-labels-secondary">{score}점</span>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-[3px] bg-surface-placeholder">
                    <span className="block h-full rounded-[3px] bg-brand-primary" style={{ width: `${(ratingSummary[score] / max) * 100}%` }} />
                  </span>
                  <span className="w-7 shrink-0 text-right text-footnote text-labels-tertiary">{ratingSummary[score]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="정렬">
        {REVIEW_SORTS.map((option) => (
          <SelectChip
            key={option.value}
            label={option.label}
            selected={sort === option.value}
            onToggle={() => setSort(option.value)}
            className="px-3 py-1.5"
          />
        ))}
      </div>

      {status === "loading" ? (
        <div aria-busy className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-placeholder" />
          ))}
        </div>
      ) : !reviews.length ? (
        <EmptyState
          className="py-8"
          icon={<MessageSquare />}
          title={sort === "photo" ? "사진 리뷰가 아직 없어요" : "아직 리뷰가 없어요"}
          description="첫 리뷰를 남겨 주세요."
          primaryAction={{ label: "리뷰 쓰기", onClick: onWriteReview }}
        />
      ) : (
        <>
          <ul className="flex flex-col">
            {reviews.map((review, i) => (
              <Fragment key={review.id}>
                {i > 0 && <li aria-hidden className="my-3 h-[0.5px] bg-separators-non-opaque" />}
                <li>
                  <ReviewItem review={review} variant="full" onShare={onShareReview} onReport={onReportReview} />
                </li>
              </Fragment>
            ))}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-xl bg-white/70 py-2 text-subheadline font-semibold text-labels-secondary hover:text-labels-primary disabled:opacity-60"
            >
              {loadingMore ? "불러오는 중…" : "리뷰 더 보기"}
            </button>
          )}
          <button type="button" onClick={onWriteReview} className="flex items-center justify-center gap-1 py-1 text-subheadline font-semibold text-brand-primary">
            <SquarePen aria-hidden className="size-4" />
            리뷰 쓰기
          </button>
        </>
      )}
    </div>
  );
}
