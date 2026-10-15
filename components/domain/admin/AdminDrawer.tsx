"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AdminDrawerProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}

// 오른쪽에서 열리는 460px 편집 패널 (Figma A2 Add Pin Drawer 28:1285 — 머리 · 스크롤 본문 · 아래 버튼)
export default function AdminDrawer({ isOpen, title, onClose, footer, children }: AdminDrawerProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(31,20,13,0.4)]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-dialog flex w-[min(460px,100vw)] flex-col bg-white shadow-[-12px_0_48px_rgba(51,26,13,0.18)] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
        >
          <div className="flex items-center px-7 pt-7 pb-4">
            <DialogPrimitive.Title className="text-title-3 font-semibold text-labels-primary">{title}</DialogPrimitive.Title>
            <span className="flex-1" />
            <DialogPrimitive.Close aria-label="닫기" className="text-labels-secondary hover:text-labels-primary">
              <X aria-hidden className="size-5" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-7 pb-6">{children}</div>
          <div className="flex items-center gap-2 border-t border-separators-non-opaque px-7 py-4">{footer}</div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}

// 필드 묶음: 굵은 제목 + 회색 보조 설명 (Figma Field · 식당: "식당 카카오 장소 검색")
// 입력칸 하나짜리는 htmlFor로 라벨을 잇고, 칩 묶음처럼 여러 개면 group으로 묶는다
export function DrawerField({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  const title = (
    <span className="flex items-baseline gap-1.5">
      <span className="text-subheadline font-semibold text-labels-primary">{label}</span>
      {hint && <span className="text-footnote text-labels-tertiary">{hint}</span>}
    </span>
  );
  return htmlFor ? (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor}>{title}</label>
      {children}
    </div>
  ) : (
    <div role="group" aria-label={label} className={cn("flex flex-col gap-2", className)}>
      {title}
      {children}
    </div>
  );
}

// 패널 안 입력칸 (42px, 흰 바탕 + 테두리)
export const DRAWER_INPUT =
  "h-[42px] w-full rounded-xl border border-separators-non-opaque bg-white px-3.5 text-subheadline text-labels-primary outline-none placeholder:text-labels-tertiary focus:border-brand-primary";

// 표 안 회색 태그 (Figma A3 Tag: 높이 22, 좌우 8)
export function AdminTag({ label, tone = "gray" }: { label: string; tone?: "gray" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-md px-2 text-footnote whitespace-nowrap",
        tone === "warn" ? "bg-[rgba(255,149,0,0.14)] text-[#b25e00]" : "bg-[rgba(117,117,128,0.1)] text-labels-secondary",
      )}
    >
      {label}
    </span>
  );
}
