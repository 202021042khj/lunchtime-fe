import { Review } from "@/types/review";

export interface RestaurantHours {
  open: string; // "11:00"
  close: string;
  break: [string, string] | null;
  closedDays: string[]; // "sun" 등
}

// owner·review = 확인된 근거(브랜드 색 + 체크), name·keyword·category = 추정 근거(회색)
export type MenuEvidenceType = "owner" | "review" | "name" | "keyword" | "category";

export interface MenuEvidence {
  type: MenuEvidenceType;
  count: number | null; // review일 때 먹은 사람 수
  verified: boolean;
  label: string;
}

// 식당 행, 식당 카드, 지도 핀, 상세 공통
export interface Restaurant {
  placeId: string; // 카카오 장소 ID
  name: string;
  category: string;
  categoryPath: string;
  mainMenu: string | null;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  distanceM: number;
  walkMinutes: number;
  rating: number | null; // 자체 리뷰 평균, 리뷰 없으면 null
  reviewCount: number;
  openNow: boolean | null; // 광고·입점 식당만
  hours: RestaurantHours | null;
  imageUrl: string | null;
  kakaoMapUrl: string;
  isFavorite: boolean;
  sponsored: boolean;
  menuEvidence: MenuEvidence | null; // menuId 검색일 때만
}

export type RatingSummary = Record<1 | 2 | 3 | 4 | 5, number>;

export interface RestaurantDetail extends Restaurant {
  recentReviews: Review[];
  ratingSummary: RatingSummary;
}

export type RestaurantSort = "distance" | "reviews";

export interface RestaurantQuery {
  lat: number;
  lng: number;
  menuId?: string;
  q?: string;
  radiusM?: number; // 최대 3000
  minRating?: number;
  sort?: RestaurantSort;
  cursor?: string;
  limit?: number;
}

export interface RestaurantListResponse {
  items: Restaurant[];
  total: number;
  nextCursor: string | null;
}

export interface FavoritesQuery {
  cuisine?: string;
  sort?: "recent";
  cursor?: string;
  limit?: number;
}
