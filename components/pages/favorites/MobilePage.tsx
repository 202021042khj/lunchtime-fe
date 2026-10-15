import RestaurantList from "@/components/domain/RestaurantList";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import CuisineFilterSection from "@/components/pages/favorites/sections/CuisineFilterSection";
import FavoritesStatusSection from "@/components/pages/favorites/sections/FavoritesStatusSection";
import { UseFavoritesLogicResult } from "@/hooks/useFavoritesLogic";

// 모바일 찜: 카드 대신 식당 행 목록 (반응형 규칙 "1열 또는 식당 행 목록")
export default function MobilePage(logic: UseFavoritesLogicResult) {
  const { status, restaurants } = logic;

  return (
    <main className="flex w-full flex-col gap-4 pb-[calc(env(safe-area-inset-bottom)+110px)]">
      <MobilePageHeader title="찜한 식당" count={status === "ready" ? `${restaurants.length}곳` : undefined} />
      {status !== "guest" && (
        <div className="px-4">
          <CuisineFilterSection logic={logic} />
        </div>
      )}

      {status === "loading" ? (
        <div aria-busy aria-label="찜한 식당을 불러오는 중" className="mx-4 h-[340px] animate-pulse rounded-[22px] bg-surface-placeholder" />
      ) : status !== "ready" || !restaurants.length ? (
        <FavoritesStatusSection logic={logic} />
      ) : (
        <div className="mx-4 rounded-[22px] bg-white py-1">
          <RestaurantList
            restaurants={restaurants}
            onSelect={logic.openRestaurant}
            onToggleFavorite={logic.unfavorite}
          />
        </div>
      )}
    </main>
  );
}
