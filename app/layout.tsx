import type { Metadata } from "next";
// 토스트 덮어쓰기는 globals.css에서 :root로 우선순위를 올려 둔다 (react-toastify는 실행 중에 스타일을 또 넣음)
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import NotifyContainer from "@/components/ui/notify/notify-container";
import AppProviders from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "lunchtime",
  description: "날씨와 취향으로 고르는 오늘의 점심",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppProviders>
          {children}
          <NotifyContainer />
        </AppProviders>
      </body>
    </html>
  );
}
