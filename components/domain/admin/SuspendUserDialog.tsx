"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { overlay } from "overlay-kit";
import { useState } from "react";
import SelectChip from "@/components/common/SelectChip";
import Button from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { SuspendUserInput } from "@/types/admin";

const PERIODS: { days: number | null; label: string }[] = [
  { days: 3, label: "3일" },
  { days: 7, label: "7일" },
  { days: 30, label: "30일" },
  { days: null, label: "무기한" },
];
const REASON_MAX = 200;

// 정지 기간 · 사유를 받아 돌려준다. 취소하면 null
export function askSuspendUser(userName: string): Promise<SuspendUserInput | null> {
  return overlay.openAsync<SuspendUserInput | null>(({ isOpen, close, unmount }) => (
    <SuspendUserDialog
      isOpen={isOpen}
      userName={userName}
      onAnswer={(value) => {
        close(value);
        window.setTimeout(unmount, 200);
      }}
    />
  ));
}

interface SuspendUserDialogProps {
  isOpen: boolean;
  userName: string;
  onAnswer: (value: SuspendUserInput | null) => void;
}

// 이용 정지 (Figma 시안 없음 — ConfirmDialog 스타일). 정지되면 리뷰 · 신고를 쓸 수 없다
export default function SuspendUserDialog({ isOpen, userName, onAnswer }: SuspendUserDialogProps) {
  const [days, setDays] = useState<number | null>(7);
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);

  const submit = () => {
    if (!reason.trim()) return setShowError(true);
    onAnswer({ days, reason: reason.trim() });
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onAnswer(null)}>
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(31,20,13,0.4)]" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-dialog flex w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[28px] bg-white p-6 shadow-[0_24px_64px_rgba(51,26,13,0.25)] outline-none">
          <DialogPrimitive.Title className="text-headline text-labels-primary">{userName}님을 이용 정지할까요?</DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-subheadline text-labels-secondary">
            정지된 동안에는 리뷰를 쓰거나 신고할 수 없어요. 기간이 끝나면 자동으로 풀려요.
          </DialogPrimitive.Description>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-footnote font-semibold text-labels-secondary">기간</legend>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <SelectChip key={p.label} label={p.label} selected={days === p.days} onToggle={() => setDays(p.days)} />
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1.5">
            <span className="text-footnote font-semibold text-labels-secondary">사유 (유저에게 보여요)</span>
            <textarea
              value={reason}
              maxLength={REASON_MAX}
              rows={3}
              onChange={(e) => {
                setReason(e.target.value);
                setShowError(false);
              }}
              placeholder="예: 반복적인 욕설 리뷰"
              aria-invalid={showError}
              className="resize-none rounded-[14px] bg-fills-quaternary px-4 py-3 text-subheadline text-labels-primary outline-none placeholder:text-labels-tertiary aria-invalid:ring-[1.5px] aria-invalid:ring-accents-red"
            />
            <span className="flex text-footnote">
              {showError && <span className="text-accents-red">사유를 적어 주세요.</span>}
              <span className="ml-auto text-labels-tertiary">
                {reason.length}/{REASON_MAX}
              </span>
            </span>
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="outlined" color="brand" shape="round" size="md" className="flex-1" onClick={() => onAnswer(null)}>
              취소
            </Button>
            <Button type="button" color="red" shape="round" size="md" className="flex-1" onClick={submit}>
              정지하기
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
