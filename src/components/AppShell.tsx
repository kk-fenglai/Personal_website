"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InlineLanguageSwitcher } from "./InlineLanguageSwitcher";
import { useLocale } from "@/contexts/LocaleContext";

const NAV = [
  { href: "/", key: "nav.home" },
  { href: "/thoughts", key: "nav.thoughts" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/about", key: "nav.about" },
  { href: "/admin", key: "nav.admin" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();

  return (
    <>
      <header className="site-header fixed top-0 left-0 right-0 z-50">
        <div className="site-container mx-auto py-6 flex items-center justify-between gap-6">
          <Link href="/" className="site-brand text-fg hover:opacity-80 transition-opacity shrink-0">
            {t("nav.siteName")}
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "nav-link nav-link-active" : "nav-link"}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <InlineLanguageSwitcher />
            <nav className="flex md:hidden items-center gap-4 overflow-x-auto">
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link whitespace-nowrap ${active ? "nav-link-active" : ""}`}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="site-main relative z-10 w-full">{children}</main>
      <footer className="relative z-10 border-t border-border py-16">
        <div className="site-container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <span className="section-label !text-fg tracking-widest">{t("nav.siteName")}</span>
          <p className="type-caption text-center">
            © {new Date().getFullYear()} {t("nav.siteName")}. {t("footer.rights")}
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="type-caption text-warm hover:opacity-80 transition-opacity"
          >
            ↑ {t("footer.backToTop")}
          </button>
        </div>
      </footer>
    </>
  );
}
