import FoodImage from "@/components/common/FoodImage";
import TasteActionsSection from "@/components/pages/taste/sections/TasteActionsSection";
import { UseTasteLogicResult } from "@/hooks/useTasteLogic";
import { formatMatch } from "@/lib/format";

const CARD = "rounded-[28px] border border-glass-border bg-glass-card shadow-[0_8px_32px_rgba(31,26,89,0.08)]";

// Figma 19:486 Preview Panel — 지금 설정으로 추천될 메뉴 3개 + 빠지는 메뉴 예시. 모바일은 버튼을 하단 고정 바로 뺀다
export default function PreviewPanelSection({ logic, showActions }: { logic: UseTasteLogicResult; showActions: boolean }) {
  const { preview } = logic;
  return (
    <section aria-label="추천 미리보기" className={`flex flex-col gap-4 p-6 ${CARD}`}>
      <div className="flex flex-col gap-1">
        <h2 className="text-title-3 font-semibold text-labels-primary">추천 미리보기</h2>
        <p className="text-subheadline text-labels-secondary">지금 설정이면 오늘 이렇게 추천돼요</p>
      </div>

      {!preview ? (
        <div aria-busy className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-surface-placeholder" />
          ))}
        </div>
      ) : preview.recommended.length ? (
        <ol aria-label="추천될 메뉴" className="flex flex-col gap-3">
          {preview.recommended.map(({ menu, matchPercent }) => (
            <li key={menu.id} className="flex items-center gap-3">
              <FoodImage src={menu.imageUrl} alt={menu.name} compact className="size-11 shrink-0 rounded-xl" />
              <span className="min-w-0 flex-1 truncate text-headline text-labels-primary">{menu.name}</span>
              <span className="shrink-0 text-footnote font-semibold text-brand-primary">{formatMatch(matchPercent)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-subheadline text-labels-secondary">조건에 맞는 메뉴가 없어요. 조금만 줄여 보세요.</p>
      )}

      <div className="h-px bg-separators-non-opaque" />

      <div className="flex flex-col gap-1 text-footnote">
        <p className="font-semibold text-labels-secondary">추천에서 빠지는 메뉴 예시</p>
        <p aria-label="빠지는 메뉴" className="text-labels-tertiary">
          {preview?.excluded.length ? preview.excluded.map((e) => `${e.menu.name}(${e.reason})`).join(" · ") : "빠지는 메뉴가 없어요"}
        </p>
      </div>

      {showActions && <TasteActionsSection logic={logic} />}
    </section>
  );
}
