import ChipGroup from "@/components/domain/taste/ChipGroup";
import { TasteForm } from "@/hooks/useTasteForm";

// 좋아하는 음식 종류: 여러 개 고를 수 있다 (Figma 19:461)
export default function CuisinesField({ form }: { form: TasteForm }) {
  return (
    <ChipGroup
      label="좋아하는 음식 종류"
      items={form.options?.cuisines ?? []}
      selected={form.value.favoriteCuisines}
      onToggle={(i) => form.toggle("favoriteCuisines", i)}
    />
  );
}
