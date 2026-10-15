import { SponsoredStatus } from "@/types/admin";

// 메뉴 종류 (취향 "좋아하는 음식 종류"와 같은 값 · Figma A3 필터 칩)
export const MENU_CUISINES = ["한식", "중식", "일식", "양식", "분식", "아시안", "패스트푸드", "샐러드·건강식"] as const;
// 메뉴 관리 필터 칩에 보이는 종류 (Figma A3)
export const MENU_CUISINE_FILTERS = ["한식", "중식", "일식", "양식", "아시안"] as const;

// 맛 태그 (Figma A3 표에 나온 값 기준)
export const MENU_TASTES = ["매운맛", "아주 매운맛", "매콤", "얼큰", "국물", "담백", "고소", "튀김", "시원함", "든든함", "얼얼함", "달콤"] as const;

// 어울리는 날씨 (Menu.weathers 값 → 표시). 비어 있으면 "상관없음"
export const MENU_WEATHERS = [
  { value: "clear", label: "맑음" },
  { value: "hot", label: "더움" },
  { value: "cold", label: "쌀쌀함" },
  { value: "rain", label: "비" },
  { value: "snow", label: "눈" },
] as const;
export const weatherLabel = (value: string) => MENU_WEATHERS.find((w) => w.value === value)?.label ?? value;

// 광고 노출 반경 (기능명세: 500m · 1km · 2km · 3km)
export const SPONSORED_RADII = [500, 1000, 2000, 3000] as const;

// 휴무일 (RestaurantHours.closedDays 값)
export const CLOSED_DAYS = [
  { value: "mon", label: "월" },
  { value: "tue", label: "화" },
  { value: "wed", label: "수" },
  { value: "thu", label: "목" },
  { value: "fri", label: "금" },
  { value: "sat", label: "토" },
  { value: "sun", label: "일" },
  { value: "holiday", label: "공휴일" },
] as const;

export const SPONSORED_STATUS: Record<SponsoredStatus, { label: string; tone: "green" | "gray" | "brand" }> = {
  active: { label: "진행 중", tone: "green" },
  scheduled: { label: "예약", tone: "brand" },
  ended: { label: "종료", tone: "gray" },
};
