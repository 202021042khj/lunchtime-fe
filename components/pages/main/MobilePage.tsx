import HomeSkeletonSection from "@/components/pages/main/sections/HomeSkeletonSection";
import HomeStatusSection from "@/components/pages/main/sections/HomeStatusSection";
import MobileHeaderSection from "@/components/pages/main/sections/MobileHeaderSection";
import MobileHeroSection from "@/components/pages/main/sections/MobileHeroSection";
import MobileLocationSection from "@/components/pages/main/sections/MobileLocationSection";
import MobileNearbySection from "@/components/pages/main/sections/MobileNearbySection";
import MoreMenusSection from "@/components/pages/main/sections/MoreMenusSection";
import TasteBannerSection from "@/components/pages/main/sections/TasteBannerSection";
import { UseHomeLogicResult } from "@/hooks/useHomeLogic";

// 모바일 홈: 로고 → 날씨 한 줄 → 위치 카드 → 오늘의 추천 → 다른 메뉴(가로 스크롤) → 근처 식당 (반응형 규칙)
export default function MobilePage(logic: UseHomeLogicResult) {
  const { locationStatus, location, reco, status, radiusM } = logic;
  const statusProps = {
    radiusM,
    onPickLocation: logic.openLocationPicker,
    onRequestPermission: logic.requestLocationPermission,
    onExpandRadius: logic.expandRadius,
    onRetry: logic.retry,
  };
  const today = reco?.today;

  return (
    // 하단 탭바에 가리지 않도록 아래 여백
    <main className="flex w-full flex-col gap-5 pt-[calc(env(safe-area-inset-top)+8px)] pb-[calc(env(safe-area-inset-bottom)+110px)]">
      <MobileHeaderSection weather={reco ? reco.weather : undefined} />

      {locationStatus === "unavailable" ? (
        <HomeStatusSection kind="noLocation" {...statusProps} />
      ) : !location || (!reco && status === "loading") ? (
        <HomeSkeletonSection variant="mobile" />
      ) : !reco || status === "error" ? (
        <HomeStatusSection kind="error" {...statusProps} />
      ) : (
        <>
          <MobileLocationSection location={location} radiusM={radiusM} onChange={logic.openLocationPicker} />
          {logic.showTasteBanner && (
            <div className="px-4">
              <TasteBannerSection onStart={logic.goToTaste} onDismiss={logic.dismissTasteBanner} />
            </div>
          )}
          {today ? (
            <>
              <MobileHeroSection
                today={today}
                weather={reco.weather}
                isShuffling={logic.isShuffling}
                onFindRestaurants={() => logic.goToMap(today.menu.id)}
                onShuffle={logic.shuffle}
              />
              <MoreMenusSection alternatives={reco.alternatives} onSelectMenu={logic.goToMap} />
              <MobileNearbySection today={today} onToggleFavorite={logic.toggleFavorite} />
            </>
          ) : (
            <HomeStatusSection kind="noRestaurants" {...statusProps} />
          )}
        </>
      )}
    </main>
  );
}
