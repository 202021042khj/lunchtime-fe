import { ReactNode } from "react";

interface MobilePageHeaderProps {
  title: string;
  // 제목 옆 회색 숫자 (예: 6곳)
  count?: string;
  trailing?: ReactNode;
}

// 모바일 탭 화면(찜 · MY) 머리. iOS 큰 제목 스타일, 상태바 영역을 피한다
export default function MobilePageHeader({ title, count, trailing }: MobilePageHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-2 px-4 pt-[calc(env(safe-area-inset-top)+16px)]">
      <h1 className="flex items-end gap-2">
        <span className="text-large-title font-bold text-labels-primary">{title}</span>
        {count && <span className="pb-1 text-title-3 font-semibold text-labels-tertiary">{count}</span>}
      </h1>
      {trailing}
    </header>
  );
}
