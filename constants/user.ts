import { SpiceLevel } from "@/types/preferences";
import { LoginProvider } from "@/types/user";

export const PROVIDER_LABELS: Record<LoginProvider, string> = {
  kakao: "카카오",
  apple: "Apple",
  google: "Google",
  email: "이메일",
};

// 이메일 계정 규칙 (화면 검사와 목 서버가 같이 쓴다)
export const AUTH_RULES = {
  passwordMin: 8,
  passwordMax: 64,
  nameMin: 2,
  nameMax: 12,
  codeLength: 6,
  passwordHint: "8자 이상, 영문과 숫자를 섞어 주세요",
} as const;

// 목 서버는 메일을 보내지 않으므로 인증번호를 화면에 알려 준다 (lib/api/mock/handlers.ts MOCK_EMAIL_CODE)
export const MOCK_EMAIL_CODE_HINT = "목 서버: 인증번호는 123456이에요";

// 0 못 먹어요 · 1 순한맛 · 2 보통 · 3 매운맛 · 4 아주 매운맛 (API.md)
export const SPICE_LABELS: Record<SpiceLevel, string> = {
  0: "못 먹어요",
  1: "순한맛",
  2: "보통",
  3: "매운맛",
  4: "아주 매운맛",
};

// 찜한 식당 종류 필터 (기능명세 6)
export const FAVORITE_CUISINES = ["전체", "한식", "일식", "아시안"] as const;

// 점심 알림 시각 선택지. 알림 API가 정해지기 전까지 기기에만 저장한다
export const LUNCH_ALERT_TIMES = ["11:00", "11:30", "12:00"] as const;
