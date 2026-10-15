"use client";

import { Suspense } from "react";
import DesktopPage from "@/components/pages/search/DesktopPage";
import MobilePage from "@/components/pages/search/MobilePage";
import { useSearchLogic } from "@/hooks/useSearchLogic";

// 검색 결과 (기능명세 10)
function SearchContent() {
  const logic = useSearchLogic();

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

// useSearchParams(?q= · ?type=)를 쓰므로 Suspense로 감싼다
export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
