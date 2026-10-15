import MapPreview from "@/components/domain/MapPreview";
import Button from "@/components/ui/button";
import { UseSearchLogicResult } from "@/hooks/useSearchLogic";

// Figma 35:1491 Nearby Panel — 결과 식당 핀 미리보기 + [지도에서 결과 보기] (데스크톱 오른쪽)
export default function SearchMapSection({ logic }: { logic: UseSearchLogicResult }) {
  if (!logic.location) return null;
  return (
    <section
      aria-label="지도 미리보기"
      className="flex flex-col gap-1 rounded-[28px] border border-white/80 bg-white/72 p-2 shadow-[0_8px_32px_rgba(31,26,89,0.08)] backdrop-blur-[20px]"
    >
      <MapPreview center={logic.location} restaurants={logic.restaurants} className="h-[220px] rounded-[20px]" />
      <Button
        type="button"
        variant="outlined"
        color="brand"
        shape="round"
        onClick={logic.openMap}
        disabled={!logic.restaurants.length}
        className="h-[50px] w-full text-[17px] font-semibold"
      >
        지도에서 결과 보기
      </Button>
    </section>
  );
}
