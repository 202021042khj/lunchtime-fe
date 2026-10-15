import SelectChip from "@/components/common/SelectChip";
import { SEARCH_RADIUS_M, UseSearchLogicResult } from "@/hooks/useSearchLogic";
import { formatRadius } from "@/lib/format";
import { SearchType } from "@/types/recommendation";

// Figma 35:1645 Header — '검색어' 검색 결과 · 동네 반경, 탭(전체 · 메뉴 n · 식당 n)
export default function SearchHeaderSection({ logic }: { logic: UseSearchLogicResult }) {
  const ready = logic.status === "ready";
  const tabs: { type: SearchType; label: string }[] = [
    { type: "all", label: "전체" },
    { type: "menu", label: ready ? `메뉴 ${logic.menus.length}` : "메뉴" },
    { type: "restaurant", label: ready ? `식당 ${logic.restaurants.length}` : "식당" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h1 className="flex flex-wrap items-end gap-x-2 gap-y-1">
        <span className="text-title-1 font-bold break-all text-labels-primary">&apos;{logic.query}&apos; 검색 결과</span>
        {logic.location && (
          <span className="pb-0.5 text-subheadline text-labels-tertiary">
            {logic.location.name} 반경 {formatRadius(SEARCH_RADIUS_M)}
          </span>
        )}
      </h1>
      <div role="group" aria-label="검색 결과 종류" className="flex gap-2">
        {tabs.map((t) => (
          <SelectChip key={t.type} label={t.label} selected={logic.type === t.type} onToggle={() => logic.setType(t.type)} />
        ))}
      </div>
    </div>
  );
}
