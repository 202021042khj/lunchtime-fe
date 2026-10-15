import { AlertTriangle } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import LoginRequiredState from "@/components/domain/LoginRequiredState";
import { UseMyLogicResult } from "@/hooks/useMyLogic";

// MY 로딩 · 비로그인 · 오류
export default function MyStatusSection({ logic }: { logic: UseMyLogicResult }) {
  if (logic.status === "loading") {
    return (
      <div aria-busy aria-label="내 정보를 불러오는 중" className="flex flex-col gap-4 lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-6">
        <div className="h-[220px] animate-pulse rounded-[28px] bg-surface-placeholder" />
        <div className="h-[320px] animate-pulse rounded-[28px] bg-surface-placeholder" />
      </div>
    );
  }
  if (logic.status === "guest") return <LoginRequiredState description="로그인하면 내 리뷰 · 찜 · 취향을 한곳에서 볼 수 있어요." />;
  return (
    <EmptyState
      className="py-20"
      icon={<AlertTriangle />}
      title="내 정보를 불러오지 못했어요"
      description="잠시 후 다시 시도해 주세요."
      primaryAction={{ label: "다시 시도", onClick: logic.retry }}
    />
  );
}
