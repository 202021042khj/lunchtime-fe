import MobilePageHeader from "@/components/layout/MobilePageHeader";
import MyReviewsSection from "@/components/pages/my/sections/MyReviewsSection";
import MyStatusSection from "@/components/pages/my/sections/MyStatusSection";
import ProfileSection from "@/components/pages/my/sections/ProfileSection";
import SettingsSection from "@/components/pages/my/sections/SettingsSection";
import TasteSummarySection from "@/components/pages/my/sections/TasteSummarySection";
import { UseMyLogicResult } from "@/hooks/useMyLogic";

// 모바일 MY: 프로필 → 내 취향 → 내 리뷰 → 설정 세로 (반응형 규칙)
export default function MobilePage(logic: UseMyLogicResult) {
  return (
    <main className="flex w-full flex-col gap-4 pb-[calc(env(safe-area-inset-bottom)+110px)]">
      <MobilePageHeader title="MY" />
      <div className="flex flex-col gap-4 px-4">
        {logic.status !== "ready" || !logic.user ? (
          <MyStatusSection logic={logic} />
        ) : (
          <>
            <ProfileSection user={logic.user} />
            <TasteSummarySection preferences={logic.preferences} onEdit={logic.goToTaste} />
            <MyReviewsSection logic={logic} />
            <SettingsSection logic={logic} />
          </>
        )}
      </div>
    </main>
  );
}
