"use client";

import { ChevronLeft, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import BottomSheet, { SheetSnap } from "@/components/common/BottomSheet";
import KakaoMap from "@/components/domain/KakaoMap";
import LocationRequiredState from "@/components/domain/LocationRequiredState";
import MapFilterChips from "@/components/pages/map/sections/MapFilterChips";
import MapResultsSection from "@/components/pages/map/sections/MapResultsSection";
import PlacePanelSection from "@/components/pages/map/sections/PlacePanelSection";
import ResearchAreaSection from "@/components/pages/map/sections/ResearchAreaSection";
import SortMenu from "@/components/pages/map/sections/SortMenu";
import { ROUTES } from "@/constants/navigation";
import { UseMapLogicResult } from "@/hooks/useMapLogic";
import { cn } from "@/lib/utils";

// 위쪽 검색바·칩(약 150px)과 반쯤 올라온 시트(화면 절반)를 피해 화면을 맞춘다
const FIT_PADDING = { top: 170, right: 40, bottom: 420, left: 40 };
// 선택한 식당 핀이 반쯤 올라온 시트에 가리지 않게 위로 비켜 둔다
const SELECTED_OFFSET = { x: 0, y: 190 };

// 시트 높이에 맞춰 [내 위치] 버튼을 시트 바로 위에 둔다
const CONTROLS_POSITION: Record<SheetSnap, string> = {
  min: "bottom-[144px]",
  half: "bottom-[calc(50dvh+12px)]",
  full: "hidden",
};

// Figma: 03 Map · Mobile 목록 시트 (31:946) · 상세 시트 (31:1117). 지도 전체 화면 + 하단 시트
export default function MobilePage(logic: UseMapLogicResult) {
  // 시트 높이는 모바일 화면에만 있는 UI 상태라 여기서 들고 있는다
  const [snap, setSnap] = useState<SheetSnap>("half");

  if (!logic.location) {
    return (
      <main className="w-full pt-[calc(env(safe-area-inset-top)+24px)] pb-28">
        <LocationRequiredState
          kind={logic.locationStatus === "unavailable" ? "unavailable" : "locating"}
          onPickLocation={logic.openLocationPicker}
          onRequestPermission={logic.requestLocationPermission}
        />
      </main>
    );
  }

  const { selected } = logic;
  const select = (placeId: string) => {
    logic.select(placeId);
    setSnap("half");
  };

  return (
    <main className="fixed inset-0">
      <KakaoMap
        className="absolute inset-0"
        me={logic.location}
        restaurants={logic.restaurants}
        selectedId={selected?.placeId ?? null}
        onSelect={select}
        fitKey={logic.fitKey}
        fitCenter={logic.fitCenter}
        fitPadding={FIT_PADDING}
        selectedOffset={SELECTED_OFFSET}
        onUserMove={logic.onUserMove}
        onLocateMe={logic.locateMe}
        showZoom={false}
        controlsClassName={cn("left-auto right-4", CONTROLS_POSITION[snap])}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="pointer-events-auto mx-4 flex h-[52px] items-center gap-2 rounded-full border border-white/85 bg-white/85 pr-2 pl-2 shadow-[0_8px_32px_rgba(64,38,20,0.1)] backdrop-blur-[15px]">
          <button type="button" aria-label="뒤로" onClick={logic.goBack} className="flex size-9 items-center justify-center text-labels-primary">
            <ChevronLeft aria-hidden className="size-6" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-headline text-labels-primary">{logic.title}</h1>
          <Link
            href={ROUTES.taste}
            aria-label="취향 설정"
            className="flex size-9 items-center justify-center rounded-full bg-brand-primary-tint text-brand-primary"
          >
            <SlidersHorizontal aria-hidden className="size-4" />
          </Link>
        </div>
        <div className="pointer-events-auto">
          <MapFilterChips
            scroll
            menu={logic.menu}
            filters={logic.filters}
            onToggleMenu={logic.toggleMenuFilter}
            onToggleWithin1km={logic.toggleWithin1km}
            onToggleMinRating={logic.toggleMinRating}
            onToggleReviewSort={() => logic.setSort(logic.filters.sort === "reviews" ? "distance" : "reviews")}
          />
        </div>
        {logic.showResearch && (
          <div className="pointer-events-auto flex justify-center">
            <ResearchAreaSection onClick={logic.researchHere} />
          </div>
        )}
      </div>

      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        header={
          !selected && (
            <div className="flex items-center justify-between px-5 pb-2">
              <span className="text-headline text-labels-primary">{logic.status === "ready" ? `식당 ${logic.total}곳` : "식당 찾는 중"}</span>
              <SortMenu sort={logic.filters.sort} onChange={logic.setSort} className="text-subheadline" />
            </div>
          )
        }
      >
        {selected ? (
          <PlacePanelSection logic={logic} restaurant={selected} />
        ) : (
          <MapResultsSection
            status={logic.status}
            restaurants={logic.restaurants}
            selectedId={null}
            menu={logic.menu}
            menuOn={logic.filters.menuOn}
            radiusM={logic.radiusM}
            canExpand={logic.filters.within1km}
            hasMore={logic.hasMore}
            isLoadingMore={logic.isLoadingMore}
            onSelect={select}
            onToggleFavorite={logic.toggleFavorite}
            onLoadMore={logic.loadMore}
            onExpand={logic.expandRadius}
            onOtherMenu={logic.goHome}
            onChangeArea={logic.openLocationPicker}
            onRetry={logic.retry}
          />
        )}
      </BottomSheet>
    </main>
  );
}
