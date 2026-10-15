"use client";

import DesktopPage from "@/components/pages/my/DesktopPage";
import MobilePage from "@/components/pages/my/MobilePage";
import { useMyLogic } from "@/hooks/useMyLogic";

// MY (기능명세 7)
export default function MyPage() {
  const logic = useMyLogic();

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
