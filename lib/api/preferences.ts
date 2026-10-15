import { request } from "@/lib/api/client";
import { PreferencePreview, Preferences, PreferenceOptions, PreferencesInput } from "@/types/preferences";

export function getMyPreferences(): Promise<Preferences> {
  return request<Preferences>("GET", "/me/preferences");
}

export function saveMyPreferences(input: PreferencesInput): Promise<Preferences> {
  return request<Preferences>("PUT", "/me/preferences", { body: input });
}

export function getPreferenceOptions(): Promise<PreferenceOptions> {
  return request<PreferenceOptions>("GET", "/preferences/options");
}

// "목록에 없는 재료" 검색
export function searchIngredients(q: string): Promise<{ items: string[] }> {
  return request<{ items: string[] }>("GET", "/ingredients", { query: { q } });
}

// 취향 설정 화면의 "추천 미리보기". 로그인 없이도 부를 수 있다
export function previewPreferences(input: Preferences): Promise<PreferencePreview> {
  return request<PreferencePreview>("POST", "/preferences/preview", { body: input });
}
