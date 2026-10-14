import { request } from "@/lib/api/client";
import { CursorPage } from "@/types/common";
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

export function getRestaurant(placeId: string): Promise<RestaurantDetail> {
  return request<RestaurantDetail>("GET", `/restaurants/${placeId}`);
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
