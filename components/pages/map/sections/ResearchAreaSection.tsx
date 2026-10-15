import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Figma 03 Map Re-search: 지도를 옮기면 나타나는 [이 지역에서 다시 검색]
export default function ResearchAreaSection({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-white/85 bg-white/80 px-4 py-2.5 text-subheadline font-semibold text-labels-primary shadow-[0_8px_32px_rgba(64,38,20,0.1)] backdrop-blur-[15px]",
        className,
      )}
    >
      <RotateCw aria-hidden className="size-4 text-brand-primary" />이 지역에서 다시 검색
    </button>
  );
}
