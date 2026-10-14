export interface SavedLocation {
  id: string;
  label: string; // 회사, 집 등
  name: string; // 동네
  address: string; // API.md에 없어 FE가 추가 (위치 설정 모달에 주소 표시)
  lat: number;
  lng: number;
}

export type SavedLocationInput = Omit<SavedLocation, "id">;

// 추천 응답의 location, GET /locations/reverse
export interface Neighborhood {
  name: string;
  lat: number;
  lng: number;
}

// GET /locations/search
export interface LocationSearchResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}
