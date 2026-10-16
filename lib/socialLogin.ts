import { usesMock } from "@/lib/api/client";
import { PROVIDER_LABELS } from "@/constants/user";
import { socialCallbackRoute } from "@/constants/navigation";
import { SocialProvider } from "@/types/user";

// 소셜 로그인. 목에서는 가짜 토큰을 쓰고, 실서버면 웹은 각 회사 로그인 화면으로 이동했다가
// 인가 코드를 받아 온다(/login/<회사>/callback → POST /auth/login { code, redirectUri }).
// 앱(웹뷰)의 토큰 브리지는 아직 미결정이다
export async function getProviderToken(provider: SocialProvider): Promise<string> {
  if (usesMock("/auth/login")) return `mock-${provider}-token`;
  throw new Error(`${PROVIDER_LABELS[provider]} 로그인은 아직 연결되지 않았어요.`);
}

// 아직 열지 않은 로그인 (Apple: 개발자 계정 · https 주소 준비 전). 버튼은 비활성화하고 "서비스 준비 중"
export const UNAVAILABLE_PROVIDERS: readonly SocialProvider[] = ["apple"];

// ---------- 웹: 인가 코드 리다이렉트 (카카오 · 구글) ----------

export type RedirectProvider = "kakao" | "google";

const AUTHORIZE: Record<RedirectProvider, { url: string; clientId: string; params: Record<string, string>; envKey: string }> = {
  // 카카오 JS SDK v2에는 팝업 로그인이 없다
  kakao: {
    url: "https://kauth.kakao.com/oauth/authorize",
    clientId: process.env.NEXT_PUBLIC_KAKAO_REST_KEY ?? "",
    params: {},
    envKey: "NEXT_PUBLIC_KAKAO_REST_KEY",
  },
  // Google Identity 버튼 대신 우리 버튼을 쓰려고 OAuth 코드 방식을 쓴다
  google: {
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
    params: { scope: "openid email profile", prompt: "select_account" },
    envKey: "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  },
};

export const isRedirectProvider = (value: string): value is RedirectProvider => value === "kakao" || value === "google";

// 실서버로 로그인할 때만 리다이렉트한다 (목이면 기존처럼 가짜 토큰)
export const usesSocialRedirect = (provider: SocialProvider): provider is RedirectProvider =>
  isRedirectProvider(provider) && !usesMock("/auth/login");

export const socialRedirectUri = (provider: RedirectProvider) => `${window.location.origin}${socialCallbackRoute(provider)}`;

const stateKey = (provider: RedirectProvider) => `lunchtime.socialLogin.${provider}`;

export function startSocialLogin(provider: RedirectProvider, next: string): void {
  const config = AUTHORIZE[provider];
  if (!config.clientId) throw new Error(`${PROVIDER_LABELS[provider]} 로그인 설정이 필요해요. (${config.envKey})`);
  // 다른 사이트가 만든 콜백 요청을 막기 위한 값. 콜백에서 같은지 확인한다
  const state = crypto.randomUUID();
  window.sessionStorage.setItem(stateKey(provider), JSON.stringify({ state, next }));
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: socialRedirectUri(provider),
    response_type: "code",
    state,
    ...config.params,
  });
  window.location.assign(`${config.url}?${params}`);
}

// 콜백에서 한 번만 꺼낸다 (같은 인가 코드로 두 번 로그인하지 않게)
export function takeSocialLoginState(provider: RedirectProvider): { state: string; next: string } | null {
  try {
    const raw = window.sessionStorage.getItem(stateKey(provider));
    window.sessionStorage.removeItem(stateKey(provider));
    return raw ? (JSON.parse(raw) as { state: string; next: string }) : null;
  } catch {
    return null;
  }
}
