// 카카오 지도 JS SDK를 한 번만 불러온다. 브라우저는 지도만 카카오에서 직접 받고, 식당 검색은 서버를 거친다 (기능명세).
// 키는 NEXT_PUBLIC_KAKAO_JS_KEY, 카카오 디벨로퍼스에 현재 도메인(예: http://localhost:3000)이 등록돼 있어야 한다.
import { KakaoMaps } from "@/types/kakao";

const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const TIMEOUT_MS = 8000;

let loading: Promise<KakaoMaps> | null = null;

export function loadKakaoMaps(): Promise<KakaoMaps> {
  if (typeof window === "undefined") return Promise.reject(new Error("브라우저에서만 지도를 불러올 수 있어요."));
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao.maps);
  if (!APP_KEY) return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY가 없어요."));

  loading ??= new Promise<KakaoMaps>((resolve, reject) => {
    // 도메인 미등록 등으로 SDK가 응답 없이 멈추는 경우를 대비한 타임아웃
    const timer = window.setTimeout(() => reject(new Error("카카오 지도 로딩 시간 초과")), TIMEOUT_MS);
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps) {
        window.clearTimeout(timer);
        reject(new Error("카카오 지도 SDK를 불러오지 못했어요."));
        return;
      }
      window.kakao.maps.load(() => {
        window.clearTimeout(timer);
        resolve(window.kakao!.maps);
      });
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("카카오 지도 SDK를 불러오지 못했어요."));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    loading = null; // 다음에 다시 시도할 수 있게
    throw error;
  });

  return loading;
}
