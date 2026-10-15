import MenuCard from "@/components/domain/MenuCard";
import { UseSearchLogicResult } from "@/hooks/useSearchLogic";
import { cn } from "@/lib/utils";

// Figma 35:1659 Menus — 메뉴 카드(매칭 %). 누르면 그 메뉴로 지도. 모바일은 가로 스크롤
export default function MenuResultsSection({ logic, scroll = false }: { logic: UseSearchLogicResult; scroll?: boolean }) {
  if (!logic.menus.length) {
    return logic.type === "menu" ? <p className="py-6 text-subheadline text-labels-secondary">맞는 메뉴가 없어요.</p> : null;
  }
  return (
    <section aria-label="메뉴" className="flex flex-col gap-3">
      <h2 className="text-title-3 font-semibold text-labels-primary">메뉴</h2>
      <div className={cn("flex gap-4", scroll ? "-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none]" : "flex-wrap")}>
        {logic.menus.map((item) => (
          <MenuCard
            key={item.menu.id}
            menu={item.menu}
            matchPercent={item.matchPercent}
            onSelect={logic.openMenu}
            className={cn(
              "border border-white/85 bg-white/72 shadow-[0_8px_16px_rgba(64,38,20,0.08)]",
              scroll ? "w-[160px]" : "w-[200px]",
            )}
          />
        ))}
      </div>
    </section>
  );
}
