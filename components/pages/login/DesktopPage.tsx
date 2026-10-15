import LoginCardSection from "@/components/pages/login/sections/LoginCardSection";
import { UseLoginLogicResult } from "@/hooks/useLoginLogic";

// Figma: 09 Login · Desktop (34:1331) — 메뉴바 없이 화면 가운데 440px 카드
export default function DesktopPage(logic: UseLoginLogicResult) {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center px-6 py-12">
      <LoginCardSection logic={logic} />
    </main>
  );
}
