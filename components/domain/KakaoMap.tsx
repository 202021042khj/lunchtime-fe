"use client";

import { MapIcon, Minus, Navigation, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCallbackRef } from "@/hooks/useCallbackRef";
import { loadKakaoMaps } from "@/lib/kakaoMap";
import { mapPin, mePin } from "@/lib/kakaoMapPins";
import { cn } from "@/lib/utils";
import { LatLng } from "@/types/common";
import { KakaoCustomOverlay, KakaoMap as KakaoMapInstance, KakaoMaps } from "@/types/kakao";
import { Restaurant } from "@/types/restaurant";

interface KakaoMapProps {
  me: LatLng;
  restaurants: Restaurant[];
  selectedId: string | null;
  onSelect: (placeId: string) => void;
  // 바뀔 때마다 검색 중심과 결과가 다 보이게 화면을 맞춘다 (빈 문자열 = 아직 결과 없음, 그대로 둔다)
  fitKey: string;
  // 화면 맞춤 기준점. 다시 검색한 지역이 있으면 그 중심, 아니면 내 위치
  fitCenter: LatLng | null;
  // 사용자가 지도를 끌어 옮긴 뒤 멈추면 새 중심을 알려 준다 ([이 지역에서 다시 검색])
  onUserMove?: (center: LatLng) => void;
  onLocateMe: () => void;
  showZoom?: boolean;
  controlsClassName?: string;
  // 지도 위 오른쪽 상세 패널처럼 결과를 가리는 영역만큼 화면 맞춤 여백을 더 준다
  fitPadding?: { top: number; right: number; bottom: number; left: number };
  // 선택한 식당을 화면 가운데에서 이만큼(px) 비켜 둔다. 상세 패널·시트가 가리는 쪽의 반대로
  selectedOffset?: { x: number; y: number };
  className?: string;
}

const GLASS = "border border-white/85 bg-white/80 shadow-[0_8px_32px_rgba(64,38,20,0.1)] backdrop-blur-[15px]";

// Figma: 03 Map (23:380) 지도 영역 — 식당 핀, 선택 핀(이름), 내 위치, 확대/축소, [내 위치]
export default function KakaoMap({
  me,
  restaurants,
  selectedId,
  onSelect,
  fitKey,
  fitCenter,
  onUserMove,
  onLocateMe,
  showZoom = true,
  controlsClassName,
  fitPadding = { top: 60, right: 60, bottom: 60, left: 60 },
  selectedOffset = { x: 0, y: 0 },
  className,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const mapsRef = useRef<KakaoMaps | null>(null);
  const fittedKeyRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const handleSelect = useCallbackRef(onSelect);
  const handleUserMove = useCallbackRef(onUserMove);

  // 지도는 한 번만 만든다
  useEffect(() => {
    let cancelled = false;
    let dragged = false;
    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, { center: new maps.LatLng(me.lat, me.lng), level: 4 });
        maps.event.addListener(map, "dragstart", () => {
          dragged = true;
        });
        maps.event.addListener(map, "idle", () => {
          if (!dragged) return; // 화면 맞춤·이동 같은 코드 이동은 무시
          dragged = false;
          const c = map.getCenter();
          handleUserMove({ lat: c.getLat(), lng: c.getLng() });
        });
        mapsRef.current = maps;
        mapRef.current = map;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // 처음 위치로만 만들고, 이후 이동은 아래 effect들이 맡는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 숨겨져 있다가(데스크톱·모바일 전환) 크기가 생기면 지도를 다시 그린다
  useEffect(() => {
    const el = containerRef.current;
    if (status !== "ready" || !el) return;
    const observer = new ResizeObserver(() => mapRef.current?.relayout());
    observer.observe(el);
    return () => observer.disconnect();
  }, [status]);

  // 핀: 결과·선택이 바뀌면 다시 그린다
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (status !== "ready" || !maps || !map) return;
    const overlays: KakaoCustomOverlay[] = [
      new maps.CustomOverlay({ position: new maps.LatLng(me.lat, me.lng), content: mePin(true), map, zIndex: 1 }),
    ];
    for (const r of restaurants) {
      const selected = r.placeId === selectedId;
      overlays.push(
        new maps.CustomOverlay({
          position: new maps.LatLng(r.lat, r.lng),
          content: mapPin(r.name, selected, () => handleSelect(r.placeId)),
          map,
          clickable: true,
          zIndex: selected ? 5 : 2,
        }),
      );
    }
    return () => overlays.forEach((o) => o.setMap(null));
  }, [status, restaurants, selectedId, me.lat, me.lng, handleSelect]);

  // 검색 조건이 바뀐 결과가 오면 검색 중심과 결과가 다 보이게 맞춘다.
  // 내 위치(me)가 아니라 검색 중심 기준이라, 다시 검색한 지역에서 필터를 바꿔도 그 지역에 머문다
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (status !== "ready" || !maps || !map || !fitKey || !fitCenter || fittedKeyRef.current === fitKey) return;
    fittedKeyRef.current = fitKey;
    const center = new maps.LatLng(fitCenter.lat, fitCenter.lng);
    const bounds = new maps.LatLngBounds();
    bounds.extend(center);
    restaurants.forEach((r) => bounds.extend(new maps.LatLng(r.lat, r.lng)));
    if (restaurants.length) map.setBounds(bounds, fitPadding.top, fitPadding.right, fitPadding.bottom, fitPadding.left);
    else map.setCenter(center);
  }, [status, fitKey, fitCenter, restaurants, fitPadding]);

  // 목록에서 고르면 그 식당으로 옮긴다
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    const target = restaurants.find((r) => r.placeId === selectedId);
    if (status !== "ready" || !maps || !map || !target) return;
    // 지도 중심이 식당보다 offset만큼 옆에 오게 하면, 식당은 가운데에서 반대쪽으로 비켜 보인다
    const projection = map.getProjection();
    const point = projection.pointFromCoords(new maps.LatLng(target.lat, target.lng));
    map.panTo(projection.coordsFromPoint(new maps.Point(point.x + selectedOffset.x, point.y + selectedOffset.y)));
    // 결과 목록이 바뀔 때는 다시 옮기지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedId]);

  const zoom = (delta: number) => {
    const map = mapRef.current;
    if (map) map.setLevel(map.getLevel() + delta, { animate: true });
  };

  const locateMe = () => {
    const maps = mapsRef.current;
    mapRef.current?.panTo(new maps!.LatLng(me.lat, me.lng));
    onLocateMe();
  };

  return (
    <div className={cn("relative overflow-hidden bg-[#ecede5]", className)}>
      <div ref={containerRef} className="absolute inset-0" aria-label="식당 지도" role="application" />
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-labels-tertiary">
          <MapIcon aria-hidden className="size-7" strokeWidth={1.75} />
          <span className="text-subheadline">지도를 불러오지 못했어요</span>
        </div>
      )}
      {status === "ready" && (
        <div className={cn("absolute bottom-6 left-6 z-10 flex flex-col items-center gap-3", controlsClassName)}>
          {showZoom && (
            <div className={cn("flex flex-col rounded-2xl", GLASS)}>
              <button type="button" aria-label="확대" onClick={() => zoom(-1)} className="flex size-11 items-center justify-center text-labels-primary">
                <Plus aria-hidden className="size-5" />
              </button>
              <button type="button" aria-label="축소" onClick={() => zoom(1)} className="flex size-11 items-center justify-center text-labels-primary">
                <Minus aria-hidden className="size-5" />
              </button>
            </div>
          )}
          <button
            type="button"
            aria-label="내 위치"
            onClick={locateMe}
            className={cn("flex size-12 items-center justify-center rounded-full text-labels-primary", GLASS)}
          >
            <Navigation aria-hidden className="size-5 fill-current" />
          </button>
        </div>
      )}
    </div>
  );
}
