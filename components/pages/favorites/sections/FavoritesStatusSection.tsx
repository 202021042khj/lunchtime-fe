import { AlertTriangle, Heart } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import LoginRequiredState from "@/components/domain/LoginRequiredState";
import { UseFavoritesLogicResult } from "@/hooks/useFavoritesLogic";

// 찜 화면 빈 상태 (Figma 12 Favorites · 비어 있음 37:2209) · 비로그인 · 오류
export default function FavoritesStatusSection({ logic }: { logic: UseFavoritesLogicResult }) {
  if (logic.status === "guest") return <LoginRequiredState description="로그인하면 마음에 드는 식당을 찜해서 모아 볼 수 있어요." />;
  if (logic.status === "error") {
    return (
      <EmptyState
        className="py-20"
        icon={<AlertTriangle />}
        title="찜한 식당을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        primaryAction={{ label: "다시 시도", onClick: logic.retry }}
      />
    );
  }
  // 종류 필터를 건 상태에서 0곳이면 다른 문구
  if (logic.cuisine !== "전체") {
    return (
      <EmptyState
        className="py-20"
        icon={<Heart />}
        title={`찜한 ${logic.cuisine} 식당이 없어요`}
        description="다른 종류를 골라 보세요."
        secondaryAction={{ label: "전체 보기", onClick: () => logic.setCuisine("전체") }}
      />
    );
  }
  return (
    <EmptyState
      className="py-20"
      icon={<Heart />}
      title="아직 찜한 식당이 없어요"
      description="마음에 드는 식당의 하트를 눌러 모아 보세요."
      primaryAction={{ label: "근처 식당 보기", onClick: logic.goToMap }}
    />
  );
}
