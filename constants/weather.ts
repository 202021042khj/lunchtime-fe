import { Cloud, CloudRain, CloudSnow, CloudSun, LucideIcon, Snowflake, Sun } from "lucide-react";
import { WeatherCondition } from "@/types/weather";

// SF Symbols 대신 lucide 아이콘
export const WEATHER_ICONS: Record<WeatherCondition, LucideIcon> = {
  clear: Sun,
  cloudy: CloudSun,
  overcast: Cloud,
  rain: CloudRain,
  sleet: CloudSnow,
  snow: Snowflake,
};
