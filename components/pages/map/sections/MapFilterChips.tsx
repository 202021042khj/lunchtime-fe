import SelectChip from "@/components/common/SelectChip";
import { MapFilters } from "@/hooks/useMapLogic";
import { cn } from "@/lib/utils";
import { SearchedMenu } from "@/types/restaurant";

interface MapFilterChipsProps {
  menu: SearchedMenu | null;
  filters: MapFilters;
  onToggleMenu: () => void;
  onToggleWithin1km: () => void;
  onToggleMinRating: () => void;
  onToggleReviewSort: () => void;
  // 모바일: 필터 칩은 1줄 가로 스크롤 (반응형 규칙)
  scroll?: boolean;
}

// Figma 03 Map Filters: 메뉴 · 1km 이내 · 별점 4.0+ · 리뷰 많은 순
export default function MapFilterChips({
  menu,
  filters,
  onToggleMenu,
  onToggleWithin1km,
  onToggleMinRating,
  onToggleReviewSort,
  scroll = false,
}: MapFilterChipsProps) {
  // 지도 위에 뜨는 칩은 지도가 비치지 않게 불투명 배경 (선택: 흰 바탕 위 브랜드 틴트 22%)
  const chipClass = (selected: boolean) =>
    scroll ? cn("shrink-0 shadow-[0_2px_8px_rgba(31,26,89,0.08)]", selected ? "bg-[#fcebe1]" : "bg-white") : undefined;
  return (
    <div className={cn("flex gap-2", scroll ? "overflow-x-auto px-4 pb-1 [scrollbar-width:none]" : "flex-wrap")}>
      {menu && <SelectChip label={menu.keyword} selected={filters.menuOn} onToggle={onToggleMenu} className={chipClass(filters.menuOn)} />}
      <SelectChip label="1km 이내" selected={filters.within1km} onToggle={onToggleWithin1km} className={chipClass(filters.within1km)} />
      <SelectChip label="별점 4.0+" selected={filters.minRating4} onToggle={onToggleMinRating} className={chipClass(filters.minRating4)} />
      <SelectChip label="리뷰 많은 순" selected={filters.sort === "reviews"} onToggle={onToggleReviewSort} className={chipClass(filters.sort === "reviews")} />
    </div>
  );
}
