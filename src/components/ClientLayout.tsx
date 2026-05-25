"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { AdminChrome } from "./AdminChrome";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <AdminChrome>{children}</AdminChrome>;
  }

  return <AppShell>{children}</AppShell>;
}
