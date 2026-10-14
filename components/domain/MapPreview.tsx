"use client";

import { MapIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakaoMap";
import { cn } from "@/lib/utils";
import { LatLng } from "@/types/common";
import { Restaurant } from "@/types/restaurant";

interface MapPreviewProps {
  center: LatLng;
  restaurants: Restaurant[];
  className?: string;
}

// 브랜드 핀: 광고 또는 첫 번째 식당은 큰 브랜드 색 핀, 나머지는 작은 흰 핀 (Figma 01 Home Map Preview)
function pinElement(primary: boolean): HTMLElement {
  const el = document.createElement("div");
  el.className = primary
    ? "flex size-[34px] items-center justify-center rounded-full border-2 border-white bg-brand-primary text-white shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
    : "flex size-[26px] items-center justify-center rounded-full border-2 border-white bg-white text-brand-primary shadow-[0_2px_6px_rgba(0,0,0,0.18)]";
  const size = primary ? 16 : 12;
  el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  return el;
}

function meElement(): HTMLElement {
  const el = document.createElement("img");
  el.src = "/map-me.svg";
  el.alt = "내 위치";
  el.width = 16;
  el.height = 16;
  return el;
}

// 홈 근처 식당 패널의 지도 미리보기. 조작은 막고, 핀과 내 위치만 보여 준다
export default function MapPreview({ center, restaurants, className }: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const overlays: { setMap(map: null): void }[] = [];

    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(center.lat, center.lng),
          level: 4,
          draggable: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
        });
        const bounds = new maps.LatLngBounds();
        const me = new maps.LatLng(center.lat, center.lng);
        bounds.extend(me);
        overlays.push(new maps.CustomOverlay({ position: me, content: meElement(), map, zIndex: 1 }));

        restaurants.forEach((r, i) => {
          const position = new maps.LatLng(r.lat, r.lng);
          bounds.extend(position);
          const primary = r.sponsored || i === 0;
          overlays.push(new maps.CustomOverlay({ position, content: pinElement(primary), map, zIndex: primary ? 3 : 2 }));
        });
        if (restaurants.length) map.setBounds(bounds, 40, 40, 40, 40);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      overlays.forEach((o) => o.setMap(null));
    };
  }, [center.lat, center.lng, restaurants]);

  return (
    <div className={cn("relative overflow-hidden bg-[#e8f0e5]", className)}>
      <div ref={containerRef} className="absolute inset-0" aria-label="근처 식당 지도" role="img" />
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-labels-tertiary">
          <MapIcon aria-hidden className="size-6" strokeWidth={1.75} />
          <span className="text-footnote">지도를 불러오지 못했어요</span>
        </div>
      )}
    </div>
  );
}
