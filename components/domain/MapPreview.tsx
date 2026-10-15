"use client";

import { MapIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakaoMap";
import { mePin, previewPin } from "@/lib/kakaoMapPins";
import { cn } from "@/lib/utils";
import { LatLng } from "@/types/common";
import { Restaurant } from "@/types/restaurant";

interface MapPreviewProps {
  center: LatLng;
  restaurants: Restaurant[];
  className?: string;
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
        overlays.push(new maps.CustomOverlay({ position: me, content: mePin(), map, zIndex: 1 }));

        restaurants.forEach((r, i) => {
          const position = new maps.LatLng(r.lat, r.lng);
          bounds.extend(position);
          const primary = r.sponsored || i === 0;
          overlays.push(new maps.CustomOverlay({ position, content: previewPin(primary), map, zIndex: primary ? 3 : 2 }));
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
