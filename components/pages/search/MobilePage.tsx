import { Map as MapIcon } from "lucide-react";
import LocationRequiredState from "@/components/domain/LocationRequiredState";
import Button from "@/components/ui/button";
import MobileSearchBarSection from "@/components/pages/search/sections/MobileSearchBarSection";
import SearchHeaderSection from "@/components/pages/search/sections/SearchHeaderSection";
import SearchResultsSection from "@/components/pages/search/sections/SearchResultsSection";
import { UseSearchLogicResult } from "@/hooks/useSearchLogic";

// 모바일 검색: 검색창 → 제목 · 탭 → [지도에서 결과 보기] → 메뉴(가로 스크롤) → 식당 (반응형 규칙)
export default function MobilePage(logic: UseSearchLogicResult) {
  const hasResults = logic.status === "ready" && logic.restaurants.length > 0;
  return (
    <main className="flex w-full flex-col gap-4 pb-[calc(env(safe-area-inset-bottom)+110px)]">
      <MobileSearchBarSection logic={logic} />
      <div className="flex flex-col gap-5 px-4">
        {!logic.query ? (
          <SearchResultsSection logic={logic} mobile />
        ) : !logic.location ? (
          <LocationRequiredState
            className="py-12"
            kind={logic.locationStatus === "unavailable" ? "unavailable" : "locating"}
            onPickLocation={logic.openLocationPicker}
            onRequestPermission={logic.requestLocationPermission}
          />
        ) : (
          <>
            <SearchHeaderSection logic={logic} />
            {hasResults && (
              <Button
                type="button"
                variant="outlined"
                color="brand"
                shape="round"
                onClick={logic.openMap}
                leftIcon={<MapIcon aria-hidden className="size-4" />}
                className="h-11 w-full gap-1.5 text-subheadline font-semibold"
              >
                지도에서 결과 보기
              </Button>
            )}
            <SearchResultsSection logic={logic} mobile />
          </>
        )}
      </div>
    </main>
  );
}
