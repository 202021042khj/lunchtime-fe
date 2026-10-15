import MenuResultsSection from "@/components/pages/search/sections/MenuResultsSection";
import RestaurantResultsSection from "@/components/pages/search/sections/RestaurantResultsSection";
import SearchStatusSection from "@/components/pages/search/sections/SearchStatusSection";
import { UseSearchLogicResult } from "@/hooks/useSearchLogic";

// 탭에 맞춰 메뉴 · 식당 결과를 보여 준다. 결과가 하나도 없으면 빈 상태
export default function SearchResultsSection({ logic, mobile = false }: { logic: UseSearchLogicResult; mobile?: boolean }) {
  const hasAny = logic.menus.length > 0 || logic.restaurants.length > 0;
  if (logic.status !== "ready" || !hasAny) {
    return <SearchStatusSection logic={logic} className={mobile ? "py-12" : "py-20"} />;
  }
  return (
    <div className="flex flex-col gap-7">
      {logic.type !== "restaurant" && <MenuResultsSection logic={logic} scroll={mobile} />}
      {logic.type !== "menu" && <RestaurantResultsSection logic={logic} />}
    </div>
  );
}
