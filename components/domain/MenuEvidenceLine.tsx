import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuEvidence } from "@/types/restaurant";

interface MenuEvidenceLineProps {
  evidence: MenuEvidence;
  className?: string;
}

// 확인된 근거(리뷰·사장님)는 브랜드 색 + 체크, 추정 근거(이름·키워드·카테고리)는 회색
export default function MenuEvidenceLine({ evidence, className }: MenuEvidenceLineProps) {
  return (
    <p
      className={cn(
        "flex min-w-0 items-center gap-1 pt-0.5 text-footnote",
        evidence.verified ? "font-semibold text-brand-primary" : "text-labels-secondary",
        className,
      )}
    >
      {evidence.verified && <Check aria-hidden className="size-3.5 shrink-0" strokeWidth={2.5} />}
      <span className="truncate">{evidence.label}</span>
    </p>
  );
}
