import { ReportReason, ReviewSort } from "@/types/review";

// 별점을 고르면 보여 주는 한 마디 (기능명세 5: 4점 = 좋아요)
export const RATING_LABELS: Record<number, string> = {
  1: "별로예요",
  2: "아쉬워요",
  3: "괜찮아요",
  4: "좋아요",
  5: "최고예요",
};

// API.md 리뷰 규칙
export const REVIEW_LIMITS = {
  menus: 10,
  tags: 10,
  content: 500,
  photos: 5,
  reportMemo: 200,
} as const;

export const REVIEW_SORTS: { value: ReviewSort; label: string }[] = [
  { value: "recent", label: "최신순" },
  { value: "rating_desc", label: "별점 높은 순" },
  { value: "rating_asc", label: "별점 낮은 순" },
  { value: "photo", label: "사진 리뷰" },
];

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "abuse", label: "욕설·비방" },
  { value: "ad", label: "광고·홍보" },
  { value: "false_info", label: "허위 정보" },
  { value: "irrelevant", label: "관련 없는 내용" },
];
