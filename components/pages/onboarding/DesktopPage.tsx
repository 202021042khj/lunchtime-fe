import OnboardingActionsSection from "@/components/pages/onboarding/sections/OnboardingActionsSection";
import OnboardingStepSection from "@/components/pages/onboarding/sections/OnboardingStepSection";
import OnboardingTopBarSection from "@/components/pages/onboarding/sections/OnboardingTopBarSection";
import { UseOnboardingLogicResult } from "@/hooks/useOnboardingLogic";

// Figma: 05 Onboarding 1/4 ~ 4/4 · Desktop (25:636 · 25:682 · 25:731 · 25:784) — 720px 가운데 1단
export default function DesktopPage(logic: UseOnboardingLogicResult) {
  return (
    <div className="flex min-h-dvh w-full flex-col">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-6 xl:px-0">
        <OnboardingTopBarSection logic={logic} />
      </div>
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-7 px-6 pb-24 md:px-0">
        <OnboardingStepSection logic={logic} />
        <OnboardingActionsSection logic={logic} />
      </main>
    </div>
  );
}
