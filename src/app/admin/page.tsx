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
      <div className="py-16 text-center text-muted">{t("admin.loading")}</div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-login-card card max-w-md mx-auto space-y-6">
        <div>
          <p className="section-label mb-2 normal-case tracking-normal">{t("nav.siteName")}</p>
          <h1 className="text-2xl font-semibold text-fg">{t("admin.title")}</h1>
          <p className="text-muted text-sm mt-2">{t("admin.loginHint")}</p>
        </div>
        <LoginForm onSuccess={onLogin} />
      </div>
    );
  }

  return <AdminPanel onLogout={onLogout} />;
}
