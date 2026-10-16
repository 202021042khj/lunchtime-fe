"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { overlay } from "overlay-kit";
import { FormEvent, useState } from "react";
import { PasswordField } from "@/components/domain/auth/AuthTextField";
import Button from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { notify } from "@/components/ui/notify/notify-utils";
import { AUTH_RULES } from "@/constants/user";
import { changePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { checkPassword } from "@/lib/validation";

export function openChangePassword() {
  overlay.open(({ isOpen, close, unmount }) => (
    <ChangePasswordDialog
      isOpen={isOpen}
      onClose={() => {
        close();
        window.setTimeout(unmount, 200);
      }}
    />
  ));
}

interface Errors {
  current?: string | null;
  next?: string | null;
  confirm?: string | null;
}

// MY · 비밀번호 바꾸기 (이메일 계정만, Figma 시안 없음 — 확인 창 스타일)
export default function ChangePasswordDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: Errors = {
      current: current ? null : "현재 비밀번호를 입력해 주세요.",
      next: checkPassword(next) ?? (next === current ? "지금과 다른 비밀번호로 정해 주세요." : null),
      confirm: next !== confirmValue ? "비밀번호가 서로 달라요." : null,
    };
    setErrors(found);
    if (found.current || found.next || found.confirm) return;
    setSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      notify.success("비밀번호를 바꿨어요.");
      onClose();
    } catch (error) {
      setSaving(false);
      const code = error instanceof ApiError ? error.code : null;
      if (code === "INVALID_CREDENTIALS") setErrors({ current: "현재 비밀번호가 맞지 않아요." });
      else if (code === "VALIDATION_FAILED") setErrors({ next: (error as ApiError).message });
      else notify.error("바꾸지 못했어요. 다시 시도해 주세요.");
    }
  };

  const edit = (setter: (v: string) => void, key: keyof Errors) => (v: string) => {
    setter(v);
    setErrors((e) => ({ ...e, [key]: null }));
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-[rgba(31,20,13,0.4)]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-dialog w-[min(400px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-white p-6 shadow-[0_24px_64px_rgba(51,26,13,0.25)] outline-none"
        >
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <DialogPrimitive.Title className="text-headline text-labels-primary">비밀번호 바꾸기</DialogPrimitive.Title>
            <PasswordField
              label="현재 비밀번호"
              autoComplete="current-password"
              value={current}
              onChange={(e) => edit(setCurrent, "current")(e.target.value)}
              error={errors.current}
            />
            <PasswordField
              label="새 비밀번호"
              autoComplete="new-password"
              value={next}
              onChange={(e) => edit(setNext, "next")(e.target.value)}
              error={errors.next}
              hint={AUTH_RULES.passwordHint}
            />
            <PasswordField
              label="새 비밀번호 확인"
              autoComplete="new-password"
              value={confirmValue}
              onChange={(e) => edit(setConfirmValue, "confirm")(e.target.value)}
              error={errors.confirm}
            />
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outlined" color="brand" shape="round" size="md" className="flex-1" disabled={saving} onClick={onClose}>
                취소
              </Button>
              <Button type="submit" color="brand" shape="round" size="md" className="flex-1" isLoading={saving}>
                바꾸기
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
