import FoodImage from "@/components/common/FoodImage";
import FavoriteButton from "@/components/domain/FavoriteButton";
import { formatDistance, formatRating, joinMeta } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Restaurant } from "@/types/restaurant";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSelect?: (restaurant: Restaurant) => void;
  onToggleFavorite: (restaurant: Restaurant) => void;
  className?: string;
}

// Figma: Restaurant Card (26:747) — 찜한 식당 그리드. 하트 = 찜 해제
export default function RestaurantCard({ restaurant, onSelect, onToggleFavorite, className }: RestaurantCardProps) {
  const r = restaurant;
  const meta = joinMeta([r.category, r.mainMenu, formatDistance(r.distanceM)]);
  const body = (
    <>
      <FoodImage src={r.imageUrl} alt="" className="h-[190px] w-full rounded-[18px]" />
      <span className="flex flex-col gap-1 px-2">
        {/* 오른쪽 하트 자리를 비워 둔다 */}
        <span className="truncate pr-9 text-headline text-labels-primary">{r.name}</span>
        <span className="truncate text-subheadline text-labels-secondary">{meta}</span>
        <span className="text-footnote text-labels-tertiary">{formatRating(r.rating, r.reviewCount)}</span>
      </span>
    </>
  );

  // 카드를 누르는 버튼과 찜 버튼은 형제로 둔다 (버튼 안에 버튼 없음). 하트는 이름 줄 오른쪽에 겹쳐 놓는다
  return (
    <article
      aria-label={r.name}
      className={cn("relative w-full rounded-3xl border border-glass-border bg-glass-card shadow-glass", className)}
    >
      {onSelect ? (
        <button type="button" onClick={() => onSelect(r)} className="flex w-full flex-col gap-3 rounded-3xl px-2 pt-2 pb-4 text-left">
          {body}
        </button>
      ) : (
        <div className="flex w-full flex-col gap-3 px-2 pt-2 pb-4">{body}</div>
      )}
      <FavoriteButton active={r.isFavorite} onToggle={() => onToggleFavorite(r)} className="absolute top-[204px] right-3" />
    </article>
  );
}
