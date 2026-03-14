import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { SeasonProvider } from "@/contexts/SeasonContext";
import { ClientLayout } from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "等风来的小站 | 随想与相册",
  description: "等风来。留白与沉吟，随想与相册，在静处完成。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-locale="zh" data-season="winter">
      <body className="min-h-screen font-sans antialiased bg-bg text-fg">
        <LocaleProvider>
          <SeasonProvider>
            <ClientLayout>{children}</ClientLayout>
          </SeasonProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
