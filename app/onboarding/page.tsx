"use client";

import { Suspense } from "react";
import DesktopPage from "@/components/pages/onboarding/DesktopPage";
import MobilePage from "@/components/pages/onboarding/MobilePage";
import { useOnboardingLogic } from "@/hooks/useOnboardingLogic";

// 온보딩 (기능명세 5). 메뉴바 · 탭바 없이 단독 화면
function OnboardingContent() {
  const logic = useOnboardingLogic();

  return (
    <div className="flex flex-1 flex-col">
      <div className="hidden md:flex md:flex-1">
        <DesktopPage {...logic} />
      </div>
      <div className="flex flex-1 md:hidden">
        <MobilePage {...logic} />
      </div>
    </div>
  );
}

// useSearchParams(?step=)를 쓰므로 Suspense로 감싼다
export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
