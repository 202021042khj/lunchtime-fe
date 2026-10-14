// 카카오 지도 JS SDK에서 쓰는 부분만 최소로 타입을 둔다
export type KakaoLatLng = object;

export interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void;
}

export interface KakaoMap {
  setBounds(bounds: KakaoLatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
  setCenter(latlng: KakaoLatLng): void;
  relayout(): void;
}

export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
}

export interface KakaoMaps {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number; draggable?: boolean; scrollwheel?: boolean; disableDoubleClickZoom?: boolean },
  ) => KakaoMap;
  CustomOverlay: new (options: {
    position: KakaoLatLng;
    content: HTMLElement | string;
    map?: KakaoMap;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }) => KakaoCustomOverlay;
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}
