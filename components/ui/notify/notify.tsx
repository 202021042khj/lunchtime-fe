"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import type { NotifyMessage, NotifyType } from "@/components/ui/notify/notify-types";
import { cn } from "@/lib/utils";

interface NotifyProps {
  type?: NotifyType;
  message: NotifyMessage;
  testId?: string;
}

// 앱 토스트: 흰 유리 알약 + 성공은 브랜드 색 체크, 오류는 빨간 느낌표. 긴 문구는 줄바꿈
const Notify = ({ type = "success", message, testId }: NotifyProps) => {
  const Icon = type === "error" ? CircleAlert : CircleCheck;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "inline-flex max-w-[min(480px,calc(100vw-32px))] items-center gap-2.5 rounded-full border border-white/90 bg-white/90 px-5 py-3",
        "text-subheadline font-semibold break-keep text-labels-primary shadow-[0_8px_32px_rgba(64,38,20,0.16)] backdrop-blur-[20px]",
      )}
      data-testid={testId || undefined}
    >
      <Icon aria-hidden className={cn("size-5 shrink-0", type === "error" ? "text-accents-red" : "text-brand-primary")} strokeWidth={2.25} />
      <span>{message}</span>
    </div>
  );
};

export default Notify;
