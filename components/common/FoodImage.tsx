import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodImageProps {
  src: string | null;
  alt: string;
  className?: string;
  // 썸네일처럼 작은 곳은 placeholder 글자를 작게
  compact?: boolean;
}

// 이미지가 없으면 웜 그레이 "Food image placeholder" (개발 단계 규칙)
export default function FoodImage({ src, alt, className, compact = false }: FoodImageProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- 이미지 출처(CDN)가 미정이라 next/image 도메인 설정 전까지 img 사용
    return <img src={src} alt={alt} className={cn("object-cover", className)} />;
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "flex flex-col items-center justify-center overflow-hidden bg-surface-placeholder px-2 text-center text-labels-tertiary",
        compact ? "gap-0.5" : "gap-1.5",
        className,
      )}
    >
      <ImageIcon aria-hidden className={compact ? "size-4" : "size-5"} strokeWidth={1.75} />
      <span className={compact ? "text-[7px] leading-tight font-semibold" : "text-footnote"}>
        Food image placeholder
      </span>
    </div>
  );
}
