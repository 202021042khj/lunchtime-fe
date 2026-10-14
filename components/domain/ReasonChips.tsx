import Chip from "@/components/common/Chip";
import { REASON_ICONS } from "@/constants/recommendation";
import { WEATHER_ICONS } from "@/constants/weather";
import { cn } from "@/lib/utils";
import { RecommendationReason } from "@/types/recommendation";
import { Weather } from "@/types/weather";

interface ReasonChipsProps {
  reasons: RecommendationReason[];
  weather: Weather | null;
  // glass: 유리 카드 위(데스크톱 히어로), plain: 흰 카드 위(모바일)
  variant: "glass" | "plain";
  hideTypes?: RecommendationReason["type"][];
  className?: string;
}

// SF Symbol이 .fill인 것만 채운다 (sun.max.fill · star.fill · location.fill)
const FILLED_TYPES: RecommendationReason["type"][] = ["weather", "excluded", "nearby"];

// 추천 이유 태그. 날씨 이유는 지금 날씨 아이콘을 쓴다
export default function ReasonChips({ reasons, weather, variant, hideTypes = [], className }: ReasonChipsProps) {
  const visible = reasons.filter((r) => !hideTypes.includes(r.type));
  if (!visible.length) return null;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {visible.map((reason) => {
        const Icon = reason.type === "weather" && weather ? WEATHER_ICONS[weather.condition] : REASON_ICONS[reason.type];
        return (
          <li key={`${reason.type}-${reason.label}`}>
            <Chip
              icon={<Icon className={cn(FILLED_TYPES.includes(reason.type) && "fill-current")} />}
              label={reason.label}
              className={variant === "glass" ? "border border-white/90 bg-white/70" : undefined}
            />
          </li>
        );
      })}
    </ul>
  );
}
