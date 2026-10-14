export interface ReviewPhoto {
  id: string;
  url: string;
}

export interface Review {
  id: string;
  placeId: string;
  placeName: string;
  author: { id: string; name: string };
  rating: number;
  menus: string[];
  tags: string[];
  content: string | null;
  photos: ReviewPhoto[];
  createdAt: string;
  isMine: boolean;
}

export type ReviewSort = "recent" | "rating_desc" | "rating_asc" | "photo";

export interface ReviewInput {
  rating: number; // 1~5 정수
  menus: string[]; // 최대 10
  tags: string[]; // 최대 10
  content: string | null; // 최대 500자
  photoIds: string[]; // 최대 5
}

export interface CreateReviewResponse {
  review: Review;
  placeStats: { rating: number | null; reviewCount: number };
}

// GET /restaurants/{placeId}/review-form
export interface ReviewForm {
  menus: string[];
  tags: string[];
}

// POST /uploads/review-photos — 저장소 미결정, 미리 서명된 URL 방식 가정
export interface PhotoUploadSlot {
  photoId: string;
  uploadUrl: string;
}

export type ReportReason = "abuse" | "ad" | "false_info" | "irrelevant";

export interface ReportInput {
  reason: ReportReason;
  memo: string | null; // 최대 200자
}
