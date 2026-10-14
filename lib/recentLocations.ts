// 위치 설정의 "최근 검색"은 서버가 아니라 기기에만 저장한다 (기능명세 8)
import { LocationSearchResult } from "@/types/location";

export interface RecentLocation extends LocationSearchResult {
  searchedAt: string;
}

const STORAGE_KEY = "lunchtime.recentLocations";
const MAX_ITEMS = 5;

export function getRecentLocations(): RecentLocation[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentLocation[]) : [];
  } catch {
    return [];
  }
}

export function addRecentLocation(location: LocationSearchResult): RecentLocation[] {
  const next = [
    { ...location, searchedAt: new Date().toISOString() },
    ...getRecentLocations().filter((l) => l.name !== location.name || l.address !== location.address),
  ].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장 못 하면 이번에만 보여 준다
  }
  return next;
}

// "3일 전", "1주 전"
export function formatAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}
