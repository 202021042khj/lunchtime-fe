import { RotateCw, Sparkles } from "lucide-react";
import FoodImage from "@/components/common/FoodImage";
import ReasonChips from "@/components/domain/ReasonChips";
import Button from "@/components/ui/button";
import { POPULAR_MODE_LABEL } from "@/constants/recommendation";
import { cn } from "@/lib/utils";
import { TodayRecommendation } from "@/types/recommendation";
import { Weather } from "@/types/weather";

interface MobileHeroSectionProps {
  today: TodayRecommendation;
  weather: Weather | null;
  isShuffling: boolean;
  onFindRestaurants: () => void;
  onShuffle: () => void;
}

// Figma: 01 Home 모바일 Hero Card (9:546). 메뉴명이 이미지 위에 올라간다
export default function MobileHeroSection({ today, weather, isShuffling, onFindRestaurants, onShuffle }: MobileHeroSectionProps) {
  const hasImage = !!today.menu.imageUrl;
  const headline = today.matchPercent !== null ? `취향 매칭 ${today.matchPercent}%` : POPULAR_MODE_LABEL;

  return (
    <section className="px-4">
      <div className="flex flex-col gap-3.5 rounded-[30px] bg-white px-2 pt-2 pb-4">
        <div className="relative h-[220px] overflow-hidden rounded-3xl">
          <FoodImage src={today.menu.imageUrl} alt={today.menu.name} className="absolute inset-0 size-full pb-6" />
          {/* 실제 사진 위에서는 글자가 보이도록 아래쪽을 어둡게 */}
          {hasImage && <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />}
          <span className="absolute top-3.5 left-4 flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1.5 text-footnote font-semibold text-labels-primary">
            <Sparkles aria-hidden className="size-3.5" />
            오늘의 추천
          </span>
          <div className={cn("absolute bottom-[18px] left-4 flex flex-col gap-0.5", hasImage ? "text-white" : "text-labels-primary")}>
            <h1 className="text-title-1 font-bold">{today.menu.name}</h1>
            <p className="text-subheadline font-semibold">
              {headline} · 주변 {today.nearbyCount}곳
            </p>
          </div>
        </div>

        {/* "주변 n곳"은 이미지 위 문구에 있으므로 칩에서 뺀다 */}
        <ReasonChips reasons={today.reasons} weather={weather} variant="plain" hideTypes={["nearby"]} className="px-2" />

        <div className="flex items-center gap-2.5 px-2">
          <Button color="brand" shape="round" className="flex-1 px-5 text-[17px] font-medium" onClick={onFindRestaurants}>
            근처 식당 찾기
          </Button>
          <Button
            variant="outlined"
            color="brand"
            shape="round"
            size="icon"
            aria-label="다른 메뉴 추천"
            className="size-[50px] shrink-0"
            isLoading={isShuffling}
            onClick={onShuffle}
          >
            <RotateCw aria-hidden className="size-6" />
          </Button>
        </div>
      </div>
    </section>
  );
}
