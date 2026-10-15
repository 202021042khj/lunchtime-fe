import { SPICE_LABELS } from "@/constants/user";
import { TasteForm } from "@/hooks/useTasteForm";
import { cn } from "@/lib/utils";
import { SpiceLevel } from "@/types/preferences";

const LEVELS = [0, 1, 2, 3, 4] as const satisfies readonly SpiceLevel[];

// 맵기: 5단계 세그먼트 (Figma Segmented Control 19:430). 고른 칸을 다시 누르면 선택을 푼다
export default function SpiceField({ form }: { form: TasteForm }) {
  const current = form.value.spiceLevel;
  return (
    <div role="radiogroup" aria-label="맵기" className="flex w-full rounded-full bg-fills-quaternary p-0.5">
      {LEVELS.map((level) => {
        const selected = current === level;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => form.setSpiceLevel(selected ? null : level)}
            className={cn(
              "min-h-9 flex-1 rounded-full px-1 py-2 text-center text-footnote break-keep transition-colors",
              selected ? "bg-white font-semibold text-labels-primary shadow-[0_3px_8px_rgba(0,0,0,0.08)]" : "text-labels-secondary hover:text-labels-primary",
            )}
          >
            {SPICE_LABELS[level]}
          </button>
        );
      })}
    </div>
  );
}
