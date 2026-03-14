"use client";

import { AppShell } from "./AppShell";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
