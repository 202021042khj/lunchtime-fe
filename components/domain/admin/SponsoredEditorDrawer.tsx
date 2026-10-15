"use client";

import { Check, Search } from "lucide-react";
import { overlay } from "overlay-kit";
import { useEffect, useState } from "react";
import { confirm } from "@/components/common/ConfirmDialog";
import SelectChip from "@/components/common/SelectChip";
import AdminDrawer, { DRAWER_INPUT, DrawerField } from "@/components/domain/admin/AdminDrawer";
import Button from "@/components/ui/button";
import { notify } from "@/components/ui/notify/notify-utils";
import { CLOSED_DAYS, MENU_CUISINES, SPONSORED_RADII } from "@/constants/admin";
import { cancelSponsored, createSponsored, getAdminMenus, renewSponsored, searchPlaces, updateSponsored } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { formatRadius } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AdminMenu, PaymentStatus, Sponsored, SponsoredInput, SponsoredPlace } from "@/types/admin";

export type SponsoredEditorMode = "new" | "edit" | "renew";

// 광고 추가 · 수정 · 재등록 패널. 바뀐 게 있으면 true
export function openSponsoredEditor(mode: SponsoredEditorMode, sponsored: Sponsored | null = null): Promise<boolean> {
  return overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
    <SponsoredEditorDrawer
      isOpen={isOpen}
      mode={mode}
      sponsored={sponsored}
      onDone={(changed) => {
        close(changed);
        window.setTimeout(unmount, 250);
      }}
    />
  ));
}

const DAY = 24 * 60 * 60 * 1000;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => isoDate(new Date(new Date(iso).getTime() + days * DAY));
const daysBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY);

// "한식 > 찌개,전골" → 한식, "아시아음식 > 베트남음식" → 아시안
function cuisineOfPlace(place: SponsoredPlace | null): string | null {
  const top = place?.category.split(">")[0].trim() ?? "";
  if (top.startsWith("아시아")) return "아시안";
  return (MENU_CUISINES as readonly string[]).includes(top) ? top : null;
}

interface FormState {
  place: SponsoredPlace | null;
  targetMenuIds: string[];
  targetCategories: string[];
  radiusM: number;
  startDate: string;
  endDate: string;
  hoursOn: boolean;
  open: string;
  close: string;
  breakOn: boolean;
  breakStart: string;
  breakEnd: string;
  closedDays: string[];
  priority: string;
  fee: string; // 숫자만
  paymentStatus: PaymentStatus;
}

function initialForm(mode: SponsoredEditorMode, s: Sponsored | null): FormState {
  const today = isoDate(new Date());
  if (!s) {
    return {
      place: null, targetMenuIds: [], targetCategories: [], radiusM: 1000, startDate: today, endDate: addDays(today, 29),
      hoursOn: true, open: "11:00", close: "21:00", breakOn: false, breakStart: "15:00", breakEnd: "16:30", closedDays: [],
      priority: "1", fee: "", paymentStatus: "pending",
    };
  }
  // 재등록: 조건은 그대로, 기간은 오늘부터 같은 길이로, 결제는 다시 대기
  const renew = mode === "renew";
  return {
    place: s.place,
    targetMenuIds: s.targetMenuIds,
    targetCategories: s.targetCategories,
    radiusM: s.radiusM,
    startDate: renew ? today : s.startDate,
    endDate: renew ? addDays(today, daysBetween(s.startDate, s.endDate)) : s.endDate,
    hoursOn: !!s.hours,
    open: s.hours?.open ?? "11:00",
    close: s.hours?.close ?? "21:00",
    breakOn: !!s.hours?.break,
    breakStart: s.hours?.break?.[0] ?? "15:00",
    breakEnd: s.hours?.break?.[1] ?? "16:30",
    closedDays: s.hours?.closedDays ?? [],
    priority: String(s.priority),
    fee: String(s.feeKrw),
    paymentStatus: renew ? "pending" : s.paymentStatus,
  };
}

function validate(f: FormState): string | null {
  if (!f.place) return "식당을 골라 주세요.";
  if (!f.targetMenuIds.length && !f.targetCategories.length) return "노출 메뉴나 카테고리를 하나 이상 골라 주세요.";
  if (!f.startDate || !f.endDate || f.endDate < f.startDate) return "기간을 확인해 주세요. 끝나는 날이 시작일보다 빨라요.";
  if (f.hoursOn && f.close <= f.open) return "영업시간을 확인해 주세요.";
  if (f.hoursOn && f.breakOn && (f.breakEnd <= f.breakStart || f.breakStart < f.open || f.breakEnd > f.close)) return "브레이크 시간이 영업시간 안에 있어야 해요.";
  const p = Number(f.priority);
  if (!Number.isInteger(p) || p < 1 || p > 99) return "우선순위는 1~99로 적어 주세요.";
  if (f.fee === "") return "광고료를 적어 주세요.";
  return null;
}

function toInput(f: FormState): SponsoredInput {
  return {
    place: f.place!,
    targetMenuIds: f.targetMenuIds,
    targetCategories: f.targetCategories,
    radiusM: f.radiusM,
    startDate: f.startDate,
    endDate: f.endDate,
    hours: f.hoursOn ? { open: f.open, close: f.close, break: f.breakOn ? [f.breakStart, f.breakEnd] : null, closedDays: f.closedDays } : null,
    priority: Number(f.priority),
    feeKrw: Number(f.fee),
    paymentStatus: f.paymentStatus,
  };
}

const TITLES: Record<SponsoredEditorMode, string> = { new: "광고 고정 추가", edit: "광고 수정", renew: "광고 재등록" };
const SUBMIT: Record<SponsoredEditorMode, string> = { new: "고정하기", edit: "저장하기", renew: "재등록하기" };
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

// 날짜 · 시간 칸 (브라우저가 오른쪽에 달력 · 시계 아이콘을 붙인다)
function PickerInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(DRAWER_INPUT, "min-w-0 flex-1 tabular-nums disabled:opacity-50")} />;
}

// Figma: A2 광고 고정 추가 패널 (28:1285). 수정 · 재등록도 같은 패널 (식당은 바꿀 수 없음)
export default function SponsoredEditorDrawer({
  isOpen,
  mode,
  sponsored,
  onDone,
}: {
  isOpen: boolean;
  mode: SponsoredEditorMode;
  sponsored: Sponsored | null;
  onDone: (changed: boolean) => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialForm(mode, sponsored));
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<{ q: string; items: SponsoredPlace[] }>({ q: "", items: [] });
  const [menus, setMenus] = useState<AdminMenu[]>([]);
  const [menuQuery, setMenuQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const placeLocked = mode !== "new";

  useEffect(() => {
    getAdminMenus({ visible: true, size: 100 })
      .then((res) => setMenus(res.items))
      .catch(() => {});
  }, []);

  // 카카오 장소 검색 (250ms 디바운스)
  const pq = placeQuery.trim();
  useEffect(() => {
    if (!pq) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchPlaces({ q: pq })
        .then((res) => !cancelled && setPlaceResults({ q: pq, items: res.items }))
        .catch(() => !cancelled && setPlaceResults({ q: pq, items: [] }));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pq]);
  const results = placeResults.q === pq && pq ? placeResults.items.slice(0, 5) : [];

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  };

  // 노출 메뉴 · 카테고리 후보: 식당 종류의 메뉴 + 그 세부 카테고리 + "종류 전체" (+ 이미 고른 것, 검색한 메뉴)
  const cuisine = cuisineOfPlace(form.place);
  const baseMenus = cuisine ? menus.filter((m) => m.cuisine === cuisine) : [];
  const searched = menuQuery.trim() ? menus.filter((m) => m.name.includes(menuQuery.trim())) : [];
  const menuChips = [...new Map([...baseMenus.slice(0, 6), ...searched.slice(0, 6), ...menus.filter((m) => form.targetMenuIds.includes(m.id))].map((m) => [m.id, m])).values()];
  const categoryChips = [
    ...new Set([...[...new Set(baseMenus.map((m) => m.category).filter(Boolean))].slice(0, 4), ...(cuisine ? [cuisine] : []), ...form.targetCategories]),
  ];

  const submit = async () => {
    const problem = validate(form);
    if (problem) return setError(problem);
    setSaving(true);
    try {
      const input = toInput(form);
      if (mode === "new") await createSponsored(input);
      else if (mode === "edit") await updateSponsored(sponsored!.id, input);
      else await renewSponsored(sponsored!.id, input);
      notify.success(mode === "new" ? `'${input.place.name}'을 광고로 고정했어요.` : mode === "edit" ? "광고를 수정했어요." : "광고를 재등록했어요.");
      onDone(true);
    } catch (err) {
      setSaving(false);
      setError(err instanceof ApiError ? err.message : "저장하지 못했어요. 다시 시도해 주세요.");
    }
  };

  const cancelAd = async () => {
    const ok = await confirm({
      title: "광고를 취소할까요?",
      description: "바로 노출이 멈추고 되돌릴 수 없어요. 기록은 '종료'로 남아요.",
      confirmLabel: "광고 취소",
      cancelLabel: "닫기",
      destructive: true,
    });
    if (!ok) return;
    try {
      await cancelSponsored(sponsored!.id);
      notify.success("광고를 취소했어요.");
      onDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "취소하지 못했어요.");
    }
  };

  return (
    <AdminDrawer
      isOpen={isOpen}
      title={TITLES[mode]}
      onClose={() => onDone(false)}
      footer={
        <>
          {mode === "edit" && (
            <button type="button" onClick={cancelAd} className="text-subheadline font-semibold text-accents-red hover:underline">
              광고 취소
            </button>
          )}
          {error ? <p role="alert" className="min-w-0 flex-1 text-right text-footnote text-accents-red">{error}</p> : <span className="flex-1" />}
          <Button type="button" variant="outlined" color="brand" shape="round" size="sm" onClick={() => onDone(false)} className="font-semibold">
            취소
          </Button>
          <Button type="button" color="brand" shape="round" size="sm" isLoading={saving} onClick={submit} className="font-semibold">
            {SUBMIT[mode]}
          </Button>
        </>
      }
    >
      <DrawerField label="식당" hint={placeLocked ? "등록한 식당은 바꿀 수 없어요" : "카카오 장소 검색"}>
        {!placeLocked && !form.place && (
          <>
            <label className="relative flex">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-labels-tertiary" />
              <input value={placeQuery} onChange={(e) => setPlaceQuery(e.target.value)} placeholder="식당 이름으로 검색" aria-label="식당 이름으로 검색" className={cn(DRAWER_INPUT, "pl-9")} />
            </label>
            {pq && (
              <ul aria-label="장소 검색 결과" className="flex flex-col overflow-hidden rounded-xl border border-separators-non-opaque">
                {results.length ? (
                  results.map((p) => (
                    <li key={p.placeId}>
                      <button
                        type="button"
                        onClick={() => {
                          set("place", p);
                          setPlaceQuery("");
                        }}
                        className="flex w-full flex-col px-3.5 py-2.5 text-left hover:bg-fills-quaternary"
                      >
                        <span className="text-subheadline font-semibold text-labels-primary">{p.name}</span>
                        <span className="text-footnote text-labels-secondary">
                          {p.category} · {p.address}
                        </span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3.5 py-3 text-footnote text-labels-tertiary">검색 결과가 없어요.</li>
                )}
              </ul>
            )}
          </>
        )}
        {form.place && (
          <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-brand-primary bg-brand-primary-tint px-3.5 py-2.5">
            <Check aria-hidden className="size-4 shrink-0 text-brand-primary" strokeWidth={2.5} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-subheadline font-semibold text-labels-primary">{form.place.name}</span>
              <span className="truncate text-footnote text-labels-secondary">
                {form.place.category} · {form.place.address}
              </span>
            </span>
            {!placeLocked && (
              <button type="button" onClick={() => set("place", null)} className="shrink-0 text-footnote font-semibold text-brand-primary">
                변경
              </button>
            )}
          </div>
        )}
      </DrawerField>

      <DrawerField label="노출 메뉴 · 카테고리" hint="이 메뉴가 추천될 때만 노출">
        {!form.place ? (
          <p className="text-footnote text-labels-tertiary">식당을 고르면 후보가 나와요.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {menuChips.map((m) => (
                <SelectChip key={m.id} label={m.name} selected={form.targetMenuIds.includes(m.id)} onToggle={() => set("targetMenuIds", toggle(form.targetMenuIds, m.id))} />
              ))}
              {categoryChips.map((c) => (
                <SelectChip
                  key={c}
                  label={(MENU_CUISINES as readonly string[]).includes(c) ? `${c} 전체` : c}
                  selected={form.targetCategories.includes(c)}
                  onToggle={() => set("targetCategories", toggle(form.targetCategories, c))}
                />
              ))}
            </div>
            <input value={menuQuery} onChange={(e) => setMenuQuery(e.target.value)} placeholder="다른 메뉴 찾기" aria-label="다른 메뉴 찾기" className={DRAWER_INPUT} />
          </>
        )}
      </DrawerField>

      <DrawerField label="노출 반경">
        <div className="flex flex-wrap gap-2">
          {SPONSORED_RADII.map((r) => (
            <SelectChip key={r} label={formatRadius(r)} selected={form.radiusM === r} onToggle={() => set("radiusM", r)} />
          ))}
        </div>
      </DrawerField>

      <DrawerField label="기간">
        <div className="flex items-center gap-2">
          <PickerInput type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} aria-label="시작일" />
          <span className="text-labels-tertiary">~</span>
          <PickerInput type="date" value={form.endDate} min={form.startDate} onChange={(e) => set("endDate", e.target.value)} aria-label="종료일" />
        </div>
      </DrawerField>

      <label className="flex cursor-pointer items-center gap-2 text-subheadline text-labels-primary">
        <input type="checkbox" checked={form.hoursOn} onChange={(e) => set("hoursOn", e.target.checked)} className="size-[18px] accent-brand-primary" />
        영업시간 표시 (광고 · 입점 식당만 &quot;영업 중&quot;이 보여요)
      </label>
      {form.hoursOn && (
        <>
          <div className="flex flex-col gap-[18px]">
            <DrawerField label="영업시간">
              <div className="flex items-center gap-1.5">
                <PickerInput type="time" value={form.open} onChange={(e) => set("open", e.target.value)} aria-label="여는 시각" />
                <span className="text-labels-tertiary">~</span>
                <PickerInput type="time" value={form.close} onChange={(e) => set("close", e.target.value)} aria-label="닫는 시각" />
              </div>
            </DrawerField>
            <DrawerField label="브레이크">
              <div className="flex items-center gap-1.5">
                <PickerInput type="time" value={form.breakStart} disabled={!form.breakOn} onChange={(e) => set("breakStart", e.target.value)} aria-label="브레이크 시작" />
                <span className="text-labels-tertiary">~</span>
                <PickerInput type="time" value={form.breakEnd} disabled={!form.breakOn} onChange={(e) => set("breakEnd", e.target.value)} aria-label="브레이크 끝" />
              </div>
              <label className="flex items-center gap-1.5 text-footnote text-labels-secondary">
                <input type="checkbox" checked={form.breakOn} onChange={(e) => set("breakOn", e.target.checked)} className="accent-brand-primary" />
                브레이크 있음
              </label>
            </DrawerField>
          </div>
          <DrawerField label="휴무일">
            <div className="flex flex-wrap gap-2">
              {CLOSED_DAYS.map((d) => (
                <SelectChip key={d.value} label={d.label} selected={form.closedDays.includes(d.value)} onToggle={() => set("closedDays", toggle(form.closedDays, d.value))} />
              ))}
            </div>
            <p className="text-footnote text-labels-tertiary">광고 기간 동안 앱에 &quot;영업 중 · {form.close}까지&quot;로 표시돼요.</p>
          </DrawerField>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <DrawerField label="우선순위" htmlFor="ad-priority">
          <input type="number" min={1} max={99} value={form.priority} onChange={(e) => set("priority", e.target.value)} id="ad-priority" className={DRAWER_INPUT} />
          <p className="text-footnote text-labels-tertiary">같은 조건이면 작은 숫자가 위</p>
        </DrawerField>
        <DrawerField label="광고료" htmlFor="ad-fee">
          <label className="relative flex">
            <input
              inputMode="numeric"
              value={form.fee ? Number(form.fee).toLocaleString("ko-KR") : ""}
              onChange={(e) => set("fee", e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))}
              placeholder="0"
              id="ad-fee"
              className={cn(DRAWER_INPUT, "pr-8")}
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-subheadline text-labels-secondary">원</span>
          </label>
        </DrawerField>
      </div>

      <DrawerField label="결제 상태">
        <div className="flex gap-2">
          <SelectChip label="입금 대기" selected={form.paymentStatus === "pending"} onToggle={() => set("paymentStatus", "pending")} />
          <SelectChip label="결제 완료" selected={form.paymentStatus === "paid"} onToggle={() => set("paymentStatus", "paid")} />
        </div>
      </DrawerField>
    </AdminDrawer>
  );
}
