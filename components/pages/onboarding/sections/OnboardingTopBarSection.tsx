import Link from "next/link";
import LogoMark from "@/components/common/LogoMark";
import { ROUTES } from "@/constants/navigation";
import { UseOnboardingLogicResult } from "@/hooks/useOnboardingLogic";

// Figma 25:637 Top Bar: 로고 · "나중에 할게요"
export default function OnboardingTopBarSection({ logic }: { logic: UseOnboardingLogicResult }) {
  return (
    <header className="flex items-center justify-between">
      <Link href={ROUTES.home} className="flex items-center gap-2">
        <LogoMark />
        <span className="text-title-3 font-semibold text-labels-primary">lunchtime</span>
      </Link>
      <button
        type="button"
        onClick={logic.later}
        disabled={logic.saving}
        className="text-subheadline font-semibold text-labels-secondary hover:text-labels-primary"
      >
        나중에 할게요
      </button>
    </header>
  );
}
