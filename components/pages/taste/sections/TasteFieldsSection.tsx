import { ReactNode } from "react";
import AllergiesField from "@/components/domain/taste/AllergiesField";
import CuisinesField from "@/components/domain/taste/CuisinesField";
import IngredientsField from "@/components/domain/taste/IngredientsField";
import SpiceField from "@/components/domain/taste/SpiceField";
import { TasteForm } from "@/hooks/useTasteForm";

const CARD = "rounded-[28px] border border-glass-border bg-glass-card shadow-[0_8px_32px_rgba(31,26,89,0.08)]";

interface CardProps {
  title: string;
  description: string;
  count?: number;
  children: ReactNode;
}

// Figma 19:338 Section 카드: 제목 · 설명 · 오른쪽 위 "n개 선택"
function TasteCard({ title, description, count, children }: CardProps) {
  return (
    <section aria-label={title} className={`flex flex-col gap-[18px] px-5 pt-5 pb-6 md:px-7 md:pt-6 md:pb-7 ${CARD}`}>
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-title-3 font-semibold text-labels-primary">{title}</h2>
          <p className="text-subheadline break-keep text-labels-secondary">{description}</p>
        </div>
        {!!count && <span className="shrink-0 text-footnote font-semibold text-brand-primary">{count}개 선택</span>}
      </div>
      {children}
    </section>
  );
}

// 취향 설정 섹션 4개 (Figma 02 Taste Settings Main Column)
export default function TasteFieldsSection({ form }: { form: TasteForm }) {
  const v = form.value;
  return (
    <div className="flex flex-col gap-5">
      <TasteCard title="못 먹는 재료" description="이 재료가 들어간 메뉴는 추천하지 않아요." count={v.dislikedIngredients.length}>
        <IngredientsField form={form} />
      </TasteCard>
      <TasteCard title="알레르기" description="선택한 알레르기 재료가 들어간 메뉴는 항상 제외돼요." count={v.allergies.length}>
        <AllergiesField form={form} />
      </TasteCard>
      <TasteCard title="맵기" description="매운 정도에 맞춰 메뉴 순서를 조정해요.">
        <SpiceField form={form} />
      </TasteCard>
      <TasteCard
        title="좋아하는 음식 종류"
        description="고른 종류를 더 자주 추천해요. 고르지 않으면 골고루 추천해요."
        count={v.favoriteCuisines.length}
      >
        <CuisinesField form={form} />
      </TasteCard>
    </div>
  );
}
