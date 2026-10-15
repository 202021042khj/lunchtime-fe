import RestaurantList from "@/components/domain/RestaurantList";
import { SEARCH_PREVIEW_COUNT, UseSearchLogicResult } from "@/hooks/useSearchLogic";

// Figma 35:1680 Restaurants — 식당 행(근거 포함). 전체 탭은 4곳만 먼저, "식당 n곳 더 보기"
export default function RestaurantResultsSection({ logic }: { logic: UseSearchLogicResult }) {
  const all = logic.restaurants;
  if (!all.length) {
    return logic.type === "restaurant" ? <p className="py-6 text-subheadline text-labels-secondary">맞는 식당이 없어요.</p> : null;
  }
  const shown = logic.showAllRestaurants ? all : all.slice(0, SEARCH_PREVIEW_COUNT);
  const hidden = all.length - shown.length;

  return (
    <section aria-label="식당" className="flex flex-col gap-3">
      <div className="flex items-center">
        <h2 className="text-title-3 font-semibold text-labels-primary">식당</h2>
        <span className="flex-1" />
        {/* 정렬은 지금 거리순 하나뿐이라 표시만 한다 */}
        <span className="text-subheadline font-semibold text-brand-primary">거리순</span>
      </div>
      <div className="rounded-3xl border border-white/85 bg-white/72 px-2 py-1.5 shadow-[0_8px_32px_rgba(64,38,20,0.08)]">
        <RestaurantList restaurants={shown} onSelect={logic.openRestaurant} onToggleFavorite={logic.toggleFavorite} />
        {hidden > 0 && (
          <button
            type="button"
            onClick={logic.expandRestaurants}
            className="w-full py-3 text-center text-subheadline font-semibold text-labels-secondary hover:text-labels-primary"
          >
            식당 {hidden}곳 더 보기
          </button>
        )}
      </div>
    </section>
  );
}
