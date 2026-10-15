import { Preferences } from "@/types/preferences";

// 하나라도 골랐으면 취향이 있는 것으로 본다 (서버의 personal 모드 기준과 같게)
export const hasTaste = (p: Preferences) =>
  p.dislikedIngredients.length > 0 || p.allergies.length > 0 || p.spiceLevel !== null || p.favoriteCuisines.length > 0;
