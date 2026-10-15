"use client";

import DesktopPage from "@/components/pages/taste/DesktopPage";
import MobilePage from "@/components/pages/taste/MobilePage";
import { useTasteLogic } from "@/hooks/useTasteLogic";

// 취향 설정 (기능명세 2)
export default function TastePage() {
  const logic = useTasteLogic();

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
