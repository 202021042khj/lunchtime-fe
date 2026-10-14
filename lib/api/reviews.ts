import { request } from "@/lib/api/client";
import { CursorPage } from "@/types/common";
import {
  CreateReviewResponse,
  PhotoUploadSlot,
  ReportInput,
  Review,
  ReviewForm,
  ReviewInput,
  ReviewSort,
} from "@/types/review";

export function getRestaurantReviews(
  placeId: string,
  query: { sort?: ReviewSort; cursor?: string; limit?: number } = {},
): Promise<CursorPage<Review>> {
  return request<CursorPage<Review>>("GET", `/restaurants/${placeId}/reviews`, { query });
}

export function getReviewForm(placeId: string): Promise<ReviewForm> {
  return request<ReviewForm>("GET", `/restaurants/${placeId}/review-form`);
}

// 저장소 미결정: 미리 서명된 URL을 받아 앱이 직접 올리는 방식 가정
export function requestPhotoUploads(count: number): Promise<{ items: PhotoUploadSlot[] }> {
  return request<{ items: PhotoUploadSlot[] }>("POST", "/uploads/review-photos", { body: { count } });
}

export function createReview(placeId: string, input: ReviewInput): Promise<CreateReviewResponse> {
  return request<CreateReviewResponse>("POST", `/restaurants/${placeId}/reviews`, { body: input });
}

export function getMyReviews(query: { cursor?: string; limit?: number } = {}): Promise<CursorPage<Review>> {
  return request<CursorPage<Review>>("GET", "/me/reviews", { query });
}

export function updateReview(id: string, input: Partial<ReviewInput>): Promise<CreateReviewResponse> {
  return request<CreateReviewResponse>("PATCH", `/reviews/${id}`, { body: input });
}

export function deleteReview(id: string): Promise<void> {
  return request<void>("DELETE", `/reviews/${id}`);
}

export function reportReview(id: string, input: ReportInput): Promise<void> {
  return request<void>("POST", `/reviews/${id}/reports`, { body: input });
}
