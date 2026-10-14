import { Neighborhood } from "@/types/location";
import { MenuSummary } from "@/types/menu";
import { Restaurant } from "@/types/restaurant";
import { Weather } from "@/types/weather";

export type RecommendationMode = "personal" | "popular";

export interface RecommendationReason {
  type: "weather" | "taste" | "excluded" | "nearby" | "popular";
  label: string;
}

export interface TodayRecommendation {
  menu: MenuSummary;
  matchPercent: number | null; // popular 모드면 null
  popularRank: number | null; // popular 모드에서만
  description: string;
  reasons: RecommendationReason[];
  nearbyCount: number;
  restaurants: Restaurant[]; // 4개, 광고 식당이 맨 앞
}

export interface AlternativeRecommendation {
  menu: MenuSummary;
  matchPercent: number | null;
  popularRank: number | null;
  nearbyCount: number;
}

export interface RecommendationResponse {
  mode: RecommendationMode;
  promptTaste: boolean; // 홈에 [취향 알려주기] 배너
  location: Neighborhood;
  weather: Weather | null; // 조회 실패 시 null
  today: TodayRecommendation | null; // 모든 후보가 근처 0곳이면 null
  alternatives: AlternativeRecommendation[];
  suggestRadiusM: number | null; // today가 null일 때 3000
}

export interface RecommendationQuery {
  lat: number;
  lng: number;
  radiusM?: number;
  excludeMenuIds?: string[];
}

export type SearchType = "all" | "menu" | "restaurant";

export interface SearchQuery {
  q: string;
  lat: number;
  lng: number;
  type?: SearchType;
}

export interface MenuSearchItem {
  menu: MenuSummary;
  matchPercent: number | null;
  nearbyCount: number;
}

export interface SearchResponse {
  menus: MenuSearchItem[];
  restaurants: Restaurant[];
}
