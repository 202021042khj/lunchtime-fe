import AuthScreen from "@/components/domain/auth/AuthScreen";
import SignupFormSection from "@/components/pages/signup/sections/SignupFormSection";
import { UseSignupLogicResult } from "@/hooks/useSignupLogic";

// 이메일 가입 · 데스크톱: 화면 가운데 440px 카드
export default function DesktopPage(logic: UseSignupLogicResult) {
  return (
    <AuthScreen variant="desktop">
      <SignupFormSection logic={logic} />
    </AuthScreen>
  );
}
