"use client";

import DesktopPage from "@/components/pages/main/DesktopPage";
import MobilePage from "@/components/pages/main/MobilePage";
import { useHomeLogic } from "@/hooks/useHomeLogic";

// 홈 · 메뉴 추천 (기능명세 1)
export default function Home() {
  const logic = useHomeLogic();

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
