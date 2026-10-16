import {
  CookingPot,
  Drumstick,
  Fish,
  Hamburger,
  ImageIcon,
  type LucideIcon,
  Pizza,
  Salad,
  Soup,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodImageProps {
  src: string | null;
  alt: string;
  className?: string;
  // 썸네일처럼 작은 곳은 placeholder 글자 · 아이콘을 작게
  compact?: boolean;
  // 식당 음식 종류 (한식 · 아시안 …). 사진이 없을 때 종류별 대체 이미지를 보여 준다
  cuisine?: string;
}

// 카카오에는 식당 사진이 없어서, 우리 사진(리뷰 · 광고)이 없는 식당은 음식 종류별 대체 이미지를 쓴다
const CUISINE_ART: Record<string, { icon: LucideIcon; tint: string }> = {
  한식: { icon: Soup, tint: "bg-[#f6e3d6] text-[#b4552d]" },
  중식: { icon: CookingPot, tint: "bg-[#f7dcd6] text-[#b23a2c]" },
  일식: { icon: Fish, tint: "bg-[#e1e9ee] text-[#3f6377]" },
  양식: { icon: Pizza, tint: "bg-[#f4e6cf] text-[#9a6418]" },
  분식: { icon: Drumstick, tint: "bg-[#f8e0e0] text-[#b04545]" },
  아시안: { icon: Wheat, tint: "bg-[#e6ecd9] text-[#5d7031]" },
  패스트푸드: { icon: Hamburger, tint: "bg-[#f5e7d2] text-[#a35c1c]" },
  "샐러드·건강식": { icon: Salad, tint: "bg-[#e0eedf] text-[#3f7a3c]" },
};
const OTHER_ART = { icon: UtensilsCrossed, tint: "bg-[#ece6df] text-[#7a6a5c]" };

export default function FoodImage({ src, alt, className, compact = false, cuisine }: FoodImageProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- 이미지 출처(CDN)가 미정이라 next/image 도메인 설정 전까지 img 사용
    return <img src={src} alt={alt} className={cn("object-cover", className)} />;
  }
  if (cuisine !== undefined) {
    const { icon: Icon, tint } = CUISINE_ART[cuisine] ?? OTHER_ART;
    return (
      <div role="img" aria-label={alt} className={cn("flex items-center justify-center overflow-hidden", tint, className)}>
        <Icon aria-hidden className={compact ? "size-6" : "size-12"} strokeWidth={1.5} />
      </div>
    );
  }
  // 종류를 모르는 곳(메뉴 등): 웜 그레이 "Food image placeholder" (메뉴 사진은 어드민에서 올린다)
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
