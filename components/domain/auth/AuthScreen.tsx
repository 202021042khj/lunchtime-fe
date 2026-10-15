import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// 로그인 계열 화면의 바탕 (메뉴바 · 탭바 없음).
// 데스크톱은 카드를 가운데, 모바일은 입력할 때 키보드에 버튼이 가리지 않게 위에서부터 쌓는다
export default function AuthScreen({ variant, children }: { variant: "desktop" | "mobile"; children: ReactNode }) {
  return (
    <main
      className={cn(
        "flex min-h-dvh w-full",
        variant === "desktop"
          ? "items-center justify-center px-6 py-12"
          : "items-start px-4 pt-[calc(env(safe-area-inset-top)+24px)] pb-[calc(env(safe-area-inset-bottom)+24px)]",
      )}
    >
      {children}
    </main>
  );
}
