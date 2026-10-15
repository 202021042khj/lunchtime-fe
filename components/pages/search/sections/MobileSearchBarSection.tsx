"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import SearchBoxSection from "@/components/pages/search/sections/SearchBoxSection";
import { ROUTES } from "@/constants/navigation";
import { UseSearchLogicResult } from "@/hooks/useSearchLogic";

// 모바일 검색 화면 위쪽: 뒤로 + 검색창 (데스크톱은 메뉴바 검색창을 쓴다)
export default function MobileSearchBarSection({ logic }: { logic: UseSearchLogicResult }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-1 pr-4 pl-2 pt-[calc(env(safe-area-inset-top)+8px)]">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push(ROUTES.home))}
        aria-label="뒤로"
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-labels-primary"
      >
        <ChevronLeft aria-hidden className="size-6" />
      </button>
      <SearchBoxSection key={logic.query} logic={logic} />
    </div>
  );
}
