// 최근 검색어는 서버가 아니라 기기에만 저장한다 (위치 설정의 최근 검색과 같은 방식).
// useSyncExternalStore로 읽는다 (서버 렌더에서는 빈 목록)
const STORAGE_KEY = "lunchtime.recentSearches";
const MAX_ITEMS = 8;
const EMPTY: string[] = [];

let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(items: string[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 저장 못 하면 이번에만 보여 준다
  }
  listeners.forEach((l) => l());
}

export function subscribeRecentSearches(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentSearches(): string[] {
  cache ??= read();
  return cache;
}

export const getRecentSearchesServer = () => EMPTY;

export function addRecentSearch(q: string) {
  const term = q.trim();
  if (term) save([term, ...getRecentSearches().filter((t) => t !== term)].slice(0, MAX_ITEMS));
}

export function removeRecentSearch(q: string) {
  save(getRecentSearches().filter((t) => t !== q));
}
