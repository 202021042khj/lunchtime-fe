import { RestaurantHours } from "@/types/restaurant";
import { Review } from "@/types/review";

export type UserStatus = "active" | "suspended" | "withdrawn";

export type SponsoredStatus = "scheduled" | "active" | "ended";
export type PaymentStatus = "pending" | "paid";

export interface SponsoredPlace {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
}

export interface Sponsored {
  id: string;
  place: SponsoredPlace;
  targetMenuIds: string[];
  targetCategories: string[];
  radiusM: number;
  startDate: string;
  endDate: string;
  hours: RestaurantHours | null;
  priority: number;
  feeKrw: number;
  paymentStatus: PaymentStatus;
  status: SponsoredStatus; // 서버가 기간으로 계산
  impressions: number;
  clicks: number;
}

export interface ReportGroup {
  review: Review;
  reasonCounts: { abuse: number; ad: number; false_info: number; irrelevant: number };
  reportCount: number;
  firstReportedAt: string;
  memos: string[];
  authorHistory: { reviewCount: number; reportCount: number; deletedCount: number };
}
