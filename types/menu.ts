import { SpiceLevel } from "@/types/preferences";

// 추천·검색 카드에 쓰는 짧은 모양
export interface MenuSummary {
  id: string;
  name: string;
  imageUrl: string | null;
}

// 메뉴 마스터 (어드민 메뉴 관리)
export interface Menu extends MenuSummary {
  category: string;
  ingredients: string[];
  tastes: string[];
  spiceLevel: SpiceLevel;
  weathers: string[];
  kakaoKeyword: string;
  kakaoCategory: string;
  visible: boolean;
}
