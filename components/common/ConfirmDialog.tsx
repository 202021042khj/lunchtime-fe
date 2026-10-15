"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { overlay } from "overlay-kit";
import Button from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  // 삭제 · 탈퇴처럼 되돌릴 수 없는 동작은 빨간 버튼
  destructive?: boolean;
}

interface ConfirmDialogProps extends ConfirmOptions {
  isOpen: boolean;
  onAnswer: (confirmed: boolean) => void;
}

// 확인 창을 열고 사용자의 선택을 돌려준다. 예: if (await confirm({ title: "리뷰를 삭제할까요?", ... }))
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
    <ConfirmDialog
      {...options}
      isOpen={isOpen}
      onAnswer={(confirmed) => {
        close(confirmed);
        window.setTimeout(unmount, 200);
      }}
    />
  ));
}

// 앱 스타일 확인 창 (템플릿의 ConfirmModal은 관리자용 파란 스타일이라 따로 둔다)
export default function ConfirmDialog({ isOpen, title, description, confirmLabel, cancelLabel = "취소", destructive = false, onAnswer }: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onAnswer(false)}>
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(31,20,13,0.4)]" />
        <DialogPrimitive.Content
          role="alertdialog"
          className="fixed top-1/2 left-1/2 z-dialog flex w-[min(340px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[28px] bg-white p-6 text-center shadow-[0_24px_64px_rgba(51,26,13,0.25)] outline-none"
        >
          <DialogPrimitive.Title className="text-headline text-labels-primary">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="text-subheadline text-labels-secondary">{description}</DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outlined" color="brand" shape="round" size="md" className="flex-1" onClick={() => onAnswer(false)}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              color={destructive ? "red" : "brand"}
              shape="round"
              size="md"
              className={cn("flex-1", destructive && "bg-accents-red")}
              onClick={() => onAnswer(true)}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
