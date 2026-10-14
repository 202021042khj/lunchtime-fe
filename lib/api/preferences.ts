import { request } from "@/lib/api/client";
import { Preferences, PreferenceOptions, PreferencesInput } from "@/types/preferences";

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
