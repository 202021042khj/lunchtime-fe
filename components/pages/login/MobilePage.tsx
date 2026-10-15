import LoginCardSection from "@/components/pages/login/sections/LoginCardSection";
import { UseLoginLogicResult } from "@/hooks/useLoginLogic";

// 모바일 로그인: 같은 카드를 화면 폭에 맞춰 가운데에 (좌우 16px)
export default function MobilePage(logic: UseLoginLogicResult) {
  return (
    <main className="flex min-h-dvh w-full items-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <LoginCardSection logic={logic} />
    </main>
  );
}
