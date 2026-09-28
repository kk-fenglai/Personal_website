"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-bg/50 px-4 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-fg/30 focus:border-fg";

/** 只允许站内相对路径，防止开放重定向 */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

function VerifyContent() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const next = safeNext(searchParams.get("next"));

  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (token) {
          const res = await fetch("/api/access/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          if (res.ok) {
            router.replace(next);
            return;
          }
          if (!cancelled) setError(t("verify.tokenInvalid"));
        } else {
          const data = await fetch("/api/access/check").then((r) => r.json());
          if (data.allowed && next !== "/") {
            router.replace(next);
            return;
          }
        }
      } catch {
        if (!cancelled) setError(t("common.errorNetwork"));
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
    // t 随语言切换变化，不应重新触发验证
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, next, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("verify.fillName"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/access/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("common.errorNetwork"));
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t("common.errorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return <p className="text-muted text-sm text-center">{t("admin.loading")}</p>;
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="type-display-lg text-fg mb-6 leading-tight">{t("verify.title")}</h1>
      <p className="type-body-lg text-muted reading mb-10">{t("verify.intro")}</p>

      {submitted ? (
        <p className="type-body-lg text-fg reading">{t("verify.submitted")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-base text-red-500">{error}</p>}
          <div>
            <label htmlFor="name" className="block section-label mb-2">
              {t("verify.name")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("verify.namePlaceholder")}
              maxLength={64}
              className={INPUT_CLASS}
              required
            />
          </div>
          <div>
            <label htmlFor="contact" className="block section-label mb-2">
              {t("verify.contact")}
            </label>
            <input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("verify.contactPlaceholder")}
              maxLength={200}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="message" className="block section-label mb-2">
              {t("verify.message")}
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("verify.messagePlaceholder")}
              maxLength={1000}
              rows={4}
              className={INPUT_CLASS}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-fg text-bg py-2.5 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? t("verify.submitting") : t("verify.submit")}
          </button>
        </form>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <section className="min-h-[70vh] site-container mx-auto flex items-center justify-center py-24">
      <Suspense fallback={null}>
        <VerifyContent />
      </Suspense>
    </section>
  );
}
