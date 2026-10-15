import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// 어드민 화면 공용 조각 (Figma A1 Admin · 27:834)

export const ADMIN_CARD = "rounded-[20px] border border-white bg-white/80 shadow-[0_4px_20px_rgba(64,38,20,0.06)]";

// 제목 · 설명 + 오른쪽 버튼
export function AdminPageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-1 font-bold text-labels-primary">{title}</h1>
        <p className="text-subheadline text-labels-secondary">{description}</p>
      </div>
      <span className="flex-1" />
      {actions}
    </div>
  );
}

// 요약 숫자 카드
export function AdminStatCard({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: ReactNode; tone?: "default" | "alert" }) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-1 px-5 py-4", ADMIN_CARD)}>
      <p className="text-footnote text-labels-secondary">{label}</p>
      <p className={cn("text-title-2 font-bold", tone === "alert" ? "text-accents-red" : "text-labels-primary")}>{value}</p>
      {sub}
    </div>
  );
}

export function AdminStatSkeleton() {
  return <div className={cn("h-[82px] flex-1 animate-pulse", ADMIN_CARD, "bg-surface-placeholder")} />;
}

const BADGE_TONES = {
  green: "bg-[rgba(52,199,89,0.12)] text-accents-green",
  red: "bg-[rgba(255,56,60,0.12)] text-accents-red",
  gray: "bg-[rgba(60,60,67,0.12)] text-labels-secondary",
  brand: "bg-brand-primary-tint text-brand-primary",
} as const;

// 점 + 글자 상태 배지 (정상 · 정지 · 탈퇴 등)
export type AdminBadgeTone = keyof typeof BADGE_TONES;

export function AdminStatusBadge({ label, tone }: { label: string; tone: AdminBadgeTone }) {
  return (
    <span className={cn("inline-flex items-center gap-[5px] rounded-full px-2.5 py-[3px] text-footnote font-semibold whitespace-nowrap", BADGE_TONES[tone])}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

// ‹ 1 2 3 … 25 › — 지금 페이지 앞뒤 1쪽 + 처음 · 끝
export function AdminPagination({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (page: number) => void }) {
  const last = Math.max(1, Math.ceil(total / size));
  if (last === 1) return null;
  const pages = [...new Set([1, page - 1, page, page + 1, last])].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const cell = "flex size-[30px] items-center justify-center rounded-lg text-subheadline";

  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-1.5 py-3.5">
      <button type="button" aria-label="이전 페이지" disabled={page === 1} onClick={() => onChange(page - 1)} className={cn(cell, "text-labels-secondary disabled:opacity-40")}>
        <ChevronLeft aria-hidden className="size-4" />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1] > 1 && <span className={cn(cell, "text-labels-secondary")}>…</span>}
          <button
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={cn(cell, p === page ? "bg-brand-primary-tint font-semibold text-brand-primary" : "text-labels-secondary hover:bg-fills-quaternary")}
          >
            {p}
          </button>
        </span>
      ))}
      <button type="button" aria-label="다음 페이지" disabled={page === last} onClick={() => onChange(page + 1)} className={cn(cell, "text-labels-secondary disabled:opacity-40")}>
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </nav>
  );
}
