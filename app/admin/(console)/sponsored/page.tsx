"use client";

import SponsoredPage from "@/components/pages/admin/sponsored/SponsoredPage";
import { useAdminSponsoredLogic } from "@/hooks/useAdminSponsoredLogic";

// 어드민 · 광고 식당 고정 (기능명세 어드민)
export default function Page() {
  const logic = useAdminSponsoredLogic();
  return <SponsoredPage {...logic} />;
}
