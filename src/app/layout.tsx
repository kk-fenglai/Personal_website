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
  title: "Waiting for the Wind | Thoughts & Gallery",
  description:
    "A place to pause and record. Thoughts, photos—shared or kept—all gathered in quiet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-locale="en"
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
