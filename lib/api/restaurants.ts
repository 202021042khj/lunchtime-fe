import { request } from "@/lib/api/client";
import { CursorPage, LatLng } from "@/types/common";
import {
  FavoritesQuery,
  Restaurant,
  RestaurantDetail,
  RestaurantListResponse,
  RestaurantQuery,
} from "@/types/restaurant";

export function getRestaurants(query: RestaurantQuery): Promise<RestaurantListResponse> {
  return request<RestaurantListResponse>("GET", "/restaurants", { query });
}

// origin을 주면 서버가 거리(distanceM · walkMinutes)를 채운다.
// 좌표만 보낸다 (현재 위치 객체의 이름 · 라벨 등이 섞이면 서버가 모르는 값으로 400)
export function getRestaurant(placeId: string, origin?: LatLng | null): Promise<RestaurantDetail> {
  const query = origin ? { lat: origin.lat, lng: origin.lng } : undefined;
  return request<RestaurantDetail>("GET", `/restaurants/${placeId}`, { query });
}

export function getFavorites(query: FavoritesQuery = {}): Promise<CursorPage<Restaurant>> {
  return request<CursorPage<Restaurant>>("GET", "/me/favorites", { query });
}

export function addFavorite(placeId: string): Promise<void> {
  return request<void>("PUT", `/me/favorites/${placeId}`);
}

export function removeFavorite(placeId: string): Promise<void> {
  return request<void>("DELETE", `/me/favorites/${placeId}`);
}

// 광고 식당일 때만 호출
export function trackSponsoredClick(placeId: string): Promise<void> {
  return request<void>("POST", `/restaurants/${placeId}/click`);
}

// "이 메뉴 안 팔아요"
export function reportMenuNotSold(placeId: string, menuId: string): Promise<void> {
  return request<void>("POST", `/restaurants/${placeId}/menu-reports`, { body: { menuId } });
}
