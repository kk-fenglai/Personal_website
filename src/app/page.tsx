import type { Metadata } from "next";
import { HomeView } from "./HomeView";

const TITLE = "等风来的小站 | 随想与相册";
const DESCRIPTION = "这里是停顿与记录。随想、相册，或藏或显，皆在静处完成。";

export const metadata: Metadata = {
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/api/og/home", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function Home() {
  return <HomeView />;
}
