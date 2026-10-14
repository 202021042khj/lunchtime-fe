"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Clock, Home, Navigation, Plus, Search, X } from "lucide-react";
import { overlay } from "overlay-kit";
import { useEffect, useState } from "react";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { notify } from "@/components/ui/notify/notify-utils";
import { addSavedLocation, getSavedLocations, searchLocations } from "@/lib/api/locations";
import { ApiError } from "@/lib/api/client";
import { getLocationSnapshot, locateCurrentPosition, setCurrentLocation } from "@/lib/locationStore";
import { addRecentLocation, formatAgo, getRecentLocations, RecentLocation } from "@/lib/recentLocations";
import { cn } from "@/lib/utils";
import { LocationSearchResult, SavedLocation } from "@/types/location";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 메뉴바 동네 버튼, 모바일 홈 [변경], 위치 없음 화면의 [동네 선택하기]에서 연다
export function openLocationPicker() {
  overlay.open(({ isOpen, close, unmount }) => (
    <LocationPickerModal
      isOpen={isOpen}
      onClose={() => {
        close();
        window.setTimeout(unmount, 200); // 닫힘 애니메이션 뒤 정리
      }}
    />
  ));
}

// Figma: 08 Location Change (34:1187). 모바일은 전체 화면 시트
export default function LocationPickerModal({ isOpen, onClose }: LocationPickerModalProps) {
  const current = getLocationSnapshot().location;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; items: LocationSearchResult[] }>({ q: "", items: [] });
  const [saved, setSaved] = useState<SavedLocation[] | null>(null); // null = 비로그인 또는 아직 모름
  const [recent] = useState<RecentLocation[]>(getRecentLocations);
  const [newLabel, setNewLabel] = useState<string | null>(null); // null이면 저장 입력칸 닫힘
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    getSavedLocations()
      .then((res) => setSaved(res.items))
      .catch(() => setSaved(null)); // 비로그인이면 저장한 위치 영역을 숨긴다
  }, []);

  // 입력이 멈추고 250ms 뒤 검색
  const trimmed = query.trim();
  useEffect(() => {
    if (!trimmed) return;
    const timer = window.setTimeout(() => {
      searchLocations(trimmed).then((res) => setResults({ q: trimmed, items: res.items }));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [trimmed]);

  const pickSearchResult = (item: LocationSearchResult) => {
    addRecentLocation(item);
    setCurrentLocation({ name: item.name, lat: item.lat, lng: item.lng, source: "search" });
    onClose();
  };

  const pickSaved = (item: SavedLocation) => {
    setCurrentLocation({ name: item.name, lat: item.lat, lng: item.lng, source: "saved", label: item.label, savedId: item.id });
    onClose();
  };

  const pickCurrentPosition = async () => {
    setLocating(true);
    const ok = await locateCurrentPosition();
    setLocating(false);
    if (ok) onClose();
    else notify.error("위치 권한을 허용하면 현재 위치로 추천해요.");
  };

  const saveCurrent = async () => {
    if (!current || !newLabel?.trim()) return;
    try {
      const item = await addSavedLocation({
        label: newLabel.trim(),
        name: current.name,
        address: current.name,
        lat: current.lat,
        lng: current.lng,
      });
      setSaved((list) => [...(list ?? []), item]);
      setNewLabel(null);
      notify.success("위치를 저장했어요.");
    } catch (error) {
      notify.error(error instanceof ApiError && error.code === "UNAUTHORIZED" ? "로그인하면 위치를 저장할 수 있어요." : "저장하지 못했어요.");
    }
  };

  const showResults = trimmed.length > 0;
  const visibleResults = results.q === trimmed ? results.items : [];

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(64,38,20,0.18)]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-dialog flex flex-col gap-4 bg-glass-sheet p-5 shadow-[0_24px_64px_rgba(64,38,20,0.18)] outline-none",
            // 모바일: 전체 화면 시트, 데스크톱: 가운데 카드
            "inset-0 overflow-y-auto pt-[calc(env(safe-area-inset-top)+20px)]",
            "md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[85vh] md:w-[370px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px] md:border md:border-glass-border md:pt-5",
          )}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-title-3 font-semibold text-labels-primary">위치 설정</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="닫기"
              className="flex size-8 items-center justify-center rounded-full bg-fills-quaternary text-labels-secondary hover:text-labels-primary"
            >
              <X aria-hidden className="size-4" strokeWidth={2.25} />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">추천 기준이 되는 동네를 고르세요.</DialogPrimitive.Description>

          <label className="flex h-10 items-center gap-2 rounded-xl bg-[rgba(118,118,128,0.12)] px-3">
            <Search aria-hidden className="size-4 text-labels-secondary" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="동네, 도로명, 건물명으로 검색"
              className="min-w-0 flex-1 bg-transparent text-subheadline text-labels-primary outline-none placeholder:text-labels-tertiary"
            />
          </label>

          {showResults ? (
            <ul className="flex flex-col">
              {visibleResults.map((item) => (
                <li key={`${item.name}-${item.address}`}>
                  <PickerRow icon={<Search />} title={item.name} subtitle={item.address} onClick={() => pickSearchResult(item)} />
                </li>
              ))}
              {results.q === trimmed && !visibleResults.length && (
                <li className="py-6 text-center text-subheadline text-labels-secondary">검색 결과가 없어요</li>
              )}
            </ul>
          ) : (
            <>
              <button
                type="button"
                onClick={pickCurrentPosition}
                disabled={locating}
                className="flex items-center gap-3 rounded-2xl bg-brand-primary-tint px-4 py-3 text-left disabled:opacity-60"
              >
                <Navigation aria-hidden className="size-4 fill-brand-primary text-brand-primary" />
                <span className="flex flex-col">
                  <span className="text-subheadline font-semibold text-brand-primary">
                    {locating ? "위치를 찾는 중…" : "현재 위치로 설정"}
                  </span>
                  <span className="text-footnote text-labels-secondary">지금 있는 곳 기준으로 추천해요</span>
                </span>
              </button>

              {saved && (
                <section className="flex flex-col">
                  <h3 className="pb-1 text-footnote font-semibold text-labels-secondary">저장한 위치</h3>
                  <ul className="flex flex-col">
                    {saved.map((item, i) => (
                      <li key={item.id} className={cn(i > 0 && "border-t-[0.5px] border-separators-non-opaque")}>
                        <PickerRow
                          icon={<Home />}
                          title={`${item.label} · ${item.name}`}
                          subtitle={item.address}
                          selected={current?.savedId === item.id}
                          onClick={() => pickSaved(item)}
                        />
                      </li>
                    ))}
                  </ul>
                  {newLabel === null ? (
                    <button
                      type="button"
                      disabled={!current}
                      onClick={() => setNewLabel("")}
                      className="flex items-center gap-1 self-start py-1.5 text-subheadline font-semibold text-brand-primary disabled:text-labels-tertiary"
                    >
                      <Plus aria-hidden className="size-4" strokeWidth={2.5} />
                      지금 위치 저장하기
                    </button>
                  ) : (
                    <form
                      className="mt-1 flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveCurrent();
                      }}
                    >
                      <input
                        autoFocus
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="이름 (예: 회사, 집)"
                        maxLength={10}
                        className="h-9 min-w-0 flex-1 rounded-xl border border-chip-border bg-white px-3 text-subheadline outline-none focus:border-brand-primary"
                      />
                      <button type="submit" className="h-9 rounded-full bg-brand-primary px-4 text-subheadline font-semibold text-white">
                        저장
                      </button>
                    </form>
                  )}
                </section>
              )}

              {recent.length > 0 && (
                <section className="flex flex-col">
                  <h3 className="pb-1 text-footnote font-semibold text-labels-secondary">최근 검색</h3>
                  <ul className="flex flex-col">
                    {recent.map((item, i) => (
                      <li key={`${item.name}-${item.searchedAt}`} className={cn(i > 0 && "border-t-[0.5px] border-separators-non-opaque")}>
                        <PickerRow
                          icon={<Clock />}
                          title={item.name}
                          trailing={formatAgo(item.searchedAt)}
                          onClick={() => pickSearchResult(item)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}

interface PickerRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: string;
  selected?: boolean;
  onClick: () => void;
}

function PickerRow({ icon, title, subtitle, trailing, selected = false, onClick }: PickerRowProps) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-2.5 text-left">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-fills-quaternary text-labels-secondary [&>svg]:size-4">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-subheadline font-semibold text-labels-primary">{title}</span>
        {subtitle && <span className="truncate text-footnote text-labels-tertiary">{subtitle}</span>}
      </span>
      {trailing && <span className="shrink-0 text-footnote text-labels-tertiary">{trailing}</span>}
      {selected && <Check aria-label="선택됨" className="size-5 shrink-0 text-brand-primary" strokeWidth={2.25} />}
    </button>
  );
}
