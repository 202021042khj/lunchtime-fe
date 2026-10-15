import { TriangleAlert } from "lucide-react";
import ChipGroup from "@/components/domain/taste/ChipGroup";
import { TasteForm } from "@/hooks/useTasteForm";

// 알레르기: 칩 + 조리 환경 안내 (Figma 19:391 · 19:422)
export default function AllergiesField({ form }: { form: TasteForm }) {
  return (
    <div className="flex flex-col gap-[18px]">
      <ChipGroup
        label="알레르기"
        items={form.options?.allergies ?? []}
        selected={form.value.allergies}
        onToggle={(i) => form.toggle("allergies", i)}
      />
      <p className="flex items-center gap-2 rounded-[14px] bg-fills-quaternary px-3.5 py-2.5 text-footnote break-keep text-labels-secondary">
        <TriangleAlert aria-hidden className="size-4 shrink-0" />
        식당마다 조리 환경이 달라요. 심한 알레르기는 주문 전에 꼭 식당에 확인하세요.
      </p>
    </div>
  );
}
