import { AlertTriangle, Sparkles } from "lucide-react";
import FoodImage from "@/components/common/FoodImage";
import ReasonChips from "@/components/domain/ReasonChips";
import Button from "@/components/ui/button";
import { POPULAR_MODE_LABEL } from "@/constants/recommendation";
import { WEATHER_ICONS } from "@/constants/weather";
import { formatWeather } from "@/lib/format";
import { TodayRecommendation } from "@/types/recommendation";
import { Weather } from "@/types/weather";

interface DesktopHeroSectionProps {
  today: TodayRecommendation;
  weather: Weather | null;
  locationName: string;
  isShuffling: boolean;
  onFindRestaurants: () => void;
  onShuffle: () => void;
}

// Figma: 01 Home · Desktop Hero Card (12:213)
export default function DesktopHeroSection({ today, weather, locationName, isShuffling, onFindRestaurants, onShuffle }: DesktopHeroSectionProps) {
  const WeatherIcon = weather ? WEATHER_ICONS[weather.condition] : AlertTriangle;

  return (
    <section className="flex items-center gap-7 rounded-[32px] border border-white/80 bg-glass-card py-3 pr-8 pl-3 shadow-[0_8px_32px_rgba(31,26,89,0.08)]">
      <div className="relative h-[300px] w-[380px] shrink-0 overflow-hidden rounded-3xl">
        <FoodImage src={today.menu.imageUrl} alt={today.menu.name} className="absolute inset-0 size-full pt-4" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 rounded-full border border-white/90 bg-white/85 px-2.5 py-1.5 text-footnote font-semibold text-labels-primary">
            <Sparkles aria-hidden className="size-3.5" />
            오늘의 추천
          </span>
          <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-white/85 px-3 py-[7px] text-[13px] font-semibold text-labels-primary">
            <WeatherIcon aria-hidden className={weather ? "size-3.5 shrink-0 fill-current" : "size-3.5 shrink-0"} />
            <span className="truncate">{weather ? `${formatWeather(weather)} · ${locationName}` : "날씨 정보를 불러오지 못했어요"}</span>
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-subheadline font-semibold text-brand-primary">
            {today.matchPercent !== null ? `취향 매칭 ${today.matchPercent}%` : POPULAR_MODE_LABEL}
          </p>
          <h1 className="text-title-1 font-bold text-labels-primary">{today.menu.name}</h1>
          <p className="text-body text-labels-secondary">{today.description}</p>
        </div>
        <ReasonChips reasons={today.reasons} weather={weather} variant="glass" />
        <div className="flex flex-wrap items-center gap-2.5">
          <Button color="brand" shape="round" className="px-5 text-[17px] font-medium" onClick={onFindRestaurants}>
            근처 식당 찾기
          </Button>
          <Button
            variant="outlined"
            color="brand"
            shape="round"
            className="px-5 text-[17px] font-medium"
            isLoading={isShuffling}
            onClick={onShuffle}
          >
            다른 메뉴 추천
          </Button>
        </div>
      </div>
    </section>
  );
}
