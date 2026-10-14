import { ReactNode } from "react";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

// Figma: Empty State (37:1763) — 빈 상태·오류 화면 공용 (아이콘 · 제목 · 설명 · 주 버튼 · 보조 링크)
export default function EmptyState({ icon, title, description, primaryAction, secondaryAction, className }: EmptyStateProps) {
  return (
    <div className={cn("mx-auto flex w-full max-w-[440px] flex-col items-center gap-2.5 px-6 py-10 text-center", className)}>
      <div className="mb-1 flex size-16 items-center justify-center rounded-full bg-brand-primary-tint text-brand-primary [&>svg]:size-7">
        {icon}
      </div>
      <p className="text-title-3 font-semibold text-labels-primary">{title}</p>
      {description && <p className="text-subheadline text-labels-secondary">{description}</p>}
      {primaryAction && (
        <Button color="brand" shape="round" className="mt-2 px-5 text-[17px] font-medium" onClick={primaryAction.onClick}>
          {primaryAction.label}
        </Button>
      )}
      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className="text-subheadline font-semibold text-labels-secondary hover:text-labels-primary"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
}
