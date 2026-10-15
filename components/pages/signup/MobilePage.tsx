import AuthScreen from "@/components/domain/auth/AuthScreen";
import SignupFormSection from "@/components/pages/signup/sections/SignupFormSection";
import { UseSignupLogicResult } from "@/hooks/useSignupLogic";

// 이메일 가입 · 모바일: 같은 카드, 좌우 16px, 위에서부터
export default function MobilePage(logic: UseSignupLogicResult) {
  return (
    <AuthScreen variant="mobile">
      <SignupFormSection logic={logic} />
    </AuthScreen>
  );
}
