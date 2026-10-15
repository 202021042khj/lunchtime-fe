import AuthScreen from "@/components/domain/auth/AuthScreen";
import EmailLoginFormSection from "@/components/pages/login-email/sections/EmailLoginFormSection";
import { UseEmailLoginLogicResult } from "@/hooks/useEmailLoginLogic";

// 이메일 로그인 · 모바일: 같은 카드, 좌우 16px, 위에서부터
export default function MobilePage(logic: UseEmailLoginLogicResult) {
  return (
    <AuthScreen variant="mobile">
      <EmailLoginFormSection logic={logic} />
    </AuthScreen>
  );
}
