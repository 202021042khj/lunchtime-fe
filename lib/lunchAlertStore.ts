// 점심 알림 설정. 알림(푸시) API가 아직 정해지지 않아(API.md 미결정) 기기에만 저장한다.
// hooks/useLunchAlert.ts가 useSyncExternalStore로 읽는다 (서버 렌더와 어긋나지 않게)
const STORAGE_KEY = "lunchtime.lunchAlert";
const listeners = new Set<() => void>();
let cached: string | null | undefined;

// null = 꺼짐, "11:30" 같은 시각 = 켜짐
export function getLunchAlert(): string | null {
  if (cached === undefined) {
    try {
      cached = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      cached = null;
    }
  }
  return cached;
}

export function getLunchAlertServer(): string | null {
  return null;
}

export function setLunchAlert(time: string | null): void {
  cached = time;
  try {
    if (time) window.localStorage.setItem(STORAGE_KEY, time);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장 못 해도 이번 세션에는 유지
  }
  listeners.forEach((l) => l());
}

export function subscribeLunchAlert(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
