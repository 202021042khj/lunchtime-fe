"use client";

import { Suspense } from "react";
import ReportsPage from "@/components/pages/admin/reports/ReportsPage";
import { useAdminReportsLogic } from "@/hooks/useAdminReportsLogic";

// 어드민 · 리뷰 신고 (기능명세 어드민)
function ReportsContent() {
  const logic = useAdminReportsLogic();
  return <ReportsPage {...logic} />;
}

// useSearchParams(?status= &id=)를 쓰므로 Suspense로 감싼다
export default function Page() {
  return (
    <Suspense>
      <ReportsContent />
    </Suspense>
  );
}
