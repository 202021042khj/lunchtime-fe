import FoodImage from "@/components/common/FoodImage";
import FavoriteButton from "@/components/domain/FavoriteButton";
import MenuEvidenceLine from "@/components/domain/MenuEvidenceLine";
import { formatDistance, formatRating, joinMeta } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Restaurant } from "@/types/restaurant";

interface RestaurantRowProps {
  restaurant: Restaurant;
  onSelect?: (restaurant: Restaurant) => void;
  onToggleFavorite?: (restaurant: Restaurant) => void;
  selected?: boolean;
  className?: string;
}

// Figma: Restaurant Row (7:103) — 근처 식당 목록·지도 목록. 광고 식당은 "광고" 배지
export default function RestaurantRow({ restaurant, onSelect, onToggleFavorite, selected = false, className }: RestaurantRowProps) {
  const r = restaurant;
  const meta = joinMeta([r.category, r.mainMenu, `도보 ${r.walkMinutes}분`, formatDistance(r.distanceM)]);
  // 영업 여부는 광고·입점 식당만 (나머지는 openNow가 null)
  const openLabel = r.openNow === null ? null : r.openNow ? "영업 중" : "영업 종료";

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect && (() => onSelect(r))}
      onKeyDown={onSelect && ((e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(r)))}
      className={cn(
        "flex w-full items-center gap-3 rounded-[18px] p-3 text-left",
        onSelect && "cursor-pointer hover:bg-white/60",
        selected && "bg-white/80",
        className,
      )}
    >
      <FoodImage src={r.imageUrl} alt={r.name} compact className="size-[60px] shrink-0 rounded-[14px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-headline text-labels-primary">{r.name}</p>
          {r.sponsored && (
            <span className="shrink-0 rounded-md bg-brand-primary-tint px-1.5 py-0.5 text-caption-2 font-semibold text-brand-primary">
              광고
            </span>
          )}
        </div>
        <p className="truncate text-subheadline text-labels-secondary">{meta}</p>
        <p className="truncate text-footnote text-labels-tertiary">
          {formatRating(r.rating, r.reviewCount)}
          {openLabel && <span className={r.openNow ? "text-accents-green" : undefined}> · {openLabel}</span>}
        </p>
        {r.menuEvidence && <MenuEvidenceLine evidence={r.menuEvidence} />}
      </div>
      {onToggleFavorite && <FavoriteButton active={r.isFavorite} onToggle={() => onToggleFavorite(r)} />}
    </div>
  );
}
