"use client";

import { Suspense } from "react";
import DesktopPage from "@/components/pages/password-reset/DesktopPage";
import MobilePage from "@/components/pages/password-reset/MobilePage";
import { usePasswordResetLogic } from "@/hooks/usePasswordResetLogic";

// 비밀번호 재설정 (자체 계정)
function PasswordResetContent() {
  const logic = usePasswordResetLogic();

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
export default function PasswordResetPage() {
  return (
    <Suspense>
      <PasswordResetContent />
    </Suspense>
  );
}
