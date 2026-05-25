"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const ALLOWED_PATHS = ["/verify", "/admin"];

export function AccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const isAllowedPath = ALLOWED_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (isAllowedPath) return;
    fetch("/api/access/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.allowed) {
          setAllowed(true);
        } else {
          setAllowed(false);
          router.replace("/verify");
        }
      })
      .catch(() => {
        setAllowed(false);
        router.replace("/verify");
      });
  }, [isAllowedPath, router]);

  if (isAllowedPath) {
    return <>{children}</>;
  }

  if (allowed === null || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted text-sm">加载中…</p>
      </div>
    );
  }

  return <>{children}</>;
}
