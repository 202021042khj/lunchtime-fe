"use client";

import { Check, ChevronRight } from "lucide-react";
import { Fragment, ReactNode, useState } from "react";
import { openChangePassword } from "@/components/domain/auth/ChangePasswordDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LUNCH_ALERT_TIMES } from "@/constants/user";
import { UseMyLogicResult } from "@/hooks/useMyLogic";
import { cn } from "@/lib/utils";

const CARD = "rounded-[28px] border border-glass-border bg-glass-card shadow-[0_8px_32px_rgba(64,38,20,0.08)]";

// Figma: 07 MY Settings Card (26:949) — 저장한 위치 · 알림 · (이메일 계정: 비밀번호 바꾸기) · 약관 · 로그아웃 · 회원 탈퇴
export default function SettingsSection({ logic }: { logic: UseMyLogicResult }) {
  const rows: ReactNode[] = [
    <Row key="loc" label="저장한 위치" value={logic.savedLocationLabel} onClick={logic.openLocationPicker} />,
    <LunchAlertRow key="alert" value={logic.lunchAlert} onChange={logic.setLunchAlert} />,
    // 이메일 계정만 비밀번호가 있다
    ...(logic.user?.provider === "email" ? [<Row key="password" label="비밀번호 바꾸기" onClick={openChangePassword} />] : []),
    <Row key="terms" label="이용약관 · 개인정보 처리방침" onClick={logic.openTerms} />,
    <Row key="logout" label="로그아웃" onClick={logic.logout} />,
    <Row key="withdraw" label="회원 탈퇴" danger onClick={logic.withdraw} />,
  ];

  return (
    <section aria-label="설정" className={`flex flex-col p-2 ${CARD}`}>
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 && <div aria-hidden className="h-[0.5px] bg-separators-non-opaque" />}
          {row}
        </Fragment>
      ))}
    </section>
  );
}

const ROW = "flex w-full items-center gap-2 rounded-2xl px-4 py-3.5 text-left hover:bg-white/60";

function Row({ label, value, danger = false, onClick }: { label: string; value?: string; danger?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={ROW}>
      <span className={cn("text-body", danger ? "text-accents-red" : "text-labels-primary")}>{label}</span>
      <span className="flex-1" />
      {value && <span className="truncate text-subheadline text-labels-tertiary">{value}</span>}
      {!danger && <ChevronRight aria-hidden className="size-4 shrink-0 text-labels-tertiary" />}
    </button>
  );
}

// 점심 알림: 끄기 또는 시각 선택. 알림 API가 정해지기 전까지 기기에만 저장한다
function LunchAlertRow({ value, onChange }: { value: string | null; onChange: (time: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const options: { label: string; value: string | null }[] = [
    { label: "끄기", value: null },
    ...LUNCH_ALERT_TIMES.map((t) => ({ label: `점심 ${t}`, value: t })),
  ];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={ROW}>
        <span className="text-body text-labels-primary">알림 설정</span>
        <span className="flex-1" />
        <span className="text-subheadline text-labels-tertiary">{value ? `점심 ${value}` : "꺼짐"}</span>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-labels-tertiary" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 rounded-2xl border-white/80 bg-white p-1.5 shadow-glass">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => {
              onChange(o.value);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-subheadline text-labels-primary hover:bg-fills-quaternary"
          >
            {o.label}
            {value === o.value && <Check aria-hidden className="size-4 text-brand-primary" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
