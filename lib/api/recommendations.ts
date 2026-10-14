import { request } from "@/lib/api/client";
import { LatLng } from "@/types/common";
import { RecommendationQuery, RecommendationResponse, SearchQuery, SearchResponse } from "@/types/recommendation";
import { Weather } from "@/types/weather";

export function getRecommendations(query: RecommendationQuery): Promise<RecommendationResponse> {
  return request<RecommendationResponse>("GET", "/recommendations", { query });
}

export function getWeather(coord: LatLng): Promise<Weather> {
  return request<Weather>("GET", "/weather", { query: coord });
}

// 메뉴바 통합 검색
export function search(query: SearchQuery): Promise<SearchResponse> {
  return request<SearchResponse>("GET", "/search", { query });
}
