import { LucideIcon, Navigation, Star, Sun, ThumbsUp, TrendingUp } from "lucide-react";
import { RecommendationReason } from "@/types/recommendation";

// Figma 01 Home의 추천 이유 칩 아이콘 (sun.max.fill · hand.thumbsup · star.fill · location.fill)
export const REASON_ICONS: Record<RecommendationReason["type"], LucideIcon> = {
  weather: Sun,
  taste: ThumbsUp,
  excluded: Star,
  nearby: Navigation,
  popular: TrendingUp,
};

export const DEFAULT_RADIUS_M = 1000;
export const EXPANDED_RADIUS_M = 3000;

export const POPULAR_MODE_LABEL = "오늘 많이 찾는 메뉴";
