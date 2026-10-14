import { Heart } from "lucide-react";
import { MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  active: boolean;
  onToggle: () => void;
  className?: string;
}

// 찜 하트. 식당 행·카드 안에 있어도 행 클릭으로 번지지 않게 막는다
export default function FavoriteButton({ active, onToggle, className }: FavoriteButtonProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "찜 해제" : "찜하기"}
      onClick={handleClick}
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-fills-quaternary", className)}
    >
      <Heart
        aria-hidden
        className={cn("size-5", active ? "fill-brand-primary text-brand-primary" : "text-labels-tertiary")}
        strokeWidth={2}
      />
    </button>
  );
}
