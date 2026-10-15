import Button from "@/components/ui/button";
import { UseOnboardingLogicResult } from "@/hooks/useOnboardingLogic";

// Figma 25:671 Footer: [이전] · 건너뛰기 · [다음] (마지막 단계는 [추천 받기]만)
export default function OnboardingActionsSection({ logic }: { logic: UseOnboardingLogicResult }) {
  const last = logic.step === logic.total;
  return (
    <div className="flex items-center gap-2.5">
      {logic.step > 1 && (
        <Button type="button" variant="outlined" color="brand" shape="round" onClick={logic.prev} className="px-4 text-[17px] font-semibold">
          이전
        </Button>
      )}
      <div className="flex-1" />
      {!last && (
        <button type="button" onClick={logic.skip} className="px-1 text-subheadline font-semibold text-labels-secondary hover:text-labels-primary">
          건너뛰기
        </button>
      )}
      <Button
        type="button"
        color="brand"
        shape="round"
        isLoading={logic.saving}
        onClick={last ? logic.finish : logic.next}
        className="px-5 text-[17px] font-semibold"
      >
        {last ? "추천 받기" : "다음"}
      </Button>
    </div>
  );
}
