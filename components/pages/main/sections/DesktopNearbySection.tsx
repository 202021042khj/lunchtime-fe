import Link from "next/link";
import MapPreview from "@/components/domain/MapPreview";
import RestaurantList from "@/components/domain/RestaurantList";
import { mapRoute } from "@/constants/navigation";
import { LatLng } from "@/types/common";
import { TodayRecommendation } from "@/types/recommendation";
import { Restaurant } from "@/types/restaurant";

interface DesktopNearbySectionProps {
  today: TodayRecommendation;
  center: LatLng;
  onToggleFavorite: (restaurant: Restaurant) => void;
}

// Figma: 01 Home · Nearby Panel (12:279) — 지도 미리보기 + 추천 메뉴 식당 4개 + 더 보기
export default function DesktopNearbySection({ today, center, onToggleFavorite }: DesktopNearbySectionProps) {
  const more = today.nearbyCount - today.restaurants.length;

  return (
    <section className="flex flex-col gap-1 rounded-[28px] border border-white/80 bg-glass-card p-2 shadow-[0_8px_32px_rgba(31,26,89,0.08)] backdrop-blur-[20px]">
      <MapPreview center={center} restaurants={today.restaurants} className="h-[220px] rounded-[20px]" />
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-1">
        <h2 className="truncate text-title-3 font-semibold text-labels-primary">근처 {today.menu.name} 맛집</h2>
        <Link href={mapRoute(today.menu.id)} className="shrink-0 text-subheadline font-semibold text-brand-primary">
          지도 보기
        </Link>
      </div>
      <RestaurantList restaurants={today.restaurants} onToggleFavorite={onToggleFavorite} />
      {more > 0 && (
        <Link
          href={mapRoute(today.menu.id)}
          className="py-2.5 text-center text-subheadline font-semibold text-labels-secondary hover:text-labels-primary"
        >
          식당 {more}곳 더 보기
        </Link>
      )}
    </section>
  );
}
