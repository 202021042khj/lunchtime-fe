import AuthScreen from "@/components/domain/auth/AuthScreen";
import PasswordResetFormSection from "@/components/pages/password-reset/sections/PasswordResetFormSection";
import { UsePasswordResetLogicResult } from "@/hooks/usePasswordResetLogic";

// 비밀번호 재설정 · 데스크톱: 화면 가운데 440px 카드
export default function DesktopPage(logic: UsePasswordResetLogicResult) {
  return (
    <AuthScreen variant="desktop">
      <PasswordResetFormSection logic={logic} />
    </AuthScreen>
  );
}
