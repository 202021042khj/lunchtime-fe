import { AlertTriangle, Search } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import RestaurantRow from "@/components/domain/RestaurantRow";
import { formatRadius, withObjectParticle } from "@/lib/format";
import { Restaurant, SearchedMenu } from "@/types/restaurant";

interface MapResultsSectionProps {
  status: "loading" | "ready" | "error";
  restaurants: Restaurant[];
  selectedId: string | null;
  menu: SearchedMenu | null;
  menuOn: boolean;
  radiusM: number;
  canExpand: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onSelect: (placeId: string) => void;
  onToggleFavorite: (restaurant: Restaurant) => void;
  onLoadMore: () => void;
  onExpand: () => void;
  onOtherMenu: () => void;
  onChangeArea: () => void;
  onRetry: () => void;
}

// 식당 목록 (데스크톱 왼쪽 패널, 모바일 목록 시트 공용)
export default function MapResultsSection(props: MapResultsSectionProps) {
  const { status, restaurants, selectedId, menu, menuOn, radiusM, canExpand } = props;

  if (status === "loading" && !restaurants.length) {
    return (
      <div aria-busy aria-label="식당을 찾는 중" className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[100px] animate-pulse rounded-[18px] bg-surface-placeholder/70" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        className="py-12"
        icon={<AlertTriangle />}
        title="식당을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        primaryAction={{ label: "다시 시도", onClick: props.onRetry }}
      />
    );
  }

  // Figma 12 Map · 근처 식당 0곳 (37:1894)
  if (!restaurants.length) {
    const what = menu && menuOn ? `${menu.keyword} 식당이` : "식당이";
    return (
      <EmptyState
        className="py-12"
        icon={<Search />}
        title={`${formatRadius(radiusM)} 안에 ${what} 없어요`}
        description={menu && menuOn ? `반경을 넓히거나 비슷한 메뉴를 찾아볼까요?` : "반경을 넓히거나 다른 동네를 골라 보세요."}
        primaryAction={canExpand ? { label: "반경 3km로 넓히기", onClick: props.onExpand } : { label: "동네 바꾸기", onClick: props.onChangeArea }}
        secondaryAction={
          menu && menuOn
            ? { label: "다른 메뉴 추천받기", onClick: props.onOtherMenu }
            : canExpand
              ? { label: "동네 바꾸기", onClick: props.onChangeArea }
              : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-0.5" aria-busy={status === "loading"}>
      <ul className={status === "loading" ? "flex flex-col gap-0.5 opacity-50 transition-opacity" : "flex flex-col gap-0.5"}>
        {restaurants.map((r) => (
          <li key={r.placeId}>
            <RestaurantRow
              restaurant={r}
              selected={r.placeId === selectedId}
              onSelect={() => props.onSelect(r.placeId)}
              onToggleFavorite={props.onToggleFavorite}
            />
          </li>
        ))}
      </ul>
      {props.hasMore && (
        <button
          type="button"
          onClick={props.onLoadMore}
          disabled={props.isLoadingMore}
          className="mt-2 rounded-xl bg-white/70 py-2.5 text-subheadline font-semibold text-labels-secondary hover:text-labels-primary disabled:opacity-60"
        >
          {props.isLoadingMore ? "불러오는 중…" : "식당 더 보기"}
        </button>
      )}
      {/* 메뉴 칩을 끈 상태에서는 근거 문구가 없으니, 메뉴로 다시 좁히는 길을 알려 준다 */}
      {menu && !menuOn && (
        <p className="mt-3 text-center text-footnote text-labels-tertiary">
          {withObjectParticle(menu.keyword)} 파는 곳만 보려면 메뉴 칩을 켜 주세요
        </p>
      )}
    </div>
  );
}
