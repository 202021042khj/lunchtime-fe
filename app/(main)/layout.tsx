import DesktopTopNav from "@/components/layout/DesktopTopNav";
import MobileTabBar from "@/components/layout/MobileTabBar";

// 사용자 화면 공통 틀: 태블릿 이상은 상단 메뉴바, 모바일은 하단 탭바 (기능명세 · 반응형 규칙)
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="hidden md:block">
        <DesktopTopNav />
      </div>
      {children}
      <div className="md:hidden">
        <MobileTabBar />
      </div>
    </>
  );
}
