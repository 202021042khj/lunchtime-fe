import PreviewPanelSection from "@/components/pages/taste/sections/PreviewPanelSection";
import TasteFieldsSection from "@/components/pages/taste/sections/TasteFieldsSection";
import TasteStatusSection from "@/components/pages/taste/sections/TasteStatusSection";
import { UseTasteLogicResult } from "@/hooks/useTasteLogic";

// Figma: 02 Taste Settings · Desktop (19:303) — 왼쪽 섹션 4개 / 오른쪽 400px 미리보기(스크롤해도 따라온다).
// 태블릿(768~1023px)은 1단: 섹션 → 미리보기
export default function DesktopPage(logic: UseTasteLogicResult) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pt-8 pb-24 xl:px-0">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="flex flex-col gap-1.5 pb-1">
            <h1 className="text-title-1 font-bold text-labels-primary">취향 설정</h1>
            <p className="text-body text-labels-secondary">여기서 고른 내용으로 메뉴를 추천해요. 언제든 바꿀 수 있어요.</p>
          </header>
          {logic.status === "ready" ? <TasteFieldsSection form={logic.form} /> : <TasteStatusSection logic={logic} />}
        </div>
        {logic.status === "ready" && (
          <aside className="lg:sticky lg:top-8 lg:w-[400px] lg:shrink-0">
            <PreviewPanelSection logic={logic} showActions />
          </aside>
        )}
      </div>
    </main>
  );
}
