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

  const content = (
    <>
      <FoodImage src={r.imageUrl} alt="" compact className="size-[60px] shrink-0 rounded-[14px]" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-headline text-labels-primary">{r.name}</span>
          {r.sponsored && (
            <span className="shrink-0 rounded-md bg-brand-primary-tint px-1.5 py-0.5 text-caption-2 font-semibold text-brand-primary">
              광고
            </span>
          )}
        </span>
        <span className="truncate text-subheadline text-labels-secondary">{meta}</span>
        <span className="truncate text-footnote text-labels-tertiary">
          {formatRating(r.rating, r.reviewCount)}
          {openLabel && <span className={r.openNow ? "text-accents-green" : undefined}> · {openLabel}</span>}
        </span>
        {r.menuEvidence && <MenuEvidenceLine evidence={r.menuEvidence} />}
      </span>
    </>
  );

  // 행 전체를 누르는 버튼과 찜 버튼을 형제로 둔다 (버튼 안에 버튼을 넣지 않아야 스크린리더 · 키보드가 둘 다 찾는다)
  return (
    <div
      className={cn(
        "flex w-full items-center gap-1 rounded-[18px] pr-3",
        onSelect && !selected && "hover:bg-white/60",
        // Figma 03 Map: Restaurant Row · Selected
        selected && "bg-brand-primary-tint",
        className,
      )}
    >
      {onSelect ? (
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => onSelect(r)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] py-3 pl-3 text-left outline-offset-[-2px]"
        >
          {content}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3">{content}</div>
      )}
      {onToggleFavorite && <FavoriteButton active={r.isFavorite} onToggle={() => onToggleFavorite(r)} />}
    </div>
  );
}
