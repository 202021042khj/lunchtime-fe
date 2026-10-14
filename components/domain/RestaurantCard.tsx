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
  return (
    <article
      onClick={onSelect && (() => onSelect(r))}
      className={cn(
        "flex w-full flex-col gap-3 rounded-3xl border border-glass-border bg-glass-card px-2 pt-2 pb-4 shadow-glass",
        onSelect && "cursor-pointer",
        className,
      )}
    >
      <FoodImage src={r.imageUrl} alt={r.name} className="h-[190px] w-full rounded-[18px]" />
      <div className="flex flex-col gap-1 px-2">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-headline text-labels-primary">{r.name}</h3>
          <FavoriteButton active={r.isFavorite} onToggle={() => onToggleFavorite(r)} className="-my-1.5 -mr-1.5" />
        </div>
        <p className="truncate text-subheadline text-labels-secondary">
          {joinMeta([r.category, r.mainMenu, formatDistance(r.distanceM)])}
        </p>
        <p className="text-footnote text-labels-tertiary">{formatRating(r.rating, r.reviewCount)}</p>
      </div>
    </article>
  );
}
