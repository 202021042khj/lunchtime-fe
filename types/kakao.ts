// 카카오 지도 JS SDK에서 쓰는 부분만 최소로 타입을 둔다
export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void;
}

export interface KakaoPoint {
  x: number;
  y: number;
}

export interface KakaoProjection {
  pointFromCoords(latlng: KakaoLatLng): KakaoPoint;
  coordsFromPoint(point: KakaoPoint): KakaoLatLng;
}

export interface KakaoMap {
  getProjection(): KakaoProjection;
  setBounds(bounds: KakaoLatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
  setCenter(latlng: KakaoLatLng): void;
  getCenter(): KakaoLatLng;
  panTo(latlng: KakaoLatLng): void;
  getLevel(): number;
  setLevel(level: number, options?: { animate?: boolean }): void;
  relayout(): void;
}

export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
}

export interface KakaoMaps {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Point: new (x: number, y: number) => KakaoPoint;
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
    clickable?: boolean;
  }) => KakaoCustomOverlay;
  event: {
    addListener(target: KakaoMap, type: "idle" | "click" | "dragstart", handler: () => void): void;
    removeListener(target: KakaoMap, type: "idle" | "click" | "dragstart", handler: () => void): void;
  };
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}
