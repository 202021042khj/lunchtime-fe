"use client";

import DesktopPage from "@/components/pages/favorites/DesktopPage";
import MobilePage from "@/components/pages/favorites/MobilePage";
import { useFavoritesLogic } from "@/hooks/useFavoritesLogic";

// 찜한 식당 (기능명세 6)
export default function FavoritesPage() {
  const logic = useFavoritesLogic();

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
