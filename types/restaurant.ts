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
  // 사진 출처: review · sponsored = 이 식당 실제 사진, menu(메뉴 대표 사진) · null(사진 없음) = 예시 이미지
  imageSource: "review" | "sponsored" | "menu" | null;
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

// menuId로 검색했을 때 목록 머리말에 쓰는 메뉴 정보 (API.md에 없어 FE가 추가)
export interface SearchedMenu {
  id: string;
  name: string; // 얼큰 순두부찌개
  keyword: string; // 순두부찌개 (필터 칩, 근거 문구)
}

export interface RestaurantListResponse {
  items: Restaurant[];
  total: number;
  nextCursor: string | null;
  menu: SearchedMenu | null;
}

export interface FavoritesQuery {
  // 거리 계산 기준 (API.md에 없어 FE가 추가)
  lat?: number;
  lng?: number;
  cuisine?: string;
  sort?: "recent";
  cursor?: string;
  limit?: number;
}
