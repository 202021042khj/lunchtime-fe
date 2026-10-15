"use client";

import { Suspense } from "react";
import DesktopPage from "@/components/pages/signup/DesktopPage";
import MobilePage from "@/components/pages/signup/MobilePage";
import { useSignupLogic } from "@/hooks/useSignupLogic";

// 이메일 가입 (자체 계정)
function SignupContent() {
  const logic = useSignupLogic();

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
export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}
