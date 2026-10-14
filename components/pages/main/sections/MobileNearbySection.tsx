import Link from "next/link";
import RestaurantList from "@/components/domain/RestaurantList";
import { mapRoute } from "@/constants/navigation";
import { TodayRecommendation } from "@/types/recommendation";
import { Restaurant } from "@/types/restaurant";

interface MobileNearbySectionProps {
  today: TodayRecommendation;
  onToggleFavorite: (restaurant: Restaurant) => void;
}

// Figma: 01 Home 모바일 Nearby (9:609). 모바일은 지도 미리보기를 생략한다 (반응형 규칙)
export default function MobileNearbySection({ today, onToggleFavorite }: MobileNearbySectionProps) {
  return (
    <section className="flex flex-col gap-3 px-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-title-3 font-semibold text-labels-primary">근처 식당</h2>
        <Link href={mapRoute(today.menu.id)} className="text-subheadline font-semibold text-brand-primary">
          지도 보기
        </Link>
      </div>
      <div className="rounded-[22px] bg-white py-1">
        <RestaurantList restaurants={today.restaurants} onToggleFavorite={onToggleFavorite} />
      </div>
    </section>
  );
}
