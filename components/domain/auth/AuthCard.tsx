import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";
import LogoMark from "@/components/common/LogoMark";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: ReactNode;
  // 이메일 화면은 뒤로 버튼, 첫 로그인 화면은 로고
  onBack?: () => void;
  showLogo?: boolean;
  children: ReactNode;
  className?: string;
}

// 로그인 · 이메일 로그인 · 가입 · 비밀번호 재설정 공용 카드 (Figma 09 Login Card 34:1332 스타일)
export default function AuthCard({ title, description, onBack, showLogo = false, children, className }: AuthCardProps) {
  return (
    <section
      className={cn(
        "relative flex w-full flex-col items-center gap-3 rounded-[32px] border border-white bg-white/78 px-6 pt-10 pb-8 shadow-[0_16px_48px_rgba(64,38,20,0.1)] md:w-[440px] md:px-10",
        className,
      )}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full text-labels-primary hover:bg-fills-quaternary"
        >
          <ChevronLeft aria-hidden className="size-6" />
        </button>
      )}
      {showLogo && <LogoMark className="size-14 [&_img]:size-[35px]" />}
      <h1 className="text-title-2 font-bold text-labels-primary">{title}</h1>
      {description && <p className="text-subheadline break-keep text-center text-labels-secondary">{description}</p>}
      {children}
    </section>
  );
}
