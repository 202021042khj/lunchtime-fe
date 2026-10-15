"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { PointerEvent, ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type SheetSnap = "min" | "half" | "full";

interface BottomSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  // 손잡이 아래 고정 영역(제목 등). 이 영역과 손잡이를 끌어 높이를 바꾼다
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

// 시트 높이는 화면 위 FULL_TOP_PX 아래 전체. 상태별로 보이는 높이만 다르다
const FULL_TOP_PX = 112;
const MIN_VISIBLE_PX = 132;

function snapOffset(snap: SheetSnap, sheetHeight: number): number {
  if (snap === "full") return 0;
  if (snap === "half") return Math.max(0, sheetHeight - window.innerHeight * 0.5);
  return Math.max(0, sheetHeight - MIN_VISIBLE_PX);
}

// 모바일 지도 화면의 하단 시트 (Figma 03 Map · Mobile 목록 시트 31:946 / 상세 시트 31:1117)
export default function BottomSheet({ snap, onSnapChange, header, children, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const drag = useRef<{ startY: number; startOffset: number; lastY: number; lastT: number; velocity: number; moved: boolean } | null>(null);

  // 상태가 바뀌면 해당 높이로 움직인다 (화면 크기가 바뀌어도 다시 맞춘다)
  useEffect(() => {
    const place = (instant: boolean) => {
      const el = sheetRef.current;
      if (!el) return;
      const target = snapOffset(snap, el.offsetHeight);
      if (instant) y.set(target);
      else animate(y, target, { type: "spring", stiffness: 400, damping: 40 });
    };
    place(false);
    const onResize = () => place(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [snap, y]);

  // 끌기 직후 손잡이 위에서 손을 떼면 클릭도 생기는데, 그 클릭은 무시한다
  const justDragged = useRef(false);

  // 누르는 순간부터 화면 전체(window)에서 움직임을 따라간다. 손잡이는 24px뿐이라 끌면 금방 벗어나기 때문.
  // 포인터를 잡지(capture) 않으므로 그냥 누르면 손잡이·헤더 버튼의 클릭이 그대로 동작한다
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { startY: e.clientY, startOffset: y.get(), lastY: e.clientY, lastT: e.timeStamp, velocity: 0, moved: false };
    const onMove = (ev: globalThis.PointerEvent) => handleMove(ev.clientY, ev.timeStamp);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      handleUp();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const handleMove = (clientY: number, time: number) => {
    const d = drag.current;
    const el = sheetRef.current;
    if (!d || !el) return;
    if (!d.moved && Math.abs(clientY - d.startY) < 5) return;
    d.moved = true;
    d.velocity = (clientY - d.lastY) / Math.max(1, time - d.lastT);
    d.lastY = clientY;
    d.lastT = time;
    const max = snapOffset("min", el.offsetHeight);
    y.set(Math.min(max, Math.max(0, d.startOffset + clientY - d.startY)));
  };

  const handleUp = () => {
    const d = drag.current;
    const el = sheetRef.current;
    drag.current = null;
    if (!d || !el || !d.moved) return;
    justDragged.current = true;
    window.setTimeout(() => (justDragged.current = false), 0);
    const h = el.offsetHeight;
    // 놓은 위치에서 가장 가까운 단계로. 짧게 튕겨서 제자리면 튕긴 방향으로 한 단계
    const order: SheetSnap[] = ["full", "half", "min"];
    const current = y.get();
    let next = order.reduce((best, s) => (Math.abs(snapOffset(s, h) - current) < Math.abs(snapOffset(best, h) - current) ? s : best));
    if (next === snap && Math.abs(d.velocity) > 0.5) {
      next = order[Math.min(2, Math.max(0, order.indexOf(snap) + (d.velocity > 0 ? 1 : -1)))];
    }
    if (next === snap) animate(y, snapOffset(snap, h), { type: "spring", stiffness: 400, damping: 40 });
    else onSnapChange(next);
  };

  return (
    <motion.div
      ref={sheetRef}
      style={{ y, top: FULL_TOP_PX }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-[28px] bg-white shadow-[0_-8px_32px_rgba(64,38,20,0.12)]",
        className,
      )}
    >
      <div onPointerDown={onPointerDown} className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing">
        <button
          type="button"
          aria-label={snap === "full" ? "시트 내리기" : "시트 올리기"}
          onClick={() => !justDragged.current && onSnapChange(snap === "full" ? "half" : "full")}
          className="flex h-6 w-full items-center justify-center"
        >
          <span className="h-[5px] w-9 rounded-full bg-[rgba(60,60,67,0.3)]" />
        </button>
        {header}
      </div>
      {/* 하단 탭바에 가리지 않도록 아래 여백.
          반쯤 올라온 상태에서는 스크롤 영역 아래쪽이 화면 밖에 있어 끝까지 볼 수 없으므로, 안에서 스크롤을 시작하면 시트를 끝까지 올린다 */}
      <div
        onScroll={() => snap !== "full" && onSnapChange("full")}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+110px)]"
      >
        {children}
      </div>
    </motion.div>
  );
}
