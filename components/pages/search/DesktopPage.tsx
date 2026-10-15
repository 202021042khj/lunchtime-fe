import LocationRequiredState from "@/components/domain/LocationRequiredState";
import SearchBoxSection from "@/components/pages/search/sections/SearchBoxSection";
import SearchHeaderSection from "@/components/pages/search/sections/SearchHeaderSection";
import SearchMapSection from "@/components/pages/search/sections/SearchMapSection";
import SearchResultsSection from "@/components/pages/search/sections/SearchResultsSection";
import SearchStatusSection from "@/components/pages/search/sections/SearchStatusSection";
import { UseSearchLogicResult } from "@/hooks/useSearchLogic";

// Figma: 10 Search Results · Desktop (35:1433) — 왼쪽 메뉴 · 식당 결과 / 오른쪽 400px 지도 미리보기(따라 내려옴).
// 검색창은 메뉴바에 있다. 태블릿(768~1023px)은 지도 미리보기를 빼고 1단
export default function DesktopPage(logic: UseSearchLogicResult) {
  if (!logic.query) {
    return (
      <main className="mx-auto w-full max-w-[1200px] px-6 pt-8 pb-20 xl:px-0">
        {/* 태블릿은 메뉴바에 검색창이 없어 화면 안에 둔다 */}
        <div className="mb-6 flex lg:hidden">
          <SearchBoxSection key={logic.query} logic={logic} />
        </div>
        <SearchStatusSection logic={logic} />
      </main>
    );
  }
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
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pt-8 pb-20 xl:px-0">
      <div className="mb-6 flex lg:hidden">
        <SearchBoxSection key={logic.query} logic={logic} />
      </div>
      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-7">
          <SearchHeaderSection logic={logic} />
          <SearchResultsSection logic={logic} />
        </div>
        <aside className="sticky top-8 hidden w-[400px] shrink-0 lg:block">
          <SearchMapSection logic={logic} />
        </aside>
      </div>
    </main>
  );
}
