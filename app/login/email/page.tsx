"use client";

import { Suspense } from "react";
import DesktopPage from "@/components/pages/login-email/DesktopPage";
import MobilePage from "@/components/pages/login-email/MobilePage";
import { useEmailLoginLogic } from "@/hooks/useEmailLoginLogic";

// 이메일 로그인 (자체 계정)
function EmailLoginContent() {
  const logic = useEmailLoginLogic();

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

// useSearchParams(?next= · ?email=)를 쓰므로 Suspense로 감싼다
export default function EmailLoginPage() {
  return (
    <Suspense>
      <EmailLoginContent />
    </Suspense>
  );
}
