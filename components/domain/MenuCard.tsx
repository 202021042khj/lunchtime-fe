import FoodImage from "@/components/common/FoodImage";
import { formatMatch } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MenuSummary } from "@/types/menu";

interface MenuCardProps {
  menu: MenuSummary;
  matchPercent: number | null;
  popularRank?: number | null;
  onSelect?: (menu: MenuSummary) => void;
  className?: string;
}

// Figma: Menu Card (7:98) — 다른 추천 메뉴 (모바일은 가로 스크롤)
export default function MenuCard({ menu, matchPercent, popularRank = null, onSelect, className }: MenuCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect && (() => onSelect(menu))}
      className={cn(
        "flex w-[148px] shrink-0 flex-col gap-2 rounded-[22px] bg-white px-2 pt-2 pb-3 text-left transition-shadow hover:shadow-glass",
        className,
      )}
    >
      <FoodImage src={menu.imageUrl} alt={menu.name} className="h-[100px] w-full rounded-2xl" />
      <span className="flex w-full flex-col gap-0.5 px-1">
        <span className="truncate text-headline text-labels-primary">{menu.name}</span>
        <span className="text-footnote text-brand-primary">{formatMatch(matchPercent, popularRank)}</span>
      </span>
    </button>
  );
}
