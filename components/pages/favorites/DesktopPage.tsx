import RestaurantCard from "@/components/domain/RestaurantCard";
import CuisineFilterSection from "@/components/pages/favorites/sections/CuisineFilterSection";
import FavoritesStatusSection from "@/components/pages/favorites/sections/FavoritesStatusSection";
import { UseFavoritesLogicResult } from "@/hooks/useFavoritesLogic";

// Figma: 06 Favorites · Desktop (26:758) — 카드 3열, 태블릿 2열
export default function DesktopPage(logic: UseFavoritesLogicResult) {
  const { status, restaurants } = logic;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 pt-8 pb-24 xl:px-0">
      <h1 className="flex items-end gap-2.5">
        <span className="text-title-1 font-bold text-labels-primary">찜한 식당</span>
        {status === "ready" && <span className="text-title-3 font-semibold text-labels-tertiary">{restaurants.length}곳</span>}
      </h1>
      {status !== "guest" && <CuisineFilterSection logic={logic} />}

      {status === "loading" ? (
        <div aria-busy aria-label="찜한 식당을 불러오는 중" className="grid grid-cols-2 gap-6 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[296px] animate-pulse rounded-3xl bg-surface-placeholder" />
          ))}
        </div>
      ) : status !== "ready" || !restaurants.length ? (
        <FavoritesStatusSection logic={logic} />
      ) : (
        <ul className="grid grid-cols-2 gap-6 lg:grid-cols-3">
          {restaurants.map((r) => (
            <li key={r.placeId}>
              <RestaurantCard restaurant={r} onSelect={logic.openRestaurant} onToggleFavorite={logic.unfavorite} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
