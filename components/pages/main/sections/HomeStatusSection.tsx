import { AlertTriangle, Navigation, UtensilsCrossed } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { EXPANDED_RADIUS_M } from "@/constants/recommendation";
import { formatRadius } from "@/lib/format";

type HomeStatusKind = "noLocation" | "noRestaurants" | "error";

interface HomeStatusSectionProps {
  kind: HomeStatusKind;
  radiusM: number;
  onPickLocation: () => void;
  onRequestPermission: () => void;
  onExpandRadius: () => void;
  onRetry: () => void;
}

// 홈 빈 상태·오류 (기능명세 12 · Figma 12 Home 위치 권한 없음)
export default function HomeStatusSection({ kind, radiusM, onPickLocation, onRequestPermission, onExpandRadius, onRetry }: HomeStatusSectionProps) {
  if (kind === "noLocation") {
    return (
      <EmptyState
        className="py-24"
        icon={<Navigation className="fill-current" />}
        title="위치를 알 수 없어요"
        description="브라우저 위치 권한을 허용하거나, 동네를 직접 골라 주세요. 고른 동네 기준으로 추천해요."
        primaryAction={{ label: "동네 선택하기", onClick: onPickLocation }}
        secondaryAction={{ label: "위치 권한 허용하기", onClick: onRequestPermission }}
      />
    );
  }

  if (kind === "noRestaurants") {
    const canExpand = radiusM < EXPANDED_RADIUS_M;
    return (
      <EmptyState
        className="py-24"
        icon={<UtensilsCrossed />}
        title="근처에 추천할 식당이 없어요"
        description={
          canExpand
            ? `반경 ${formatRadius(radiusM)} 안에서 찾지 못했어요. 범위를 넓혀 볼까요?`
            : `반경 ${formatRadius(radiusM)} 안에서도 찾지 못했어요. 다른 동네를 골라 보세요.`
        }
        primaryAction={
          canExpand
            ? { label: `반경 ${formatRadius(EXPANDED_RADIUS_M)}로 넓히기`, onClick: onExpandRadius }
            : { label: "동네 바꾸기", onClick: onPickLocation }
        }
        secondaryAction={canExpand ? { label: "동네 바꾸기", onClick: onPickLocation } : undefined}
      />
    );
  }

  return (
    <EmptyState
      className="py-24"
      icon={<AlertTriangle />}
      title="추천을 불러오지 못했어요"
      description="잠시 후 다시 시도해 주세요."
      primaryAction={{ label: "다시 시도", onClick: onRetry }}
    />
  );
}
