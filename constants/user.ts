import { SpiceLevel } from "@/types/preferences";
import { LoginProvider } from "@/types/user";

export const PROVIDER_LABELS: Record<LoginProvider, string> = {
  kakao: "카카오",
  apple: "Apple",
  google: "Google",
};

// 0 못 먹어요 · 1 순한맛 · 2 보통 · 3 매운맛 · 4 아주 매운맛 (API.md)
export const SPICE_LABELS: Record<SpiceLevel, string> = {
  0: "못 먹어요",
  1: "순한맛",
  2: "보통",
  3: "매운맛",
  4: "아주 매운맛",
};

// 찜한 식당 종류 필터 (기능명세 6)
export const FAVORITE_CUISINES = ["전체", "한식", "일식", "아시안"] as const;

// 점심 알림 시각 선택지. 알림 API가 정해지기 전까지 기기에만 저장한다
export const LUNCH_ALERT_TIMES = ["11:00", "11:30", "12:00"] as const;
