"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";

export function LoginForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { t } = useLocale();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("login.failed"));
        return;
      }
      onSuccess();
    } catch {
      setError(t("common.errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-base text-red-500">{error}</p>
      )}
      <div>
        <label htmlFor="username" className="block section-label mb-2">
          {t("login.username")}
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg/50 px-4 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-fg/30 focus:border-fg"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block section-label mb-2">
          {t("login.password")}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg/50 px-4 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-fg/30 focus:border-fg"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-fg text-bg py-2.5 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? t("login.submitting") : t("login.submit")}
      </button>
    </form>
  );
}
