"use client";

import { OverlayProvider } from "overlay-kit";
import { ReactNode } from "react";

// 앱 전역 Provider. overlay-kit은 모달을 함수로 열 때(overlay.open) 필요하다
export default function AppProviders({ children }: { children: ReactNode }) {
  return <OverlayProvider>{children}</OverlayProvider>;
}
