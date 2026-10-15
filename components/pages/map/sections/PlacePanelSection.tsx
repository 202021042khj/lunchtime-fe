import RestaurantDetailContent from "@/components/domain/RestaurantDetailContent";
import RestaurantReviewsContent from "@/components/domain/RestaurantReviewsContent";
import { UseMapLogicResult } from "@/hooks/useMapLogic";
import { Restaurant } from "@/types/restaurant";

interface PlacePanelSectionProps {
  logic: UseMapLogicResult;
  restaurant: Restaurant;
}

// 선택한 식당 패널 내용: 상세 ↔ 리뷰 모두 보기 (데스크톱 오른쪽 패널, 모바일 상세 시트 공용)
export default function PlacePanelSection({ logic, restaurant }: PlacePanelSectionProps) {
  if (logic.showReviews) {
    return (
      <RestaurantReviewsContent
        restaurant={restaurant}
        ratingSummary={logic.detail?.ratingSummary ?? null}
        version={logic.reviewsVersion}
        onBack={logic.closeReviews}
        onClose={logic.closeDetail}
        onWriteReview={() => logic.writeReview(restaurant)}
        onShareReview={logic.shareReview}
        onReportReview={logic.reportReview}
      />
    );
  }

  return (
    <RestaurantDetailContent
      restaurant={restaurant}
      detail={logic.detail}
      menu={logic.filters.menuOn ? logic.menu : null}
      onClose={logic.closeDetail}
      onToggleFavorite={() => logic.toggleFavorite(restaurant)}
      onShare={() => logic.share(restaurant)}
      onReportMenu={() => logic.reportMenu(restaurant)}
      onWriteReview={() => logic.writeReview(restaurant)}
      onAllReviews={logic.openAllReviews}
    />
  );
}
