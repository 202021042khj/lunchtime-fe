import { AlertTriangle, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import LogoMark from "@/components/common/LogoMark";
import { ROUTES } from "@/constants/navigation";
import { WEATHER_ICONS } from "@/constants/weather";
import { formatHighLow, formatWeather, joinMeta } from "@/lib/format";
import { Weather } from "@/types/weather";

interface MobileHeaderSectionProps {
  // undefined = 아직 모름(로딩), null = 조회 실패
  weather: Weather | null | undefined;
}

// Figma: 01 Home 모바일 Header (9:519) — 로고, 그 아래 날씨 한 줄, 오른쪽 취향 설정 버튼
export default function MobileHeaderSection({ weather }: MobileHeaderSectionProps) {
  const WeatherIcon = weather ? WEATHER_ICONS[weather.condition] : AlertTriangle;

  return (
    <header className="flex items-center justify-between px-4 pt-2">
      <div className="flex flex-col gap-1.5">
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <LogoMark />
          <span className="text-title-3 font-semibold text-labels-primary">lunchtime</span>
        </Link>
        {weather !== undefined && (
          <p className="flex items-center gap-1 text-subheadline font-semibold text-labels-secondary">
            <WeatherIcon aria-hidden className={weather ? "size-4 fill-brand-primary text-brand-primary" : "size-4"} />
            {weather ? joinMeta([formatWeather(weather), formatHighLow(weather)]) : "날씨 정보를 불러오지 못했어요"}
          </p>
        )}
      </div>
      <Link
        href={ROUTES.taste}
        aria-label="취향 설정"
        className="flex size-12 items-center justify-center rounded-full border border-white/90 bg-white/60 shadow-[0_2px_8px_rgba(31,26,89,0.06)]"
      >
        <SlidersHorizontal aria-hidden className="size-5 text-labels-primary" />
      </Link>
    </header>
  );
}
