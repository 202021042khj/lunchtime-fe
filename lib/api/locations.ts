import { request } from "@/lib/api/client";
import { LatLng } from "@/types/common";
import { LocationSearchResult, Neighborhood, SavedLocation, SavedLocationInput } from "@/types/location";

export function getSavedLocations(): Promise<{ items: SavedLocation[] }> {
  return request<{ items: SavedLocation[] }>("GET", "/me/locations");
}

export function addSavedLocation(input: SavedLocationInput): Promise<SavedLocation> {
  return request<SavedLocation>("POST", "/me/locations", { body: input });
}

export function deleteSavedLocation(id: string): Promise<void> {
  return request<void>("DELETE", `/me/locations/${id}`);
}

// 최근 검색어는 서버가 아니라 기기에만 저장
export function searchLocations(q: string): Promise<{ items: LocationSearchResult[] }> {
  return request<{ items: LocationSearchResult[] }>("GET", "/locations/search", { query: { q } });
}

export function reverseGeocode(coord: LatLng): Promise<Neighborhood> {
  return request<Neighborhood>("GET", "/locations/reverse", { query: { lat: coord.lat, lng: coord.lng } });
}
