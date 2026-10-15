"use client";

import { Heart, LucideIcon, MapPinned, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/navigation";
import { cn } from "@/lib/utils";

// filled: SF Symbol이 .fill인 탭 (heart.fill · person.fill)
const TABS: { href: string; label: string; icon: LucideIcon; filled: boolean }[] = [
  { href: ROUTES.home, label: "추천", icon: Sparkles, filled: false },
  { href: ROUTES.map, label: "지도", icon: MapPinned, filled: false },
  { href: ROUTES.favorites, label: "찜", icon: Heart, filled: true },
  { href: ROUTES.my, label: "MY", icon: User, filled: true },
];

// Figma: Tab Bar - iPhone (9:275). 하단 고정 유리 탭바, 웹뷰에서는 홈 인디케이터 영역을 피한다
export default function MobileTabBar() {
  const pathname = usePathname();
  // 취향 설정은 [저장하기] 바를 하단에 고정하므로 탭바를 숨긴다
  if (pathname.startsWith(ROUTES.taste)) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-header px-6 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <ul className="mx-auto flex max-w-[370px] items-center rounded-full border border-white/80 bg-white/75 p-1 shadow-[0_8px_32px_rgba(31,26,89,0.12)] backdrop-blur-[20px]">
        {TABS.map(({ href, label, icon: Icon, filled }) => {
          const active = href === ROUTES.home ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-semibold",
                  active ? "bg-fills-quaternary text-brand-primary" : "text-labels-primary",
                )}
              >
                <Icon aria-hidden className={cn("size-6", filled && "fill-current")} strokeWidth={1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
