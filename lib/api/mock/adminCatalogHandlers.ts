// 어드민 메뉴 관리 · 광고 식당 고정 목 API.
// 메뉴 변경은 어드민 목 안에서만 반영된다 (사용자 앱 추천 목은 고정 데이터 — 백엔드에서 연결)
import { MENU_CUISINES, MENU_WEATHERS, SPONSORED_RADII } from "@/constants/admin";
import { AdminHandler, fail, page, requireAdmin } from "@/lib/api/mock/adminCommon";
import { MOCK_ADMIN_MENUS, MOCK_PLACES, MOCK_SPONSORED, MockSponsored } from "@/lib/api/mock/adminCatalogData";
import { MOCK_ALLERGENS, MOCK_INGREDIENT_DICTIONARY } from "@/lib/api/mock/data";
import { AdminMenu, MenuImportResult, MenuInput, Sponsored, SponsoredInput, SponsoredStatus } from "@/types/admin";
import { SpiceLevel } from "@/types/preferences";

const state = {
  menus: structuredClone(MOCK_ADMIN_MENUS),
  sponsored: structuredClone(MOCK_SPONSORED),
  nextId: 100,
};

const newId = (prefix: string) => `${prefix}_${++state.nextId}`;
const today = () => new Date().toISOString().slice(0, 10);

// ---------- 메뉴 ----------

function validateMenu(input: Partial<MenuInput>, selfId?: string): void {
  if (!input.name?.trim()) fail(400, "VALIDATION_FAILED", "메뉴 이름을 적어 주세요.");
  if (!input.cuisine || !(MENU_CUISINES as readonly string[]).includes(input.cuisine)) fail(400, "VALIDATION_FAILED", "종류를 골라 주세요.");
  if (!input.kakaoKeyword?.trim()) fail(400, "VALIDATION_FAILED", "카카오 검색 키워드를 적어 주세요.");
  if (!input.ingredients?.length) fail(400, "VALIDATION_FAILED", "주요 재료를 하나 이상 넣어 주세요.");
  if (input.spiceLevel === undefined || input.spiceLevel < 0 || input.spiceLevel > 4) fail(400, "VALIDATION_FAILED", "맵기를 골라 주세요.");
  const name = input.name.trim();
  if (state.menus.some((m) => m.name === name && m.id !== selfId)) fail(409, "VALIDATION_FAILED", `'${name}' 메뉴가 이미 있어요.`);
}

function cleanMenu(input: MenuInput): MenuInput {
  const list = (v: string[]) => [...new Set(v.map((x) => x.trim()).filter(Boolean))];
  return {
    ...input,
    name: input.name.trim(),
    category: input.category.trim(),
    kakaoKeyword: input.kakaoKeyword.trim(),
    kakaoCategory: input.kakaoCategory.trim(),
    ingredients: list(input.ingredients),
    tastes: list(input.tastes),
    weathers: list(input.weathers),
  };
}

// CSV 한 줄 (따옴표 안 쉼표 · "" 이스케이프 처리)
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

// 양식: 이름,종류,카테고리,재료,맛,맵기,날씨,카카오 키워드,카카오 카테고리,노출 (목록은 | 로 구분, 노출은 Y/N)
function importCsv(text: string): MenuImportResult {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const result: MenuImportResult = { created: 0, updated: 0, failed: [] };
  if (!lines.length || !lines[0].startsWith("이름")) fail(400, "VALIDATION_FAILED", "양식의 첫 줄(이름,종류,…)이 없어요. 양식을 내려받아 써 주세요.");
  const split = (v: string) => v.split("|").map((x) => x.trim()).filter(Boolean);
  const weatherValue = (v: string) => MENU_WEATHERS.find((w) => w.label === v || w.value === v)?.value ?? v;

  lines.slice(1).forEach((line, i) => {
    const [name, cuisine, category, ingredients, tastes, spice, weathers, keyword, kakaoCategory, visible] = parseCsvLine(line);
    const input: MenuInput = {
      name: name ?? "",
      cuisine: cuisine ?? "",
      category: category ?? "",
      imageUrl: null,
      ingredients: split(ingredients ?? ""),
      tastes: split(tastes ?? ""),
      spiceLevel: Number(spice) as SpiceLevel,
      weathers: split(weathers ?? "").filter((w) => w !== "상관없음").map(weatherValue),
      kakaoKeyword: keyword ?? "",
      kakaoCategory: kakaoCategory ?? "",
      visible: (visible ?? "Y").toUpperCase() !== "N",
    };
    const existing = state.menus.find((m) => m.name === input.name.trim());
    try {
      if (!Number.isInteger(input.spiceLevel)) fail(400, "VALIDATION_FAILED", "맵기는 0~4 숫자로 적어 주세요.");
      validateMenu(input, existing?.id);
      const clean = cleanMenu(input);
      // 같은 이름은 덮어쓰기
      if (existing) {
        Object.assign(existing, clean);
        result.updated += 1;
      } else {
        state.menus.push({ ...clean, id: newId("m"), recommendCount7d: 0 });
        result.created += 1;
      }
    } catch (error) {
      result.failed.push({ line: i + 2, reason: error instanceof Error ? error.message : "알 수 없는 오류" });
    }
  });
  return result;
}

// ---------- 광고 ----------

function statusOf(s: MockSponsored): SponsoredStatus {
  if (s.canceled) return "ended";
  const t = today();
  if (t < s.startDate) return "scheduled";
  if (t > s.endDate) return "ended";
  return "active";
}

function withComputed(s: MockSponsored): Sponsored {
  return {
    ...s,
    status: statusOf(s),
    targetMenuNames: s.targetMenuIds.map((id) => state.menus.find((m) => m.id === id)?.name ?? id),
  };
}

function validateSponsored(input: Partial<SponsoredInput>, needPlace: boolean): void {
  if (needPlace && !input.place?.placeId) fail(400, "VALIDATION_FAILED", "식당을 골라 주세요.");
  if (!input.targetMenuIds?.length && !input.targetCategories?.length) fail(400, "VALIDATION_FAILED", "노출 메뉴나 카테고리를 하나 이상 골라 주세요.");
  if (!input.radiusM || !(SPONSORED_RADII as readonly number[]).includes(input.radiusM)) fail(400, "VALIDATION_FAILED", "노출 반경을 골라 주세요.");
  if (!input.startDate || !input.endDate || input.endDate < input.startDate) fail(400, "VALIDATION_FAILED", "기간을 확인해 주세요. 끝나는 날이 시작일보다 빨라요.");
  if (!Number.isInteger(input.priority) || input.priority! < 1 || input.priority! > 99) fail(400, "VALIDATION_FAILED", "우선순위는 1~99로 적어 주세요.");
  if (!Number.isInteger(input.feeKrw) || input.feeKrw! < 0) fail(400, "VALIDATION_FAILED", "광고료를 확인해 주세요.");
  const h = input.hours;
  if (h && (!h.open || !h.close || h.close <= h.open)) fail(400, "VALIDATION_FAILED", "영업시간을 확인해 주세요.");
  if (h?.break && (h.break[1] <= h.break[0] || h.break[0] < h.open || h.break[1] > h.close)) fail(400, "VALIDATION_FAILED", "브레이크 시간이 영업시간 안에 있어야 해요.");
}

const STATUS_ORDER: Record<SponsoredStatus, number> = { active: 0, scheduled: 1, ended: 2 };

function findSponsored(id: string): MockSponsored {
  return state.sponsored.find((s) => s.id === id) ?? fail(404, "NOT_FOUND", "광고를 찾을 수 없어요.");
}

export function createAdminCatalogRoutes(): Record<string, AdminHandler> {
  return {
    // ---------- 메뉴 관리 ----------
    "GET /admin/menus": ({ query }) => {
      requireAdmin();
      const q = query.get("q")?.trim() ?? "";
      const cuisine = query.get("cuisine");
      const visible = query.get("visible");
      const items = state.menus
        .filter((m) => !q || m.name.includes(q) || m.ingredients.some((i) => i.includes(q)))
        .filter((m) => !cuisine || m.cuisine === cuisine)
        .filter((m) => visible === null || m.visible === (visible === "true"))
        .sort((a, b) => Number(b.visible) - Number(a.visible) || b.recommendCount7d - a.recommendCount7d);
      return { ...page(items, query), counts: { all: state.menus.length, hidden: state.menus.filter((m) => !m.visible).length } };
    },
    "POST /admin/menus": ({ body }) => {
      requireAdmin();
      const input = body as MenuInput;
      validateMenu(input);
      const created: AdminMenu = { ...cleanMenu(input), id: newId("m"), recommendCount7d: 0 };
      state.menus.push(created);
      return created;
    },
    "PATCH /admin/menus/:id": ({ params, body }) => {
      requireAdmin();
      const target = state.menus.find((m) => m.id === params.id) ?? fail(404, "NOT_FOUND", "메뉴를 찾을 수 없어요.");
      const merged = { ...target, ...(body as Partial<MenuInput>) };
      validateMenu(merged, target.id);
      Object.assign(target, cleanMenu(merged));
      return target;
    },
    "POST /admin/menus/import": async ({ body }) => {
      requireAdmin();
      const file = body instanceof FormData ? body.get("file") : null;
      if (!(file instanceof Blob)) fail(400, "VALIDATION_FAILED", "CSV 파일을 골라 주세요.");
      return importCsv(await file.text());
    },
    "GET /admin/ingredients": () => {
      requireAdmin();
      const all = [
        ...MOCK_INGREDIENT_DICTIONARY,
        ...Object.values(MOCK_ALLERGENS).flat(),
        ...state.menus.flatMap((m) => m.ingredients),
      ];
      return { items: [...new Set(all)].sort((a, b) => a.localeCompare(b, "ko")) };
    },

    // ---------- 광고 식당 고정 ----------
    "GET /admin/sponsored/summary": () => {
      requireAdmin();
      const list = state.sponsored.map(withComputed);
      const active = list.filter((s) => s.status === "active");
      const month = today().slice(0, 7);
      const impressions = active.reduce((a, s) => a + s.impressions, 0);
      const clicks = active.reduce((a, s) => a + s.clicks, 0);
      return {
        active: active.length,
        // 이번 달에 걸친 결제 완료 광고의 광고료 합
        monthRevenueKrw: list
          .filter((s) => s.paymentStatus === "paid" && s.startDate.slice(0, 7) <= month && s.endDate.slice(0, 7) >= month)
          .reduce((a, s) => a + s.feeKrw, 0),
        avgCtrPercent: impressions ? Math.round((clicks / impressions) * 1000) / 10 : null,
        pendingPayment: list.filter((s) => s.paymentStatus === "pending" && s.status !== "ended").length,
      };
    },
    "GET /admin/sponsored": ({ query }) => {
      requireAdmin();
      const status = query.get("status");
      const items = state.sponsored
        .map(withComputed)
        .filter((s) => !status || s.status === status)
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.priority - b.priority || b.startDate.localeCompare(a.startDate));
      return page(items, query);
    },
    "GET /admin/places/search": ({ query }) => {
      requireAdmin();
      const q = query.get("q")?.trim() ?? "";
      return { items: q ? MOCK_PLACES.filter((p) => p.name.includes(q) || p.address.includes(q)) : [] };
    },
    "POST /admin/sponsored": ({ body }) => {
      requireAdmin();
      const input = body as SponsoredInput;
      validateSponsored(input, true);
      const created: MockSponsored = { ...input, id: newId("sp"), canceled: false, impressions: 0, clicks: 0 };
      state.sponsored.push(created);
      return withComputed(created);
    },
    "PATCH /admin/sponsored/:id": ({ params, body }) => {
      requireAdmin();
      const target = findSponsored(params.id);
      if (statusOf(target) === "ended") fail(409, "VALIDATION_FAILED", "종료된 광고는 고칠 수 없어요. 재등록해 주세요.");
      const merged = { ...target, ...(body as Partial<SponsoredInput>), place: target.place };
      validateSponsored(merged, false);
      Object.assign(target, merged);
      return withComputed(target);
    },
    "POST /admin/sponsored/:id/renew": ({ params, body }) => {
      requireAdmin();
      const original = findSponsored(params.id);
      if (statusOf(original) !== "ended") fail(409, "VALIDATION_FAILED", "종료된 광고만 재등록할 수 있어요.");
      const input = { ...(body as Omit<SponsoredInput, "place">), place: original.place };
      validateSponsored(input, true);
      const created: MockSponsored = { ...input, id: newId("sp"), canceled: false, impressions: 0, clicks: 0 };
      state.sponsored.push(created);
      return withComputed(created);
    },
    "DELETE /admin/sponsored/:id": ({ params }) => {
      requireAdmin();
      const target = findSponsored(params.id);
      if (statusOf(target) === "ended") fail(409, "VALIDATION_FAILED", "이미 종료된 광고예요.");
      target.canceled = true;
    },
  };
}
