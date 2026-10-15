"use client";

import { Flag, ImageIcon, MoreHorizontal, Share, User } from "lucide-react";
import { useState } from "react";
import StarRating from "@/components/domain/StarRating";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMonthDay, joinMeta } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Review } from "@/types/review";

interface ReviewItemProps {
  review: Review;
  // compact: 지도 상세의 최근 리뷰 2개, full: 리뷰 모두 보기
  variant?: "compact" | "full";
  onShare?: (review: Review) => void;
  onReport?: (review: Review) => void;
}

// Figma: 03 Map Review (compact) · 11 All Reviews Review (full)
export default function ReviewItem({ review, variant = "compact", onShare, onReport }: ReviewItemProps) {
  if (variant === "compact") {
    return (
      <article className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Avatar size="size-[26px]" />
          <span className="text-footnote font-semibold text-labels-primary">{review.author.name}</span>
          <StarRating rating={review.rating} starClassName="size-3" hideEmpty />
          <span className="flex-1" />
          <time dateTime={review.createdAt} className="text-footnote text-labels-tertiary">
            {formatMonthDay(review.createdAt)}
          </time>
        </div>
        {review.content && <p className="text-footnote text-labels-primary">{review.content}</p>}
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Avatar size="size-7" />
        <div className="flex min-w-0 flex-col">
          <span className="text-footnote font-semibold text-labels-primary">
            {review.author.name}
            {review.isMine && <span className="ml-1.5 font-normal text-brand-primary">내 리뷰</span>}
          </span>
          <span className="flex items-center gap-1.5">
            <StarRating rating={review.rating} starClassName="size-3" />
            <span className="truncate text-footnote text-labels-tertiary">
              {joinMeta([review.menus.join(", "), formatMonthDay(review.createdAt)])}
            </span>
          </span>
        </div>
        <span className="flex-1" />
        {(onShare || onReport) && <ReviewMoreMenu review={review} onShare={onShare} onReport={onReport} />}
      </div>
      {review.content && <p className="text-subheadline text-labels-primary">{review.content}</p>}
      {review.photos.length > 0 && (
        <ul className="flex gap-1.5" aria-label={`사진 ${review.photos.length}장`}>
          {review.photos.map((photo) => (
            <li key={photo.id} className="flex size-16 items-center justify-center overflow-hidden rounded-xl bg-surface-placeholder text-labels-tertiary">
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- 리뷰 사진 저장소 미정
                <img src={photo.url} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon aria-hidden className="size-4" />
              )}
            </li>
          ))}
        </ul>
      )}
      {review.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {review.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-brand-primary-tint px-2 py-[3px] text-footnote font-semibold text-brand-primary">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function Avatar({ size }: { size: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-surface-placeholder text-labels-tertiary", size)}>
      <User aria-hidden className="size-3.5 fill-current" />
    </span>
  );
}

// ⋯ 메뉴: 공유, 신고하기 (내 리뷰는 신고할 수 없다)
function ReviewMoreMenu({ review, onShare, onReport }: Pick<ReviewItemProps, "review" | "onShare" | "onReport">) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="리뷰 메뉴"
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-labels-secondary hover:bg-fills-quaternary data-[state=open]:bg-[rgba(117,117,128,0.12)]"
      >
        <MoreHorizontal aria-hidden className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[180px] rounded-2xl border-0 bg-white/96 p-0 py-1.5 shadow-[0_8px_28px_rgba(51,26,13,0.2)]">
        {onShare && (
          <MenuItem
            label="공유"
            icon={<Share />}
            onClick={() => {
              setOpen(false);
              onShare(review);
            }}
          />
        )}
        {onReport && !review.isMine && (
          <MenuItem
            label="신고하기"
            icon={<Flag />}
            danger
            onClick={() => {
              setOpen(false);
              onReport(review);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function MenuItem({ label, icon, danger = false, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between px-3.5 py-2.5 text-body hover:bg-fills-quaternary [&>svg]:size-4",
        danger ? "text-accents-red" : "text-labels-primary",
      )}
    >
      {label}
      {icon}
    </button>
  );
}
