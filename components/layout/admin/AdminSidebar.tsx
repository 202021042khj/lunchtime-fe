"use client";

import { Flag, List, LogOut, LucideIcon, Pin, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/common/LogoMark";
import { ADMIN_ROUTES, ROUTES } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import { AdminProfile } from "@/types/admin";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  // 다음 단계에서 만드는 화면
  soon?: boolean;
}

const NAV: NavItem[] = [
  { href: ADMIN_ROUTES.users, label: "유저 관리", icon: Users },
  { href: ADMIN_ROUTES.sponsored, label: "광고 식당 고정", icon: Pin, soon: true },
  { href: ADMIN_ROUTES.menus, label: "메뉴 관리", icon: List, soon: true },
  { href: ADMIN_ROUTES.reports, label: "리뷰 신고", icon: Flag },
];

interface AdminSidebarProps {
  admin: AdminProfile | null;
  pendingReports: number | null;
  onLogout: () => void;
}

// Figma: A1 Admin Sidebar (27:835) — 248px, ADMIN 배지, 메뉴 4개(리뷰 신고 처리 대기 배지), 아래 운영자 · 서비스로 가기.
// lg 미만은 위쪽 가로 메뉴로 바뀐다
export default function AdminSidebar({ admin, pendingReports, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  const items = NAV.map((item) => {
    const active = pathname.startsWith(item.href);
    const Icon = item.icon;
    const body = (
      <>
        <Icon aria-hidden className={cn("size-4 shrink-0", item.href === ADMIN_ROUTES.sponsored && "fill-current")} />
        <span className="whitespace-nowrap">{item.label}</span>
        <span className="flex-1" />
        {item.soon && <span className="rounded-md bg-fills-quaternary px-1.5 text-caption-1 text-labels-tertiary">준비 중</span>}
        {item.href === ADMIN_ROUTES.reports && !!pendingReports && (
          <span aria-label={`처리 대기 ${pendingReports}건`} className="rounded-full bg-accents-red px-[7px] text-footnote font-semibold text-white">
            {pendingReports}
          </span>
        )}
      </>
    );
    const cls = cn(
      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-subheadline",
      active ? "bg-brand-primary-tint font-semibold text-brand-primary" : "text-labels-primary",
      item.soon ? "cursor-default text-labels-tertiary" : !active && "hover:bg-white/70",
    );
    return item.soon ? (
      <span key={item.href} aria-disabled className={cls}>
        {body}
      </span>
    ) : (
      <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cls}>
        {body}
      </Link>
    );
  });

  return (
    <aside className="flex shrink-0 flex-col gap-1 border-separators-non-opaque bg-white/60 px-4 lg:min-h-dvh lg:w-[248px] lg:border-r lg:py-6 max-lg:flex-row max-lg:items-center max-lg:overflow-x-auto max-lg:border-b max-lg:py-3">
      <Link href={ADMIN_ROUTES.users} className="flex shrink-0 items-center gap-2 pl-2 lg:pb-6">
        <LogoMark />
        <span className="text-title-3 font-semibold text-labels-primary">lunchtime</span>
        <span className="rounded-md bg-[#1f1a14] px-1.5 py-0.5 text-footnote font-semibold text-white">ADMIN</span>
      </Link>
      <nav aria-label="어드민 메뉴" className="flex gap-1 lg:flex-col">
        {items}
      </nav>
      <div className="flex-1" />
      <div className="flex shrink-0 items-center gap-2.5 pl-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-placeholder text-labels-tertiary">
          <User aria-hidden className="size-4 fill-current" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-subheadline font-semibold text-labels-primary">{admin?.name ?? "운영자"}</span>
          <a href={ROUTES.home} target="_blank" rel="noreferrer" className="text-footnote text-labels-tertiary hover:text-labels-secondary">
            서비스로 가기 ↗
          </a>
        </div>
        <button
          type="button"
          onClick={onLogout}
          aria-label="로그아웃"
          className="flex size-8 items-center justify-center rounded-full text-labels-tertiary hover:bg-fills-quaternary hover:text-labels-secondary"
        >
          <LogOut aria-hidden className="size-4" />
        </button>
      </div>
    </aside>
  );
}
