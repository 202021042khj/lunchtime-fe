import { SquarePen } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import FoodImage from "@/components/common/FoodImage";
import StarRating from "@/components/domain/StarRating";
import { formatMonthDay, joinMeta } from "@/lib/format";
import { UseMyLogicResult } from "@/hooks/useMyLogic";

const CARD = "rounded-[28px] border border-glass-border bg-glass-card shadow-[0_8px_32px_rgba(64,38,20,0.08)]";

// Figma: 07 MY Review Card (26:978) · 빈 상태 12 MY · 리뷰 없음 (37:2284)
export default function MyReviewsSection({ logic }: { logic: UseMyLogicResult }) {
  const { reviews } = logic;
  const count = logic.user?.stats.reviewCount ?? reviews.length;

  return (
    <section id="my-reviews" aria-label="내 리뷰" className="flex scroll-mt-6 flex-col gap-4">
      <h2 className="flex items-end gap-2">
        <span className="text-title-2 font-bold text-labels-primary">내 리뷰</span>
        <span className="text-title-3 font-semibold text-labels-tertiary">{count}개</span>
      </h2>

      {!reviews.length ? (
        <div className={CARD}>
          <EmptyState
            className="max-w-[480px] py-10"
            icon={<SquarePen />}
            title="아직 쓴 리뷰가 없어요"
            description="다녀온 식당에 리뷰를 남기면 별점에 반영되고, 다른 사람의 점심 고민을 덜어줘요."
            primaryAction={{ label: "찜한 식당에서 리뷰 쓰기", onClick: logic.goToFavorites }}
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((review) => (
            <li key={review.id} className={`flex flex-col gap-2.5 p-5 md:p-6 ${CARD}`}>
              <div className="flex items-center gap-3">
                <FoodImage src={review.photos[0]?.url || null} alt={review.placeName} compact className="size-[52px] shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => logic.openPlace(review)}
                    className="truncate text-left text-headline text-labels-primary hover:underline"
                  >
                    {review.placeName}
                  </button>
                  <span className="flex items-center gap-1.5">
                    <StarRating rating={review.rating} starClassName="size-3" hideEmpty />
                    <span className="truncate text-footnote text-labels-tertiary">
                      {joinMeta([review.menus.join(", "), formatMonthDay(review.createdAt)])}
                    </span>
                  </span>
                </div>
                <span className="flex-1" />
                <div className="flex shrink-0 gap-3 text-subheadline font-semibold">
                  <button type="button" onClick={() => logic.editReview(review)} className="text-labels-secondary hover:text-labels-primary">
                    수정
                  </button>
                  <button type="button" onClick={() => logic.removeReview(review)} className="text-accents-red">
                    삭제
                  </button>
                </div>
              </div>
              {review.content && <p className="text-body text-labels-primary">{review.content}</p>}
              {review.tags.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {review.tags.map((tag) => (
                    <li key={tag} className="rounded-full bg-brand-primary-tint px-2.5 py-1 text-footnote font-semibold text-brand-primary">
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      {logic.hasMoreReviews && (
        <button
          type="button"
          onClick={logic.loadMoreReviews}
          className="rounded-xl bg-white/70 py-2.5 text-subheadline font-semibold text-labels-secondary hover:text-labels-primary"
        >
          리뷰 더 보기
        </button>
      )}
    </section>
  );
}
