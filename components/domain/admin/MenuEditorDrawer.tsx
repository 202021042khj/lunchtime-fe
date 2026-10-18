"use client";

import { X } from "lucide-react";
import { overlay } from "overlay-kit";
import { KeyboardEvent, useEffect, useState } from "react";
import SelectChip from "@/components/common/SelectChip";
import AdminDrawer, { AdminTag, DRAWER_INPUT, DrawerField } from "@/components/domain/admin/AdminDrawer";
import ImageUploadField from "@/components/domain/admin/ImageUploadField";
import Button from "@/components/ui/button";
import { notify } from "@/components/ui/notify/notify-utils";
import { MENU_CUISINES, MENU_TASTES, MENU_WEATHERS } from "@/constants/admin";
import { SPICE_LABELS } from "@/constants/user";
import { createMenu, getAdminIngredients, updateMenu } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { AdminMenu, MenuInput } from "@/types/admin";
import { SpiceLevel } from "@/types/preferences";

const EMPTY: MenuInput = {
  name: "",
  cuisine: "",
  category: "",
  imageUrl: null,
  ingredients: [],
  tastes: [],
  spiceLevel: 0,
  weathers: [],
  kakaoKeyword: "",
  kakaoCategory: "",
  visible: true,
};

// 메뉴 추가 · 편집 패널을 열고, 저장하면 저장된 메뉴를 돌려준다 (닫으면 null)
export function openMenuEditor(menu: AdminMenu | null): Promise<AdminMenu | null> {
  return overlay.openAsync<AdminMenu | null>(({ isOpen, close, unmount }) => (
    <MenuEditorDrawer
      isOpen={isOpen}
      menu={menu}
      onDone={(saved) => {
        close(saved);
        window.setTimeout(unmount, 250);
      }}
    />
  ));
}

// 저장할 때 보낼 칸만 (목록 행의 id · recommendCount7d가 섞이면 서버가 모르는 필드로 거절)
const toInput = ({ name, cuisine, category, imageUrl, ingredients, tastes, spiceLevel, weathers, kakaoKeyword, kakaoCategory, visible }: MenuInput): MenuInput => ({
  name,
  cuisine,
  category,
  imageUrl,
  ingredients,
  tastes,
  spiceLevel,
  weathers,
  kakaoKeyword,
  kakaoCategory,
  visible,
});

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

// 메뉴 편집 (Figma 시안 없음 — A2 광고 등록 패널 스타일). 재료는 취향 사전과 같은 이름이어야 제외 필터에 걸린다
export default function MenuEditorDrawer({ isOpen, menu, onDone }: { isOpen: boolean; menu: AdminMenu | null; onDone: (saved: AdminMenu | null) => void }) {
  const [form, setForm] = useState<MenuInput>(() => (menu ? toInput(menu) : EMPTY));
  const [uploading, setUploading] = useState(false);
  const [ingredientDraft, setIngredientDraft] = useState("");
  const [dictionary, setDictionary] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminIngredients()
      .then((res) => setDictionary(res.items))
      .catch(() => {});
  }, []);

  const set = <K extends keyof MenuInput>(key: K, value: MenuInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  };

  const addIngredient = (raw: string) => {
    const v = raw.trim();
    if (v && !form.ingredients.includes(v)) set("ingredients", [...form.ingredients, v]);
    setIngredientDraft("");
  };
  const onIngredientKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredient(ingredientDraft);
    }
  };
  const suggestions = ingredientDraft.trim()
    ? dictionary.filter((d) => d.includes(ingredientDraft.trim()) && !form.ingredients.includes(d)).slice(0, 6)
    : [];
  const unknown = dictionary.length ? form.ingredients.filter((i) => !dictionary.includes(i)) : [];

  const save = async () => {
    const problem = !form.name.trim()
      ? "메뉴 이름을 적어 주세요."
      : !form.cuisine
        ? "종류를 골라 주세요."
        : !form.ingredients.length
          ? "주요 재료를 하나 이상 넣어 주세요."
          : !form.kakaoKeyword.trim()
            ? "카카오 검색 키워드를 적어 주세요."
            : null;
    if (problem) return setError(problem);
    setSaving(true);
    try {
      const saved = menu ? await updateMenu(menu.id, toInput(form)) : await createMenu(toInput(form));
      notify.success(menu ? `'${saved.name}' 메뉴를 고쳤어요.` : `'${saved.name}' 메뉴를 추가했어요.`);
      onDone(saved);
    } catch (err) {
      setSaving(false);
      setError(err instanceof ApiError ? err.message : "저장하지 못했어요. 다시 시도해 주세요.");
    }
  };

  return (
    <AdminDrawer
      isOpen={isOpen}
      title={menu ? "메뉴 편집" : "메뉴 추가"}
      onClose={() => onDone(null)}
      footer={
        <>
          {error ? <p role="alert" className="min-w-0 flex-1 text-footnote text-accents-red">{error}</p> : <span className="flex-1" />}
          <Button type="button" variant="outlined" color="brand" shape="round" size="sm" onClick={() => onDone(null)} className="font-semibold">
            취소
          </Button>
          <Button type="button" color="brand" shape="round" size="sm" isLoading={saving} disabled={uploading} onClick={save} className="font-semibold">
            {menu ? "저장하기" : "추가하기"}
          </Button>
        </>
      }
    >
      <DrawerField label="메뉴 사진" hint="추천 카드 · 사진 없는 식당에 쓰여요">
        <ImageUploadField value={form.imageUrl} onChange={(url) => set("imageUrl", url)} purpose="menu" label="메뉴 사진" onUploadingChange={setUploading} />
      </DrawerField>

      <DrawerField label="메뉴 이름" htmlFor="menu-name">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="예: 얼큰 순두부찌개" id="menu-name" className={DRAWER_INPUT} />
      </DrawerField>

      <DrawerField label="종류" hint="취향의 '좋아하는 음식 종류'와 같은 값">
        <div className="flex flex-wrap gap-2">
          {MENU_CUISINES.map((c) => (
            <SelectChip key={c} label={c} selected={form.cuisine === c} onToggle={() => set("cuisine", c)} />
          ))}
        </div>
      </DrawerField>

      <DrawerField label="세부 카테고리" hint="광고 노출 카테고리에 쓰여요" htmlFor="menu-category">
        <input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="예: 찌개류" id="menu-category" className={DRAWER_INPUT} />
      </DrawerField>

      <DrawerField label="주요 재료" hint="취향 제외 필터에 그대로 쓰여요">
        <div className="flex flex-wrap gap-1.5">
          {form.ingredients.map((i) => (
            <span
              key={i}
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-full pr-1.5 pl-3 text-footnote",
                unknown.includes(i) ? "bg-[rgba(255,149,0,0.14)] text-[#b25e00]" : "bg-brand-primary-tint text-brand-primary",
              )}
            >
              {i}
              <button type="button" aria-label={`${i} 빼기`} onClick={() => set("ingredients", form.ingredients.filter((x) => x !== i))}>
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={ingredientDraft}
          onChange={(e) => setIngredientDraft(e.target.value)}
          onKeyDown={onIngredientKey}
          placeholder="재료 입력 후 Enter"
          aria-label="재료 추가"
          className={DRAWER_INPUT}
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => addIngredient(s)} className="rounded-full border border-dashed border-chip-border px-3 py-1 text-footnote text-labels-primary">
                + {s}
              </button>
            ))}
          </div>
        )}
        {unknown.length > 0 && (
          <p className="text-footnote text-[#b25e00]">사전에 없는 재료예요: {unknown.join(", ")} — 취향 필터에 걸리지 않을 수 있어요.</p>
        )}
      </DrawerField>

      <DrawerField label="맛">
        <div className="flex flex-wrap gap-2">
          {MENU_TASTES.map((t) => (
            <SelectChip key={t} label={t} selected={form.tastes.includes(t)} onToggle={() => set("tastes", toggle(form.tastes, t))} />
          ))}
        </div>
      </DrawerField>

      <DrawerField label="맵기">
        <div role="radiogroup" aria-label="맵기" className="flex rounded-full bg-fills-quaternary p-0.5">
          {([0, 1, 2, 3, 4] as SpiceLevel[]).map((lv) => (
            <button
              key={lv}
              type="button"
              role="radio"
              aria-checked={form.spiceLevel === lv}
              onClick={() => set("spiceLevel", lv)}
              className={cn(
                "min-h-9 flex-1 rounded-full px-1 text-footnote break-keep",
                form.spiceLevel === lv ? "bg-white font-semibold text-labels-primary shadow-[0_3px_8px_rgba(0,0,0,0.08)]" : "text-labels-secondary",
              )}
            >
              {SPICE_LABELS[lv]}
            </button>
          ))}
        </div>
      </DrawerField>

      <DrawerField label="어울리는 날씨" hint="안 고르면 상관없음">
        <div className="flex flex-wrap gap-2">
          {MENU_WEATHERS.map((w) => (
            <SelectChip key={w.value} label={w.label} selected={form.weathers.includes(w.value)} onToggle={() => set("weathers", toggle(form.weathers, w.value))} />
          ))}
        </div>
      </DrawerField>

      <div className="grid grid-cols-2 gap-3">
        <DrawerField label="카카오 검색 키워드" htmlFor="menu-keyword">
          <input value={form.kakaoKeyword} onChange={(e) => set("kakaoKeyword", e.target.value)} placeholder="예: 순두부찌개" id="menu-keyword" className={DRAWER_INPUT} />
        </DrawerField>
        <DrawerField label="카카오 카테고리" htmlFor="menu-kakao-category">
          <input value={form.kakaoCategory} onChange={(e) => set("kakaoCategory", e.target.value)} placeholder="예: 찌개,전골" id="menu-kakao-category" className={DRAWER_INPUT} />
        </DrawerField>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-fills-quaternary px-3.5 py-3">
        <input type="checkbox" checked={form.visible} onChange={(e) => set("visible", e.target.checked)} className="size-[18px] accent-brand-primary" />
        <span className="flex flex-col">
          <span className="text-subheadline font-semibold text-labels-primary">앱 추천에 노출</span>
          <span className="text-footnote text-labels-secondary">끄면 추천 · 검색에 나오지 않아요 (숨김)</span>
        </span>
        <span className="flex-1" />
        <AdminTag label={form.visible ? "노출" : "숨김"} />
      </label>
    </AdminDrawer>
  );
}
