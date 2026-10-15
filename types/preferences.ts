import { MenuSummary } from "@/types/menu";

// 0 못 먹어요 · 1 순한맛 · 2 보통 · 3 매운맛 · 4 아주 매운맛
export type SpiceLevel = 0 | 1 | 2 | 3 | 4;

export interface Preferences {
  dislikedIngredients: string[];
  allergies: string[];
  spiceLevel: SpiceLevel | null;
  favoriteCuisines: string[];
}

// PUT /me/preferences — 온보딩 끝·"나중에 할게요"에서 completeOnboarding: true
export interface PreferencesInput extends Preferences {
  completeOnboarding?: boolean;
}

// GET /preferences/options (API.md에 모양이 없어 FE에서 정함)
export interface PreferenceOptions {
  ingredients: string[];
  allergies: string[];
  cuisines: string[];
}

// POST /preferences/preview (API.md에 없어 FE에서 정함) — 저장 전 설정으로 추천이 어떻게 바뀌는지
export interface PreferencePreview {
  recommended: { menu: MenuSummary; matchPercent: number }[];
  // reason: 빠지는 이유 한 단어 (예: "고수", "갑각류 알레르기", "매운맛")
  excluded: { menu: MenuSummary; reason: string }[];
}
