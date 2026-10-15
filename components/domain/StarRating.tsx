import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number; // 0~5, 0.5 단위로 반올림
  className?: string;
  starClassName?: string;
  // 리뷰 목록처럼 받은 별만 보여 줄 때 (Figma 03 Map Review)
  hideEmpty?: boolean;
}

// 별 5개 (꽉 찬 별 · 반 별 · 빈 별). SF Symbol star.fill / star.leadinghalf.filled 대체
export default function StarRating({ rating, className, starClassName = "size-4", hideEmpty = false }: StarRatingProps) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span role="img" aria-label={`별점 ${rating.toFixed(1)}점`} className={cn("inline-flex items-center gap-0.5 text-brand-primary", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        if (rounded >= n) return <Star key={n} aria-hidden className={cn("fill-current", starClassName)} strokeWidth={1.5} />;
        if (rounded === n - 0.5)
          return (
            <span key={n} className="relative inline-flex">
              <Star aria-hidden className={cn("text-brand-primary/30", starClassName)} strokeWidth={1.5} />
              <StarHalf aria-hidden className={cn("absolute inset-0 fill-current", starClassName)} strokeWidth={1.5} />
            </span>
          );
        return hideEmpty ? null : <Star key={n} aria-hidden className={cn("text-brand-primary/30", starClassName)} strokeWidth={1.5} />;
      })}
    </span>
  );
}
