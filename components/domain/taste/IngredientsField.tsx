import { Plus, Search } from "lucide-react";
import { FormEvent } from "react";
import ChipGroup from "@/components/domain/taste/ChipGroup";
import { TasteForm } from "@/hooks/useTasteForm";

// 못 먹는 재료: 칩 + "목록에 없는 재료 검색해서 추가" (Figma 19:344 · 19:381)
export default function IngredientsField({ form }: { form: TasteForm }) {
  const selected = form.value.dislikedIngredients;
  // 검색으로 추가한 재료도 칩으로 보여 준다
  const items = [...(form.options?.ingredients ?? []), ...selected.filter((i) => !form.options?.ingredients.includes(i))];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    form.addIngredient(form.ingredientResults[0] ?? form.ingredientQuery);
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <ChipGroup label="못 먹는 재료" items={items} selected={selected} onToggle={(i) => form.toggle("dislikedIngredients", i)} />
      <div className="flex flex-col gap-2">
        <form onSubmit={submit} className="flex h-11 items-center gap-2 rounded-full bg-fills-quaternary px-4">
          <Search aria-hidden className="size-4 shrink-0 text-labels-secondary" />
          <input
            value={form.ingredientQuery}
            onChange={(e) => form.setIngredientQuery(e.target.value)}
            placeholder="목록에 없는 재료 검색해서 추가"
            aria-label="못 먹는 재료 검색"
            className="min-w-0 flex-1 bg-transparent text-subheadline text-labels-primary outline-none placeholder:text-labels-tertiary"
          />
          <button type="submit" aria-label="재료 추가" disabled={!form.ingredientQuery.trim()} className="text-brand-primary disabled:opacity-60">
            <Plus aria-hidden className="size-5" />
          </button>
        </form>
        {form.ingredientResults.length > 0 && (
          <ul aria-label="재료 검색 결과" className="flex flex-wrap gap-2 px-1">
            {form.ingredientResults.slice(0, 8).map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => form.addIngredient(item)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-chip-border px-3 py-1.5 text-footnote text-labels-primary hover:bg-white/80"
                >
                  <Plus aria-hidden className="size-3.5 text-brand-primary" />
                  {item}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
