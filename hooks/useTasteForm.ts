"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPreferenceOptions, searchIngredients } from "@/lib/api/preferences";
import { PreferenceOptions, Preferences, SpiceLevel } from "@/types/preferences";

export const EMPTY_PREFERENCES: Preferences = { dislikedIngredients: [], allergies: [], spiceLevel: null, favoriteCuisines: [] };

type ListField = "dislikedIngredients" | "allergies" | "favoriteCuisines";

export interface TasteForm {
  value: Preferences;
  options: PreferenceOptions | null;
  toggle: (field: ListField, item: string) => void;
  setSpiceLevel: (level: SpiceLevel | null) => void;
  clearField: (field: ListField | "spiceLevel") => void;
  reset: (value: Preferences) => void;
  // 사용자가 아직 아무것도 고르지 않았을 때만 채운다 (늦게 온 응답이 고른 값을 지우지 않게)
  prefill: (value: Preferences) => void;
  // 목록에 없는 재료 검색 → 추가
  ingredientQuery: string;
  setIngredientQuery: (q: string) => void;
  ingredientResults: string[];
  addIngredient: (name: string) => void;
}

// 취향 설정 · 온보딩이 같이 쓰는 입력 상태 (기능명세 2 · 5)
export function useTasteForm(initial: Preferences = EMPTY_PREFERENCES): TasteForm {
  const [value, setValueState] = useState<Preferences>(initial);
  // 사용자가 직접 고쳤는지. 고친 뒤에는 prefill이 덮어쓰지 않는다
  const touched = useRef(false);
  const setValue: typeof setValueState = (next) => {
    touched.current = true;
    setValueState(next);
  };
  const prefill = useCallback((v: Preferences) => setValueState((cur) => (touched.current ? cur : v)), []);
  const [options, setOptions] = useState<PreferenceOptions | null>(null);
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [search, setSearch] = useState<{ q: string; items: string[] }>({ q: "", items: [] });

  useEffect(() => {
    let cancelled = false;
    getPreferenceOptions()
      .then((res) => !cancelled && setOptions(res))
      .catch(() => !cancelled && setOptions({ ingredients: [], allergies: [], cuisines: [] }));
    return () => {
      cancelled = true;
    };
  }, []);

  // 재료 검색은 입력을 멈추고 250ms 뒤에 부른다
  const q = ingredientQuery.trim();
  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchIngredients(q)
        .then((res) => !cancelled && setSearch({ q, items: res.items }))
        .catch(() => !cancelled && setSearch({ q, items: [] }));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q]);

  const ingredientResults = search.q === q && q ? search.items.filter((i) => !value.dislikedIngredients.includes(i)) : [];

  const toggle = (field: ListField, item: string) =>
    setValue((v) => ({ ...v, [field]: v[field].includes(item) ? v[field].filter((x) => x !== item) : [...v[field], item] }));

  const addIngredient = (name: string) => {
    const item = name.trim();
    if (!item) return;
    setValue((v) => (v.dislikedIngredients.includes(item) ? v : { ...v, dislikedIngredients: [...v.dislikedIngredients, item] }));
    setIngredientQuery("");
  };

  return {
    value,
    options,
    toggle,
    setSpiceLevel: (spiceLevel) => setValue((v) => ({ ...v, spiceLevel })),
    clearField: (field) => setValue((v) => ({ ...v, [field]: field === "spiceLevel" ? null : [] })),
    reset: setValueState,
    prefill,
    ingredientQuery,
    setIngredientQuery,
    ingredientResults,
    addIngredient,
  };
}

