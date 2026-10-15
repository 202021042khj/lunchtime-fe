"use client";

import { Suspense } from "react";
import AdminLoginPage from "@/components/pages/admin/login/AdminLoginPage";
import { useAdminLoginLogic } from "@/hooks/useAdminLoginLogic";

// 어드민 로그인. 어드민은 데스크톱 전용이라 화면을 하나만 둔다 (좁은 폭은 카드가 줄어든다)
function AdminLoginContent() {
  const logic = useAdminLoginLogic();
  return <AdminLoginPage {...logic} />;
}

// useSearchParams(?next=)를 쓰므로 Suspense로 감싼다
export default function Page() {
  return (
    <Suspense>
      <AdminLoginContent />
    </Suspense>
  );
}
