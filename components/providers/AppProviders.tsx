"use client";

import { OverlayProvider } from "overlay-kit";
import { ReactNode, useEffect } from "react";
import { notify } from "@/components/ui/notify/notify-utils";
import { refreshSession, takeFlash } from "@/lib/sessionStore";

// 앱 전역 Provider. overlay-kit은 모달을 함수로 열 때(overlay.open) 필요하다
export default function AppProviders({ children }: { children: ReactNode }) {
  // 로그인 상태는 앱이 뜰 때 한 번 확인한다 (로그인 필요 팝업을 미리 띄우기 위해)
  useEffect(() => {
    refreshSession();
    const flash = takeFlash();
    if (flash) notify.success(flash);
  }, []);

  return <OverlayProvider>{children}</OverlayProvider>;
}
