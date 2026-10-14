"use client";

import { ChevronDown, Navigation, Search, SlidersHorizontal, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import LogoMark from "@/components/common/LogoMark";
import { openLocationPicker } from "@/components/domain/LocationPickerModal";
import { DESKTOP_NAV_ITEMS, ROUTES } from "@/constants/navigation";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { cn } from "@/lib/utils";

const GLASS_CONTROL =
  "border border-white/90 bg-white/60 shadow-[0_2px_8px_rgba(31,26,89,0.06)] transition-colors hover:bg-white/80";

// Figma: 01 Home · Desktop Top Nav (12:172). 태블릿(768~1023px)은 검색창을 아이콘으로 줄인다
export default function DesktopTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { location } = useCurrentLocation();
  const [q, setQ] = useState("");

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`${ROUTES.search}?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="w-full border-b border-white/70 bg-white/60 backdrop-blur-[20px]">
      <div className="mx-auto flex h-32 max-w-[1200px] items-center gap-6 px-6 xl:px-0">
        <Link href={ROUTES.home} className="flex shrink-0 items-center gap-2">
          <LogoMark />
          <span className="text-title-3 font-semibold text-labels-primary">lunchtime</span>
        </Link>

        <nav className="flex items-center gap-1">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const active = item.href === ROUTES.home ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-[7px] text-subheadline whitespace-nowrap",
                  active ? "bg-brand-primary-tint font-semibold text-brand-primary" : "text-labels-secondary hover:text-labels-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <form onSubmit={submitSearch} className={cn("hidden h-[38px] w-[300px] items-center gap-2 rounded-full px-3.5 lg:flex", GLASS_CONTROL)}>
          <Search aria-hidden className="size-4 shrink-0 text-labels-secondary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="메뉴, 식당 검색"
            aria-label="메뉴, 식당 검색"
            className="min-w-0 flex-1 bg-transparent text-subheadline text-labels-primary outline-none placeholder:text-labels-tertiary"
          />
        </form>
        <Link
          href={ROUTES.search}
          aria-label="검색"
          className={cn("flex size-10 shrink-0 items-center justify-center rounded-full lg:hidden", GLASS_CONTROL)}
        >
          <Search aria-hidden className="size-4 text-labels-secondary" />
        </Link>

        <button
          type="button"
          onClick={openLocationPicker}
          className={cn("flex h-[38px] shrink-0 items-center gap-1.5 rounded-full px-3.5", GLASS_CONTROL)}
        >
          <Navigation aria-hidden className="size-3.5 fill-brand-primary text-brand-primary" />
          <span className="text-subheadline font-semibold text-labels-primary">{location?.name ?? "위치 설정"}</span>
          <ChevronDown aria-hidden className="size-3.5 text-labels-tertiary" />
        </button>

        <Link
          href={ROUTES.taste}
          aria-label="취향 설정"
          className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", GLASS_CONTROL)}
        >
          <SlidersHorizontal aria-hidden className="size-5 text-labels-primary" />
        </Link>

        <Link
          href={ROUTES.my}
          aria-label="MY"
          className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", GLASS_CONTROL)}
        >
          <User aria-hidden className="size-4 fill-labels-secondary text-labels-secondary" />
        </Link>
      </div>
    </header>
  );
}
