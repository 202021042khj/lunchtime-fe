import DesktopHeroSection from "@/components/pages/main/sections/DesktopHeroSection";
import DesktopNearbySection from "@/components/pages/main/sections/DesktopNearbySection";
import HomeSkeletonSection from "@/components/pages/main/sections/HomeSkeletonSection";
import HomeStatusSection from "@/components/pages/main/sections/HomeStatusSection";
import MoreMenusSection from "@/components/pages/main/sections/MoreMenusSection";
import TasteBannerSection from "@/components/pages/main/sections/TasteBannerSection";
import { UseHomeLogicResult } from "@/hooks/useHomeLogic";

// 데스크톱(1024px~)은 메인 + 사이드 2단, 태블릿(768~1023px)은 1단으로 쌓는다
export default function DesktopPage(logic: UseHomeLogicResult) {
  return <main className="mx-auto w-full max-w-[1200px] px-6 pt-8 pb-20 xl:px-0">{renderContent(logic)}</main>;
}

function renderContent(logic: UseHomeLogicResult) {
  const { locationStatus, location, reco, status, radiusM } = logic;
  const statusProps = {
    radiusM,
    onPickLocation: logic.openLocationPicker,
    onRequestPermission: logic.requestLocationPermission,
    onExpandRadius: logic.expandRadius,
    onRetry: logic.retry,
  };

  if (locationStatus === "unavailable") return <HomeStatusSection kind="noLocation" {...statusProps} />;
  if (!location && locationStatus === "locating") return <HomeStatusSection kind="locating" {...statusProps} />;
  if (!location || (!reco && status === "loading")) return <HomeSkeletonSection variant="desktop" />;
  if (!reco || status === "error") return <HomeStatusSection kind="error" {...statusProps} />;

  const today = reco.today;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col gap-7">
        {logic.showTasteBanner && <TasteBannerSection onStart={logic.goToTaste} onDismiss={logic.dismissTasteBanner} />}
        {today ? (
          <>
            <DesktopHeroSection
              today={today}
              weather={reco.weather}
              locationName={location.name}
              isShuffling={logic.isShuffling}
              onFindRestaurants={() => logic.goToMap(today.menu.id)}
              onShuffle={logic.shuffle}
            />
            <MoreMenusSection alternatives={reco.alternatives} onSelectMenu={logic.goToMap} />
          </>
        ) : (
          <HomeStatusSection kind="noRestaurants" {...statusProps} />
        )}
      </div>
      {today && <DesktopNearbySection today={today} center={location} onToggleFavorite={logic.toggleFavorite} />}
    </div>
  );
}
