"use client";

import { Suspense } from "react";
import MenusPage from "@/components/pages/admin/menus/MenusPage";
import { useAdminMenusLogic } from "@/hooks/useAdminMenusLogic";

// 어드민 · 메뉴 관리 (기능명세 어드민)
function MenusContent() {
  const logic = useAdminMenusLogic();
  return <MenusPage {...logic} />;
}

// useSearchParams(?q= &filter= &page=)를 쓰므로 Suspense로 감싼다
export default function Page() {
  return (
    <Suspense>
      <MenusContent />
    </Suspense>
  );
}
