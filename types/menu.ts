import { SpiceLevel } from "@/types/preferences";

// 추천·검색 카드에 쓰는 짧은 모양
export interface MenuSummary {
  id: string;
  name: string;
  imageUrl: string | null;
}

// 메뉴 마스터 (어드민 메뉴 관리)
export interface Menu extends MenuSummary {
  // 종류: 한식 · 중식 · 일식 · 양식 · 분식 · 아시안 … (취향 "좋아하는 음식 종류"와 같은 값)
  cuisine: string;
  // 세부 카테고리: 찌개류 · 면류 · 국밥 … (광고 노출 카테고리에 쓴다)
  category: string;
  ingredients: string[];
  tastes: string[];
  spiceLevel: SpiceLevel;
  weathers: string[];
  kakaoKeyword: string;
  kakaoCategory: string;
  visible: boolean;
}
