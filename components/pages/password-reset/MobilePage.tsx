import AuthScreen from "@/components/domain/auth/AuthScreen";
import PasswordResetFormSection from "@/components/pages/password-reset/sections/PasswordResetFormSection";
import { UsePasswordResetLogicResult } from "@/hooks/usePasswordResetLogic";

// 비밀번호 재설정 · 모바일: 같은 카드, 좌우 16px, 위에서부터
export default function MobilePage(logic: UsePasswordResetLogicResult) {
  return (
    <AuthScreen variant="mobile">
      <PasswordResetFormSection logic={logic} />
    </AuthScreen>
  );
}
