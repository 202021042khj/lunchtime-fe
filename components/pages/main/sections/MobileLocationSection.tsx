import { Navigation } from "lucide-react";
import { formatRadius } from "@/lib/format";
import { CurrentLocation } from "@/lib/locationStore";

interface MobileLocationSectionProps {
  location: CurrentLocation;
  radiusM: number;
  onChange: () => void;
}

const SOURCE_LABEL = { gps: "현재 위치", search: "검색한 위치" } as const;

// Figma: 01 Home 모바일 Location Card (9:536). [변경] → 위치 설정
export default function MobileLocationSection({ location, radiusM, onChange }: MobileLocationSectionProps) {
  const sourceLabel = location.source === "saved" ? location.label : SOURCE_LABEL[location.source];

  return (
    <section className="px-4">
      <div className="flex items-center gap-3.5 rounded-[22px] bg-white px-4 py-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-brand-primary-tint">
          <Navigation aria-hidden className="size-5 fill-brand-primary text-brand-primary" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-headline text-labels-primary">
            {location.name}
            {sourceLabel && ` · ${sourceLabel}`}
          </p>
          {/* 반경 안 전체 식당 수는 API에 없어 반경만 보여 준다 */}
          <p className="truncate text-subheadline text-labels-secondary">반경 {formatRadius(radiusM)} 안에서 추천해요</p>
        </div>
        <button type="button" onClick={onChange} className="shrink-0 text-footnote font-semibold text-brand-primary">
          변경
        </button>
      </div>
    </section>
  );
}
