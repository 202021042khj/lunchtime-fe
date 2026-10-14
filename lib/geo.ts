import { LatLng } from "@/types/common";

// 두 좌표 사이 거리(미터), 하버사인 공식
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

// API.md: walkMinutes = 거리 ÷ 80m
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 80));
}
