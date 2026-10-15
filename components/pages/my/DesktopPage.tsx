import MyReviewsSection from "@/components/pages/my/sections/MyReviewsSection";
import MyStatusSection from "@/components/pages/my/sections/MyStatusSection";
import ProfileSection from "@/components/pages/my/sections/ProfileSection";
import SettingsSection from "@/components/pages/my/sections/SettingsSection";
import TasteSummarySection from "@/components/pages/my/sections/TasteSummarySection";
import { UseMyLogicResult } from "@/hooks/useMyLogic";

// Figma: 07 MY · Desktop (26:880) — 왼쪽 400px(프로필 · 취향 · 설정) / 오른쪽 내 리뷰.
// 태블릿(768~1023px)은 1단: 프로필 → 취향 → 리뷰 → 설정 (반응형 규칙)
export default function DesktopPage(logic: UseMyLogicResult) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pt-8 pb-24 xl:px-0">
      {logic.status !== "ready" || !logic.user ? (
        <MyStatusSection logic={logic} />
      ) : (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-6">
          {/* lg 미만에서는 contents로 풀어서 order로 순서를 바꾼다 */}
          <div className="contents lg:flex lg:flex-col lg:gap-4">
            <div className="order-1 lg:order-none">
              <ProfileSection user={logic.user} />
            </div>
            <div className="order-2 lg:order-none">
              <TasteSummarySection preferences={logic.preferences} onEdit={logic.goToTaste} />
            </div>
            <div className="order-4 lg:order-none">
              <SettingsSection logic={logic} />
            </div>
          </div>
          <div className="order-3 lg:order-none">
            <MyReviewsSection logic={logic} />
          </div>
        </div>
      )}
    </main>
  );
}
