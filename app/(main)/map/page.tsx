"use client";

import { Suspense } from "react";
import DesktopPage from "@/components/pages/map/DesktopPage";
import MobilePage from "@/components/pages/map/MobilePage";
import { useMapLogic } from "@/hooks/useMapLogic";

// 지도 · 식당 목록 · 상세 (기능명세 4). URL: /map?menuId=m_12&placeId=2271043
export default function MapPage() {
  // useSearchParams를 쓰는 화면은 Suspense 안에 둔다
  return (
    <Suspense>
      <MapScreen />
    </Suspense>
  );
}

function MapScreen() {
  const logic = useMapLogic();

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
