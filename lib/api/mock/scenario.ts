// 예외 화면을 목으로 확인하기 위한 스위치. 여러 개를 콤마로 함께 켤 수 있다.
// 브라우저 콘솔: localStorage.setItem("lunchtime.mockScenario", "guest,noWeather") 후 새로고침
// 또는 .env.local: NEXT_PUBLIC_MOCK_SCENARIO=noRestaurants
export type MockScenario =
  | "guest" // 비로그인 → popular 모드, 로그인 필요 API는 401
  | "noTaste" // 로그인했지만 취향 미입력 → popular 모드
  | "noWeather" // 날씨 조회 실패 → weather: null
  | "noRestaurants" // 근처 식당 0곳 → today: null, suggestRadiusM: 3000
  | "noFavorites" // 찜 없음
  | "noReviews"; // 내 리뷰 없음

const STORAGE_KEY = "lunchtime.mockScenario";

export function getMockScenarios(): Set<MockScenario> {
  let raw = process.env.NEXT_PUBLIC_MOCK_SCENARIO ?? "";
  if (typeof window !== "undefined") {
    try {
      raw = window.localStorage.getItem(STORAGE_KEY) ?? raw;
    } catch {
      // localStorage를 못 쓰면 env 값만 사용
    }
  }
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean) as MockScenario[]);
}
