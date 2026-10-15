"use client";

import { ChevronDown, Navigation, Search, SlidersHorizontal, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/common/LogoMark";
import NavSearchField from "@/components/layout/NavSearchField";
import { openLocationPicker } from "@/components/domain/LocationPickerModal";
import { DESKTOP_NAV_ITEMS, ROUTES } from "@/constants/navigation";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { cn } from "@/lib/utils";

const GLASS_CONTROL =
  "border border-white/90 bg-white/60 shadow-[0_2px_8px_rgba(31,26,89,0.06)] transition-colors hover:bg-white/80";

// Figma: 01 Home · Desktop Top Nav (12:172). 태블릿(768~1023px)은 검색창을 아이콘으로 줄인다
export default function DesktopTopNav() {
  const pathname = usePathname();
  const { location } = useCurrentLocation();
  // 지도 화면은 메뉴바가 화면 전체 폭을 쓴다 (Figma 03 Map Top Nav: 좌우 32px)
  const fluid = pathname.startsWith(ROUTES.map);

  return (
    <header className="w-full border-b border-white/70 bg-white/60 backdrop-blur-[20px]">
      <div className={cn("flex h-32 items-center gap-6", fluid ? "px-8" : "mx-auto max-w-[1200px] px-6 xl:px-0")}>
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

        <div className="hidden lg:block">
          <NavSearchField />
        </div>
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
          aria-current={pathname.startsWith(ROUTES.my) ? "page" : undefined}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            // MY 화면에서는 브랜드 테두리 (Figma 07 MY Avatar)
            pathname.startsWith(ROUTES.my) ? "border-2 border-brand-primary bg-brand-primary-tint shadow-[0_2px_8px_rgba(31,26,89,0.06)]" : GLASS_CONTROL,
          )}
        >
          <User
            aria-hidden
            className={cn("size-4", pathname.startsWith(ROUTES.my) ? "fill-brand-primary text-brand-primary" : "fill-labels-secondary text-labels-secondary")}
          />
        </Link>
      </div>
    </header>
  );
}
