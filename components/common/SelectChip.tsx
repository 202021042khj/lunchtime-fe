import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  className?: string;
}

// Figma: Select Chip (18:274) — 취향 설정·온보딩·필터·리뷰 쓰기·어드민 폼의 다중 선택
export default function SelectChip({ label, selected, onToggle, className }: SelectChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-[9px] text-subheadline whitespace-nowrap transition-colors",
        selected
          ? "border-[1.5px] border-brand-primary bg-brand-primary-tint font-semibold text-brand-primary"
          : "border border-chip-border bg-white/80 text-labels-primary hover:bg-white",
        className,
      )}
    >
      {selected && <Check aria-hidden className="size-4" strokeWidth={2.5} />}
      {label}
    </button>
  );
}
