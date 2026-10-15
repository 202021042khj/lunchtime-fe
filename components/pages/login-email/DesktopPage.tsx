import AuthScreen from "@/components/domain/auth/AuthScreen";
import EmailLoginFormSection from "@/components/pages/login-email/sections/EmailLoginFormSection";
import { UseEmailLoginLogicResult } from "@/hooks/useEmailLoginLogic";

// 이메일 로그인 · 데스크톱: 화면 가운데 440px 카드
export default function DesktopPage(logic: UseEmailLoginLogicResult) {
  return (
    <AuthScreen variant="desktop">
      <EmailLoginFormSection logic={logic} />
    </AuthScreen>
  );
}
