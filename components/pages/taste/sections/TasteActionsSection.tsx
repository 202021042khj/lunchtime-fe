import Button from "@/components/ui/button";
import { UseTasteLogicResult } from "@/hooks/useTasteLogic";

// [초기화] [저장하기] — 데스크톱은 미리보기 카드 안, 모바일은 하단 고정 바 (Figma 19:510)
export default function TasteActionsSection({ logic }: { logic: UseTasteLogicResult }) {
  return (
    <div className="flex gap-2.5">
      <Button
        type="button"
        variant="outlined"
        color="brand"
        shape="round"
        disabled={!logic.dirty || logic.saving}
        onClick={logic.reset}
        className="px-4 text-[17px] font-semibold"
      >
        초기화
      </Button>
      <Button
        type="button"
        color="brand"
        shape="round"
        isLoading={logic.saving}
        onClick={logic.save}
        className="flex-1 px-5 text-[17px] font-semibold"
      >
        저장하기
      </Button>
    </div>
  );
}
