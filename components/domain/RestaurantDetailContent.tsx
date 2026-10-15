import { Check, Clock, MapPin, Phone, SquarePen, X } from "lucide-react";
import FoodImage from "@/components/common/FoodImage";
import ReviewItem from "@/components/domain/ReviewItem";
import StarRating from "@/components/domain/StarRating";
import Button from "@/components/ui/button";
import { formatDistance, formatHours, joinMeta, withObjectParticle } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Restaurant, RestaurantDetail, SearchedMenu } from "@/types/restaurant";

interface RestaurantDetailContentProps {
  // 목록에서 받은 식당(거리·근거 포함). 상세는 도착하면 덧붙는다
  restaurant: Restaurant;
  detail: RestaurantDetail | null;
  menu: SearchedMenu | null;
  onClose: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onReportMenu: () => void;
  onWriteReview: () => void;
  onAllReviews: () => void;
}

// Figma: 03 Map Detail Panel (23:380) · 모바일 상세 시트 (31:1117) 공용 내용
export default function RestaurantDetailContent({
  restaurant: r,
  detail,
  menu,
  onClose,
  onToggleFavorite,
  onShare,
  onReportMenu,
  onWriteReview,
  onAllReviews,
}: RestaurantDetailContentProps) {
  const evidence = r.menuEvidence;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="-mr-1 flex size-8 items-center justify-center rounded-full text-labels-secondary hover:bg-fills-quaternary"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <FoodImage src={r.imageUrl} alt={r.name} className="h-[170px] w-full shrink-0 rounded-[20px]" />

      <div className="flex flex-col gap-1">
        <h2 className="text-title-2 font-bold text-labels-primary">{r.name}</h2>
        <p className="text-subheadline text-labels-secondary">
          {joinMeta([r.category, r.mainMenu, `도보 ${r.walkMinutes}분 (${formatDistance(r.distanceM)})`])}
        </p>
        {r.rating !== null ? (
          <div className="flex items-center gap-2.5">
            <span className="text-title-3 font-semibold text-labels-primary">{r.rating.toFixed(1)}</span>
            <StarRating rating={r.rating} />
            <span className="text-footnote font-semibold text-labels-secondary">리뷰 {r.reviewCount.toLocaleString("ko-KR")}개</span>
          </div>
        ) : (
          <p className="text-footnote font-semibold text-labels-tertiary">아직 리뷰 없음</p>
        )}
      </div>

      {menu && evidence && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-[14px] px-3 py-2.5",
            evidence.verified ? "bg-brand-primary-tint" : "bg-fills-quaternary",
          )}
        >
          {evidence.verified && <Check aria-hidden className="size-4 shrink-0 text-brand-primary" strokeWidth={2.5} />}
          <div className="flex min-w-0 flex-1 flex-col text-footnote">
            <p className="font-semibold text-labels-primary">
              {withObjectParticle(menu.keyword)} {evidence.verified ? "파는 곳이에요" : "팔 수도 있어요"}
            </p>
            <p className="text-labels-secondary">{evidenceDetail(evidence)}</p>
          </div>
          <button type="button" onClick={onReportMenu} className="shrink-0 text-footnote text-labels-secondary underline">
            이 메뉴 안 팔아요
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5 rounded-2xl bg-white/70 px-3.5 py-3">
        <InfoRow icon={<MapPin />}>{r.address}</InfoRow>
        {/* 영업시간은 광고·입점 식당만 있다 */}
        <InfoRow icon={<Clock />} muted={!r.hours}>
          {r.hours ? (
            <>
              {r.openNow !== null && (
                <span className={r.openNow ? "font-semibold text-accents-green" : "font-semibold text-labels-secondary"}>
                  {r.openNow ? "영업 중" : "영업 종료"} ·{" "}
                </span>
              )}
              {formatHours(r.hours)}
            </>
          ) : (
            "영업시간 정보 없음"
          )}
        </InfoRow>
        <InfoRow icon={<Phone />} muted={!r.phone}>
          {r.phone ? <a href={`tel:${r.phone}`}>{r.phone}</a> : "전화번호 정보 없음"}
        </InfoRow>
      </div>

      <div className="flex gap-2">
        <Button asChild color="brand" shape="round" size="md" className="h-9 flex-1 px-4 text-subheadline font-semibold">
          <a href={r.kakaoMapUrl} target="_blank" rel="noreferrer">
            길찾기
          </a>
        </Button>
        <Button
          variant="outlined"
          color="brand"
          shape="round"
          size="md"
          aria-pressed={r.isFavorite}
          className="h-9 px-4 text-subheadline font-semibold"
          onClick={onToggleFavorite}
        >
          {r.isFavorite ? "찜 해제" : "찜"}
        </Button>
        <Button variant="outlined" color="brand" shape="round" size="md" className="h-9 px-4 text-subheadline font-semibold" onClick={onShare}>
          공유
        </Button>
      </div>

      <div className="h-[0.5px] bg-separators-non-opaque" />

      <div className="flex items-center justify-between">
        <h3 className="text-headline text-labels-primary">리뷰</h3>
        <button type="button" onClick={onWriteReview} className="flex items-center gap-1 text-subheadline font-semibold text-brand-primary">
          <SquarePen aria-hidden className="size-4" />
          리뷰 쓰기
        </button>
      </div>

      {!detail ? (
        <div aria-busy className="flex flex-col gap-3">
          <div className="h-12 animate-pulse rounded-xl bg-surface-placeholder" />
          <div className="h-12 animate-pulse rounded-xl bg-surface-placeholder" />
        </div>
      ) : detail.recentReviews.length ? (
        <>
          <ul className="flex flex-col gap-4">
            {detail.recentReviews.map((review) => (
              <li key={review.id}>
                <ReviewItem review={review} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onAllReviews}
            className="rounded-xl bg-white/70 py-2 text-subheadline font-semibold text-labels-secondary hover:text-labels-primary"
          >
            리뷰 {r.reviewCount.toLocaleString("ko-KR")}개 모두 보기
          </button>
        </>
      ) : (
        <p className="py-2 text-footnote text-labels-secondary">아직 리뷰가 없어요. 첫 리뷰를 남겨 주세요.</p>
      )}
    </div>
  );
}

function evidenceDetail(evidence: NonNullable<Restaurant["menuEvidence"]>): string {
  if (evidence.type === "review") return `리뷰 ${evidence.count}명이 먹었어요`;
  if (evidence.type === "owner") return "사장님이 대표 메뉴로 등록했어요";
  return evidence.label;
}

function InfoRow({ icon, muted = false, children }: { icon: React.ReactNode; muted?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-4 shrink-0 items-center justify-center text-labels-secondary [&>svg]:size-4">{icon}</span>
      <p className={cn("min-w-0 flex-1 text-footnote", muted ? "text-labels-tertiary" : "text-labels-primary")}>{children}</p>
    </div>
  );
}
