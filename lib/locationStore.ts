// 지금 추천 기준이 되는 위치. 여러 화면(메뉴바·홈·지도)이 같이 쓰므로 React 밖의 작은 스토어로 두고
// hooks/useCurrentLocation.ts가 useSyncExternalStore로 읽는다. 마지막 위치는 기기에 저장해 새로고침해도 유지한다.
import { reverseGeocode } from "@/lib/api/locations";

export type LocationSource = "gps" | "saved" | "search";

export interface CurrentLocation {
  name: string; // 동네
  lat: number;
  lng: number;
  source: LocationSource;
  label?: string; // 저장한 위치 이름 (회사 등)
  savedId?: string;
}

export type LocationStatus = "idle" | "locating" | "ready" | "unavailable";

export interface LocationState {
  status: LocationStatus;
  location: CurrentLocation | null;
}

const STORAGE_KEY = "lunchtime.location";
const LOCATE_TIMEOUT_MS = 10000;
const SERVER_STATE: LocationState = { status: "idle", location: null };

let state: LocationState | null = null;
const listeners = new Set<() => void>();

function readStored(): CurrentLocation | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CurrentLocation) : null;
  } catch {
    return null;
  }
}

function update(next: LocationState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeLocation(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocationSnapshot(): LocationState {
  if (!state) {
    const stored = readStored();
    state = stored ? { status: "ready", location: stored } : { status: "idle", location: null };
  }
  return state;
}

export function getLocationServerSnapshot(): LocationState {
  return SERVER_STATE;
}

export function setCurrentLocation(location: CurrentLocation): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // 저장 못 해도 이번 세션에는 유지
  }
  update({ status: "ready", location });
}

// 브라우저 위치 권한으로 현재 위치를 잡는다. 실패하면 기존 위치를 유지하고, 없으면 unavailable
export function locateCurrentPosition(): Promise<boolean> {
  const prev = getLocationSnapshot();
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    if (!prev.location) update({ status: "unavailable", location: null });
    return Promise.resolve(false);
  }
  update({ ...prev, status: prev.location ? prev.status : "locating" });

  return new Promise((resolve) => {
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      const current = getLocationSnapshot();
      update(current.location ? { ...current, status: "ready" } : { status: "unavailable", location: null });
      resolve(false);
    };
    // geolocation의 timeout 옵션은 권한을 허용한 뒤에야 시작된다.
    // 권한 창을 닫거나 응답하지 않으면 콜백이 오지 않으므로 전체 대기 시간을 따로 둔다
    const timer = window.setTimeout(fail, LOCATE_TIMEOUT_MS);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        const coord = { lat: coords.latitude, lng: coords.longitude };
        const name = await reverseGeocode(coord).then((n) => n.name).catch(() => "현재 위치");
        setCurrentLocation({ ...coord, name, source: "gps" });
        resolve(true);
      },
      fail,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  });
}
