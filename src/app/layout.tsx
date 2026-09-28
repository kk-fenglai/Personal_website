import type { Metadata } from "next";
import { Instrument_Serif, Noto_Serif_SC, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { SeasonProvider } from "@/contexts/SeasonContext";
import { ClientLayout } from "@/components/ClientLayout";

const sourceSans3 = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display-latin",
  display: "swap",
});

const notoSerifSc = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display-zh",
  display: "swap",
});

export const metadata: Metadata = {
  title: "等风来的小站 | 随想与相册",
  description: "这里是停顿与记录。随想、相册，或藏或显，皆在静处完成。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-locale="zh"
      data-season="winter"
      className={`${sourceSans3.variable} ${instrumentSerif.variable} ${notoSerifSc.variable}`}
    >
      <body className="min-h-screen font-body antialiased bg-bg text-fg">
        <LocaleProvider>
          <SeasonProvider>
            <ClientLayout>{children}</ClientLayout>
          </SeasonProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
