"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Snowman } from "./Snowman";
import { WaitingWindAtmosphere } from "./WaitingWindAtmosphere";
import { SeasonSwitcher } from "./SeasonSwitcher";
import { useLocale } from "@/contexts/LocaleContext";
import { useSeason } from "@/contexts/SeasonContext";

const NAV = [
  { href: "/", key: "nav.home" },
  { href: "/thoughts", key: "nav.thoughts" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/admin", key: "nav.admin" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const { season } = useSeason();
  const pathname = usePathname();

  return (
    <>
      <div className="bg-waiting-wind" aria-hidden />
      <div className="bg-wind-flow" aria-hidden />
      <WaitingWindAtmosphere />
      <header className="sticky top-0 z-50 border-b border-border bg-bg-sky/90 backdrop-blur-[2px]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-fg font-semibold hover:opacity-80 transition-opacity"
          >
            {t("nav.siteName")}
          </Link>
          <nav className="flex items-center gap-5 text-base">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "text-fg font-medium" : "text-muted hover:text-fg transition-colors"}
                >
                  {t(item.key)}
                </Link>
              );
            })}
            <SeasonSwitcher />
            <LanguageSwitcher />
          </nav>
        </div>
      </header>
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        {children}
      </main>
      {season === "winter" && <Snowman />}
      <footer className="relative z-10 border-t border-border mt-16 py-6">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-base text-muted">
          <span className="font-medium text-fg">{t("nav.siteName")}</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-fg transition-colors"
            >
              ↑ {t("footer.backToTop")}
            </button>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
