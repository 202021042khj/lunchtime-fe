import { SlidersHorizontal, X } from "lucide-react";
import Button from "@/components/ui/button";

interface TasteBannerSectionProps {
  onStart: () => void;
  onDismiss: () => void;
}

// 비로그인·취향 미입력일 때 홈 상단 배너 (Figma 12 Home · 취향 미입력)
export default function TasteBannerSection({ onStart, onDismiss }: TasteBannerSectionProps) {
  return (
    <section className="flex items-center gap-3 rounded-[20px] bg-[rgba(242,164,119,0.32)] py-3 pr-3 pl-3.5 md:gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white">
        <SlidersHorizontal aria-hidden className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-subheadline font-semibold text-labels-primary">취향을 알려주면 추천이 더 정확해져요</p>
        <p className="truncate text-footnote text-labels-secondary">못 먹는 재료, 알레르기, 맵기, 좋아하는 음식 4단계</p>
      </div>
      <Button color="brand" shape="round" size="sm" className="hidden shrink-0 px-4 font-semibold sm:inline-flex" onClick={onStart}>
        취향 알려주기
      </Button>
      <button
        type="button"
        onClick={onStart}
        className="shrink-0 text-footnote font-semibold text-brand-primary sm:hidden"
      >
        알려주기
      </button>
      <button type="button" aria-label="배너 닫기" onClick={onDismiss} className="shrink-0 p-1 text-labels-secondary hover:text-labels-primary">
        <X aria-hidden className="size-4" />
      </button>
    </section>
  );
}
