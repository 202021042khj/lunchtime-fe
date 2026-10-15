import { AlertTriangle } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import LoginRequiredState from "@/components/domain/LoginRequiredState";
import { UseTasteLogicResult } from "@/hooks/useTasteLogic";

const SKELETON_HEIGHTS = [220, 220, 140, 180];

// 취향 설정 로딩 · 비로그인 · 오류
export default function TasteStatusSection({ logic }: { logic: UseTasteLogicResult }) {
  if (logic.status === "loading") {
    return (
      <div aria-busy aria-label="취향을 불러오는 중" className="flex flex-col gap-5">
        {SKELETON_HEIGHTS.map((h, i) => (
          <div key={i} style={{ height: h }} className="animate-pulse rounded-[28px] bg-surface-placeholder" />
        ))}
      </div>
    );
  }
  if (logic.status === "guest") {
    return <LoginRequiredState description="로그인하면 취향을 저장하고 나에게 맞춘 메뉴를 추천받을 수 있어요." />;
  }
  return (
    <EmptyState
      className="py-20"
      icon={<AlertTriangle />}
      title="취향을 불러오지 못했어요"
      description="잠시 후 다시 시도해 주세요."
      primaryAction={{ label: "다시 시도", onClick: logic.retry }}
    />
  );
}
