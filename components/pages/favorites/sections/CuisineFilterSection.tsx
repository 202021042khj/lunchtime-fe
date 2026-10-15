import { ChevronDown } from "lucide-react";
import SelectChip from "@/components/common/SelectChip";
import { FAVORITE_CUISINES } from "@/constants/user";
import { UseFavoritesLogicResult } from "@/hooks/useFavoritesLogic";

// 종류 필터 + 정렬 (Figma 06 Favorites Toolbar). 모바일은 칩 1줄 가로 스크롤
export default function CuisineFilterSection({ logic }: { logic: UseFavoritesLogicResult }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:overflow-visible md:pb-0">
        {FAVORITE_CUISINES.map((c) => (
          <SelectChip key={c} label={c} selected={logic.cuisine === c} onToggle={() => logic.setCuisine(c)} className="shrink-0" />
        ))}
      </div>
      {/* 정렬은 지금 "최근 찜한 순" 하나뿐이라 표시만 한다. 모바일은 칩 자리를 위해 숨긴다 */}
      <span className="hidden shrink-0 items-center gap-1 text-subheadline font-semibold text-labels-primary md:flex">
        최근 찜한 순
        <ChevronDown aria-hidden className="size-3.5 text-labels-secondary" />
      </span>
    </div>
  );
}
