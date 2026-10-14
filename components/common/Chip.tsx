import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  icon?: ReactNode;
  className?: string;
}

// Figma: Chip (7:95) — 추천 이유 태그. 아이콘은 SF Symbol 대신 lucide 아이콘을 넘긴다
export default function Chip({ label, icon, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-fills-quaternary px-2.5 py-1.5 text-footnote font-semibold whitespace-nowrap text-labels-primary",
        className,
      )}
    >
      {icon && <span className="flex size-3.5 items-center justify-center text-brand-primary [&>svg]:size-3.5">{icon}</span>}
      {label}
    </span>
  );
}
