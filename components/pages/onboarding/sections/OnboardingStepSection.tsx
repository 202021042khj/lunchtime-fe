import AllergiesField from "@/components/domain/taste/AllergiesField";
import CuisinesField from "@/components/domain/taste/CuisinesField";
import IngredientsField from "@/components/domain/taste/IngredientsField";
import SpiceField from "@/components/domain/taste/SpiceField";
import { ONBOARDING_STEPS, UseOnboardingLogicResult } from "@/hooks/useOnboardingLogic";
import { TasteForm } from "@/hooks/useTasteForm";

const FIELDS: Record<(typeof ONBOARDING_STEPS)[number]["field"], (props: { form: TasteForm }) => React.ReactNode> = {
  dislikedIngredients: IngredientsField,
  allergies: AllergiesField,
  spiceLevel: SpiceField,
  favoriteCuisines: CuisinesField,
};

// Figma 05 Onboarding Step Column (25:645): 진행률 n/4 → 질문 → 선택 카드
export default function OnboardingStepSection({ logic }: { logic: UseOnboardingLogicResult }) {
  const { step, total, form } = logic;
  const current = ONBOARDING_STEPS[step - 1];
  const Field = FIELDS[current.field];

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <p className="text-footnote font-semibold text-brand-primary">
          {step} / {total}
        </p>
        <div
          role="progressbar"
          aria-label="온보딩 진행률"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step}
          className="h-1.5 w-full overflow-hidden rounded-[3px] bg-surface-placeholder"
        >
          <div className="h-full rounded-[3px] bg-brand-primary transition-[width] duration-300" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-title-1 font-bold break-keep text-labels-primary md:text-large-title">{current.title}</h1>
        <p className="text-body break-keep text-labels-secondary">{current.description}</p>
      </div>
      <section
        aria-label={current.title}
        className="rounded-[28px] border border-white/85 bg-glass-card p-5 shadow-[0_8px_32px_rgba(64,38,20,0.08)] md:p-7"
      >
        <Field form={form} />
      </section>
    </div>
  );
}
