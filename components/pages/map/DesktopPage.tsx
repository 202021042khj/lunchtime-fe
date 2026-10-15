import KakaoMap from "@/components/domain/KakaoMap";
import LocationRequiredState from "@/components/domain/LocationRequiredState";
import MapFilterChips from "@/components/pages/map/sections/MapFilterChips";
import MapResultsSection from "@/components/pages/map/sections/MapResultsSection";
import PlacePanelSection from "@/components/pages/map/sections/PlacePanelSection";
import ResearchAreaSection from "@/components/pages/map/sections/ResearchAreaSection";
import SortMenu from "@/components/pages/map/sections/SortMenu";
import { UseMapLogicResult } from "@/hooks/useMapLogic";

// 상세 패널(400px + 여백)이 핀을 가리지 않게 화면 맞춤 여백을 준다
const FIT_PADDING = { top: 80, right: 60, bottom: 60, left: 60 };
const FIT_PADDING_WITH_DETAIL = { top: 80, right: 460, bottom: 60, left: 60 };
// 선택한 식당 핀이 오른쪽 상세 패널(400px) 밑에 숨지 않게 왼쪽으로 비켜 둔다
const SELECTED_OFFSET = { x: 210, y: 0 };

// Figma: 03 Map · Desktop (23:380) — 왼쪽 목록 패널 / 지도 / 오른쪽 상세 패널. 태블릿은 패널 폭만 줄인다
export default function DesktopPage(logic: UseMapLogicResult) {
  if (!logic.location) {
    return (
      <main className="w-full">
        <LocationRequiredState
          kind={logic.locationStatus === "unavailable" ? "unavailable" : "locating"}
          onPickLocation={logic.openLocationPicker}
          onRequestPermission={logic.requestLocationPermission}
        />
      </main>
    );
  }

  const { selected } = logic;

  return (
    // 상단 메뉴바(128px) 아래를 꽉 채운다
    <main className="flex h-[calc(100dvh-128px)] min-h-[560px] w-full">
      <aside className="flex w-[360px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-separators-non-opaque bg-white/60 px-6 pt-6 pb-10 lg:w-[460px]">
        <header className="flex flex-col gap-1">
          <h1 className="text-title-2 font-bold text-labels-primary">{logic.title}</h1>
          <p className="text-subheadline text-labels-secondary">{logic.summary}</p>
        </header>
        <MapFilterChips
          menu={logic.menu}
          filters={logic.filters}
          onToggleMenu={logic.toggleMenuFilter}
          onToggleWithin1km={logic.toggleWithin1km}
          onToggleMinRating={logic.toggleMinRating}
          onToggleReviewSort={() => logic.setSort(logic.filters.sort === "reviews" ? "distance" : "reviews")}
        />
        {/* 결과가 0곳이면 개수·정렬 줄 없이 빈 상태만 (Figma 37:1894) */}
        {!(logic.status === "ready" && logic.total === 0) && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-footnote font-semibold text-labels-secondary">{logic.status === "ready" ? `${logic.total}곳` : ""}</span>
            <SortMenu sort={logic.filters.sort} onChange={logic.setSort} />
          </div>
        )}
        <MapResultsSection
          status={logic.status}
          restaurants={logic.restaurants}
          selectedId={selected?.placeId ?? null}
          menu={logic.menu}
          menuOn={logic.filters.menuOn}
          radiusM={logic.radiusM}
          canExpand={logic.filters.within1km}
          hasMore={logic.hasMore}
          isLoadingMore={logic.isLoadingMore}
          onSelect={logic.select}
          onToggleFavorite={logic.toggleFavorite}
          onLoadMore={logic.loadMore}
          onExpand={logic.expandRadius}
          onOtherMenu={logic.goHome}
          onChangeArea={logic.openLocationPicker}
          onRetry={logic.retry}
        />
      </aside>

      <section className="relative min-w-0 flex-1">
        <KakaoMap
          className="absolute inset-0"
          me={logic.location}
          restaurants={logic.restaurants}
          selectedId={selected?.placeId ?? null}
          onSelect={logic.select}
          fitKey={logic.fitKey}
          fitCenter={logic.fitCenter}
          fitPadding={selected ? FIT_PADDING_WITH_DETAIL : FIT_PADDING}
          selectedOffset={SELECTED_OFFSET}
          onUserMove={logic.onUserMove}
          onLocateMe={logic.locateMe}
        />
        {logic.showResearch && <ResearchAreaSection onClick={logic.researchHere} className="absolute top-6 left-6 z-10" />}
        {selected && (
          <div className="absolute top-6 right-6 bottom-6 z-10 w-[340px] overflow-y-auto rounded-[28px] border border-white/85 bg-white/85 px-5 pt-3 pb-5 shadow-[0_8px_32px_rgba(64,38,20,0.1)] backdrop-blur-[15px] lg:w-[400px]">
            <PlacePanelSection logic={logic} restaurant={selected} />
          </div>
        )}
      </section>
    </main>
  );
}
