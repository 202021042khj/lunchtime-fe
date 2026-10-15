"use client";

import { Suspense } from "react";
import UsersPage from "@/components/pages/admin/users/UsersPage";
import { useAdminUsersLogic } from "@/hooks/useAdminUsersLogic";

// 어드민 · 유저 관리 (기능명세 어드민)
function UsersContent() {
  const logic = useAdminUsersLogic();
  return <UsersPage {...logic} />;
}

// useSearchParams(?q= &status= &page=)를 쓰므로 Suspense로 감싼다
export default function Page() {
  return (
    <Suspense>
      <UsersContent />
    </Suspense>
  );
}
