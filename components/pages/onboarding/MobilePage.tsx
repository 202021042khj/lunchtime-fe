import OnboardingActionsSection from "@/components/pages/onboarding/sections/OnboardingActionsSection";
import OnboardingStepSection from "@/components/pages/onboarding/sections/OnboardingStepSection";
import OnboardingTopBarSection from "@/components/pages/onboarding/sections/OnboardingTopBarSection";
import { UseOnboardingLogicResult } from "@/hooks/useOnboardingLogic";

// 모바일 온보딩: 1단, [이전] · [다음]은 하단 고정 (반응형 규칙)
export default function MobilePage(logic: UseOnboardingLogicResult) {
  return (
    <div className="flex w-full flex-col">
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4">
        <OnboardingTopBarSection logic={logic} />
      </div>
      <main className="flex flex-col px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+96px)]">
        <OnboardingStepSection logic={logic} />
      </main>
      <div className="fixed inset-x-0 bottom-0 z-header border-t border-white/70 bg-white/75 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-[20px]">
        <OnboardingActionsSection logic={logic} />
      </div>
    </div>
  );
}
