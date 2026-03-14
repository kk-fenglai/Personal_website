"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <p className="text-muted text-sm">加载中…</p>
    </div>
  );
}
