import { Fragment } from "react";
import RestaurantRow from "@/components/domain/RestaurantRow";
import { Restaurant } from "@/types/restaurant";

interface RestaurantListProps {
  restaurants: Restaurant[];
  onSelect?: (restaurant: Restaurant) => void;
  onToggleFavorite?: (restaurant: Restaurant) => void;
}

// 식당 행 목록. 행 사이 구분선은 썸네일 오른쪽(84px)부터 시작한다 (Figma Divider)
export default function RestaurantList({ restaurants, onSelect, onToggleFavorite }: RestaurantListProps) {
  return (
    <ul className="flex flex-col">
      {restaurants.map((r, i) => (
        <Fragment key={r.placeId}>
          {i > 0 && (
            <li aria-hidden className="pr-3 pl-[84px]">
              <div className="h-[0.5px] bg-separators-non-opaque" />
            </li>
          )}
          <li>
            <RestaurantRow restaurant={r} onSelect={onSelect} onToggleFavorite={onToggleFavorite} />
          </li>
        </Fragment>
      ))}
    </ul>
  );
}
