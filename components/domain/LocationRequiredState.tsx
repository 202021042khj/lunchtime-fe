import { Navigation } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

interface LocationRequiredStateProps {
  // locating: 브라우저 권한 응답을 기다리는 중, unavailable: 위치를 알 수 없음
  kind: "locating" | "unavailable";
  onPickLocation: () => void;
  onRequestPermission: () => void;
  className?: string;
}

// 위치가 있어야 하는 화면(홈·지도) 공통. Figma 12 Home · 위치 권한 없음 (37:1779)
export default function LocationRequiredState({ kind, onPickLocation, onRequestPermission, className = "py-24" }: LocationRequiredStateProps) {
  // 권한 창을 닫았을 수도 있으니 기다리는 동안에도 직접 고르는 길을 열어 둔다
  if (kind === "locating") {
    return (
      <EmptyState
        className={className}
        icon={<Navigation className="animate-pulse fill-current" />}
        title="위치를 확인하고 있어요"
        description="브라우저의 위치 권한 요청을 허용하거나, 동네를 직접 골라 주세요."
        primaryAction={{ label: "동네 직접 고르기", onClick: onPickLocation }}
      />
    );
  }

  return (
    <EmptyState
      className={className}
      icon={<Navigation className="fill-current" />}
      title="위치를 알 수 없어요"
      description="브라우저 위치 권한을 허용하거나, 동네를 직접 골라 주세요. 고른 동네 기준으로 추천해요."
      primaryAction={{ label: "동네 선택하기", onClick: onPickLocation }}
      secondaryAction={{ label: "위치 권한 허용하기", onClick: onRequestPermission }}
    />
  );
}
