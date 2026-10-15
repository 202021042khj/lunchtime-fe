"use client";

import { Eye, EyeOff } from "lucide-react";
import { ComponentPropsWithoutRef, ReactNode, useId, useState } from "react";
import { cn } from "@/lib/utils";

interface AuthTextFieldProps extends Omit<ComponentPropsWithoutRef<"input">, "className"> {
  label: string;
  error?: string | null;
  hint?: string;
  // 입력칸 오른쪽 (타이머 · 버튼 등)
  trailing?: ReactNode;
}

// 이메일 계정 화면의 입력칸. 에러가 있으면 빨간 테두리 + 아래 문구
export default function AuthTextField({ label, error, hint, trailing, id, ...props }: AuthTextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={inputId} className="text-footnote font-semibold text-labels-secondary">
        {label}
      </label>
      <div
        className={cn(
          "flex h-[50px] items-center gap-2 rounded-[14px] bg-fills-quaternary px-4 ring-inset focus-within:ring-[1.5px] focus-within:ring-brand-primary",
          error && "ring-[1.5px] ring-accents-red focus-within:ring-accents-red",
        )}
      >
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={message ? messageId : undefined}
          className="min-w-0 flex-1 bg-transparent text-body text-labels-primary outline-none placeholder:text-labels-tertiary read-only:text-labels-secondary"
          {...props}
        />
        {trailing}
      </div>
      {message && (
        <p id={messageId} className={cn("text-footnote break-keep", error ? "text-accents-red" : "text-labels-tertiary")}>
          {message}
        </p>
      )}
    </div>
  );
}

// 비밀번호 칸: 눈 버튼으로 보이기 · 숨기기
export function PasswordField(props: Omit<AuthTextFieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  return (
    <AuthTextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
          className="text-labels-tertiary hover:text-labels-secondary"
        >
          {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
        </button>
      }
    />
  );
}
