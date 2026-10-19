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
  // 이 식당의 실제 사진이 아닐 때(메뉴 대표 사진 · 종류별 대체 이미지) 알림. caption = 큰 사진 아래 구석 문구, badge = 썸네일 모서리 "예시"
  exampleNotice?: "caption" | "badge" | false;
}

export const EXAMPLE_IMAGE_NOTICE = "예시 이미지로, 실제 식당 음식과 다를 수 있어요";

// 리뷰 · 광고(사장님 제공) 사진만 이 식당의 실제 사진이다
export const isExampleImage = (r: { imageSource: "review" | "sponsored" | "menu" | null }) =>
  r.imageSource !== "review" && r.imageSource !== "sponsored";

// 카카오에는 식당 사진이 없어서, 우리 사진(리뷰 · 광고)이 없는 식당은 음식 종류별 대체 이미지를 쓴다.
// 일러스트 public/cuisine/{file}.webp가 있으면 그것을, 없으면 아이콘을 보여 준다 (파일 이름은 주소 인코딩 문제가 없게 영문)
const CUISINE_ART: Record<string, { file: string; icon: LucideIcon; tint: string }> = {
  한식: { file: "korean", icon: Soup, tint: "bg-[#f6e3d6] text-[#b4552d]" },
  중식: { file: "chinese", icon: CookingPot, tint: "bg-[#f7dcd6] text-[#b23a2c]" },
  일식: { file: "japanese", icon: Fish, tint: "bg-[#e1e9ee] text-[#3f6377]" },
  양식: { file: "western", icon: Pizza, tint: "bg-[#f4e6cf] text-[#9a6418]" },
  분식: { file: "snack", icon: Drumstick, tint: "bg-[#f8e0e0] text-[#b04545]" },
  아시안: { file: "asian", icon: Wheat, tint: "bg-[#e6ecd9] text-[#5d7031]" },
  패스트푸드: { file: "fastfood", icon: Hamburger, tint: "bg-[#f5e7d2] text-[#a35c1c]" },
  "샐러드·건강식": { file: "salad", icon: Salad, tint: "bg-[#e0eedf] text-[#3f7a3c]" },
};
const OTHER_ART = { file: "other", icon: UtensilsCrossed, tint: "bg-[#ece6df] text-[#7a6a5c]" };

export default function FoodImage({ exampleNotice, className, ...props }: FoodImageProps) {
  if (!exampleNotice) return <FoodArt className={className} {...props} />;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <FoodArt className="size-full" {...props} />
      {exampleNotice === "caption" ? (
        <span className="absolute right-2 bottom-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] leading-tight text-white">
          {EXAMPLE_IMAGE_NOTICE}
        </span>
      ) : (
        <span
          title={EXAMPLE_IMAGE_NOTICE}
          className="absolute top-1 left-1 rounded bg-black/45 px-1 text-[9px] leading-[14px] font-semibold text-white"
        >
          예시
        </span>
      )}
    </div>
  );
}

function FoodArt({ src, alt, className, compact = false, cuisine }: Omit<FoodImageProps, "exampleNotice">) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- 저장소 주소가 환경마다 달라 next/image 도메인 설정 대신 img 사용
    return <img src={src} alt={alt} className={cn("object-cover", className)} />;
  }
  if (cuisine !== undefined) {
    const { file, icon: Icon, tint } = CUISINE_ART[cuisine] ?? OTHER_ART;
    // 아이콘 위에 일러스트를 배경으로 덮는다. 파일이 없으면 배경이 비어 아래 아이콘이 그대로 보인다 (JS 없이, 깨진 이미지 표시 없이)
    return (
      <div role="img" aria-label={alt} className={cn("relative flex items-center justify-center overflow-hidden", tint, className)}>
        <Icon aria-hidden className={compact ? "size-6" : "size-12"} strokeWidth={1.5} />
        <span aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(/cuisine/${file}.webp)` }} />
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
