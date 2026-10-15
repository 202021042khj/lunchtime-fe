import SelectChip from "@/components/common/SelectChip";

interface ChipGroupProps {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
}

// 취향 칩 묶음 (Figma 19:344 Chips) — 줄바꿈, 간격 8px
export default function ChipGroup({ label, items, selected, onToggle }: ChipGroupProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <SelectChip key={item} label={item} selected={selected.includes(item)} onToggle={() => onToggle(item)} />
      ))}
    </div>
  );
}
