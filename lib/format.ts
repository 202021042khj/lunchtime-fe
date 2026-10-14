// 420 → "420m", 1250 → "1.3km"
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1).replace(/\.0$/, "")}km`;
}

// 리뷰가 없으면 "아직 리뷰 없음"
export function formatRating(rating: number | null, reviewCount: number): string {
  if (rating === null || reviewCount === 0) return "아직 리뷰 없음";
  return `★ ${rating.toFixed(1)} (리뷰 ${reviewCount.toLocaleString("ko-KR")})`;
}

// 매칭 %가 없으면(popular 모드) 인기 순위
export function formatMatch(matchPercent: number | null, popularRank: number | null = null): string {
  if (matchPercent !== null) return `매칭 ${matchPercent}%`;
  if (popularRank !== null) return `인기 ${popularRank}위`;
  return "";
}

// "18° 맑음"
export function formatWeather(weather: { tempC: number; label: string }): string {
  return `${weather.tempC}° ${weather.label}`;
}

// "최고 21° / 최저 11°" (둘 중 하나라도 없으면 빈 문자열)
export function formatHighLow(weather: { highC: number | null; lowC: number | null }): string {
  if (weather.highC === null || weather.lowC === null) return "";
  return `최고 ${weather.highC}° / 최저 ${weather.lowC}°`;
}

// "1km", "3km"
export function formatRadius(meters: number): string {
  return meters >= 1000 ? `${meters / 1000}km` : `${meters}m`;
}

// 빈 값은 빼고 " · "로 잇는다
export function joinMeta(parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(" · ");
}
