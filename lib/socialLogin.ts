import { USE_MOCK } from "@/lib/api/client";
import { SocialProvider } from "@/types/user";

// 카카오 · Apple · Google에서 토큰을 받아 온다 (POST /auth/login에 넘김).
// 목에서는 가짜 토큰을 쓴다. 실제 SDK 연동(카카오 JS SDK Auth, Sign in with Apple, Google Identity)은
// 앱(웹뷰) 브리지 방식이 정해지면 붙인다 (plan.md 미결정: 로그인 방식 확정)
export async function getProviderToken(provider: SocialProvider): Promise<string> {
  if (USE_MOCK) return `mock-${provider}-token`;
  throw new Error(`${provider} 로그인은 아직 연결되지 않았어요.`);
}
