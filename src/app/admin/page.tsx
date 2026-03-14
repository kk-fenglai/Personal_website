"use client";

import { useEffect, useState } from "react";
import { AdminPanel } from "./AdminPanel";
import { LoginForm } from "./LoginForm";
import { useLocale } from "@/contexts/LocaleContext";

export default function AdminPage() {
  const { t } = useLocale();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.isAdmin === true))
      .catch(() => setIsAdmin(false));
  }, []);

  const onLogin = () => setIsAdmin(true);
  const onLogout = () => setIsAdmin(false);

  if (isAdmin === null) {
    return (
      <div className="py-12 text-center text-muted">{t("admin.loading")}</div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto space-y-8">
        <p className="section-label">04</p>
        <h1 className="text-3xl font-bold text-fg">{t("admin.title")}</h1>
        <p className="text-muted text-base">{t("admin.loginHint")}</p>
        <LoginForm onSuccess={onLogin} />
      </div>
    );
  }

  return <AdminPanel onLogout={onLogout} />;
}
