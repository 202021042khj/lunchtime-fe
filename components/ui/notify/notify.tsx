"use client";

import ErrorIcon from "@/components/ui/icons/error-icon";
import SuccessIcon from "@/components/ui/icons/success-icon";
import type { NotifyMessage, NotifyType } from "@/components/ui/notify/notify-types";
import { cn } from "@/lib/utils";

interface NotifyProps {
  type?: NotifyType;
  message: NotifyMessage;
  testId?: string;
}

const Notify = ({ type = "success", message, testId }: NotifyProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-[10px]",
        "rounded-[100px] px-[26px] py-[16px]",
        "bg-white",
        "text-font-16-500 text-primary-main-blue",
        "shadow-notify-success",
        NOTIFY_VARIANTS_MAP[type],
      )}
      data-testid={testId || undefined}
    >
      {type === "error" ? <ErrorIcon className="shrink-0" /> : <SuccessIcon className="shrink-0" />}
      <span className="whitespace-nowrap">{message}</span>
    </div>
  );
};

const NOTIFY_VARIANTS_MAP: Record<NotifyType, string> = {
  success: "text-primary-main-blue shadow-notify-success",
  error: "text-primary-main-red shadow-notify-error",
};

export default Notify;
