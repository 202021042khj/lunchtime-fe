"use client";

import { Suspense } from "react";
import DesktopPage from "@/components/pages/login/DesktopPage";
import MobilePage from "@/components/pages/login/MobilePage";
import { useLoginLogic } from "@/hooks/useLoginLogic";

// 로그인 (기능명세 9). 메뉴바 · 탭바 없는 단독 화면
function LoginContent() {
  const logic = useLoginLogic();

  return (
    <div className="flex flex-1 flex-col">
      <div className="hidden md:flex md:flex-1">
        <DesktopPage {...logic} />
      </div>
      <div className="flex flex-1 md:hidden">
        <MobilePage {...logic} />
      </div>
    </div>
  );
}

// useSearchParams(?next=)를 쓰므로 Suspense로 감싼다
export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
