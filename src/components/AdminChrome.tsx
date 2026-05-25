"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="admin-root min-h-screen">
      <header className="admin-topbar sticky top-0 z-40 border-b border-border">
        <div className="admin-panel flex items-center justify-between gap-4 py-4">
          <Link href="/" className="text-sm font-medium text-muted hover:text-fg transition-colors">
            ← {t("admin.backToSite")}
          </Link>
          <span className="text-sm text-muted">{t("admin.title")}</span>
        </div>
      </header>
      <div className="admin-panel admin-panel-main">{children}</div>
    </div>
  );
}
