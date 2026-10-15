import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import PreviewPanelSection from "@/components/pages/taste/sections/PreviewPanelSection";
import TasteActionsSection from "@/components/pages/taste/sections/TasteActionsSection";
import TasteFieldsSection from "@/components/pages/taste/sections/TasteFieldsSection";
import TasteStatusSection from "@/components/pages/taste/sections/TasteStatusSection";
import { ROUTES } from "@/constants/navigation";
import { UseTasteLogicResult } from "@/hooks/useTasteLogic";

// 모바일 취향 설정: 섹션 세로 → 미리보기 맨 아래, [초기화][저장하기]는 하단 고정 (탭바 대신)
export default function MobilePage(logic: UseTasteLogicResult) {
  const router = useRouter();
  const goBack = () => (window.history.length > 1 ? router.back() : router.push(ROUTES.home));
  const ready = logic.status === "ready";

  return (
    <main className="flex w-full flex-col gap-4 pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <header className="flex flex-col gap-1 px-4 pt-[calc(env(safe-area-inset-top)+8px)]">
        <button
          type="button"
          onClick={goBack}
          aria-label="뒤로"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-labels-primary"
        >
          <ChevronLeft aria-hidden className="size-6" />
        </button>
        <h1 className="text-large-title font-bold text-labels-primary">취향 설정</h1>
        <p className="text-subheadline break-keep text-labels-secondary">여기서 고른 내용으로 메뉴를 추천해요. 언제든 바꿀 수 있어요.</p>
      </header>
      <div className="flex flex-col gap-4 px-4">
        {ready ? (
          <>
            <TasteFieldsSection form={logic.form} />
            <PreviewPanelSection logic={logic} showActions={false} />
          </>
        ) : (
          <TasteStatusSection logic={logic} />
        )}
      </div>
      {ready && (
        <div className="fixed inset-x-0 bottom-0 z-header border-t border-white/70 bg-white/75 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-[20px]">
          <TasteActionsSection logic={logic} />
        </div>
      )}
    </main>
  );
}
