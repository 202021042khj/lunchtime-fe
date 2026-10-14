import { cn } from "@/lib/utils";

// 위치를 찾거나 첫 추천을 불러오는 동안
export default function HomeSkeletonSection({ variant }: { variant: "desktop" | "mobile" }) {
  const block = "animate-pulse bg-surface-placeholder";

  if (variant === "mobile") {
    return (
      <div aria-busy aria-label="추천을 불러오는 중" className="flex flex-col gap-5 px-4">
        <div className={cn(block, "h-[76px] rounded-[22px]")} />
        <div className={cn(block, "h-[360px] rounded-[30px]")} />
        <div className={cn(block, "h-[170px] rounded-[22px]")} />
      </div>
    );
  }

  return (
    <div aria-busy aria-label="추천을 불러오는 중" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col gap-7">
        <div className={cn(block, "h-[326px] rounded-[32px]")} />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn(block, "h-[170px] rounded-[22px]")} />
          ))}
        </div>
      </div>
      <div className={cn(block, "hidden h-[560px] rounded-[28px] lg:block")} />
    </div>
  );
}
