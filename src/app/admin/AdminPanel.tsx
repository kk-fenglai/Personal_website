"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";

type Thought = {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string;
};

type Photo = {
  id: string;
  filename: string;
  caption: string | null;
  isPublic: boolean;
  createdAt: string;
};

export function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const { t, dateLocale } = useLocale();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"thoughts" | "photos" | "new-thought" | "upload" | "access">("thoughts");

  const load = () => {
    Promise.all([
      fetch("/api/thoughts").then((r) => r.json()),
      fetch("/api/photos").then((r) => r.json()),
    ]).then(([tData, pData]) => {
      setThoughts(Array.isArray(tData) ? tData : []);
      setPhotos(Array.isArray(pData) ? pData : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-fg">{t("admin.title")}</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-base text-muted hover:text-fg"
        >
          {t("admin.logout")}
        </button>
      </div>

      <div className="flex flex-wrap gap-6 border-b border-border pb-3 text-base">
        {[
          ["thoughts", t("admin.tabThoughts")],
          ["new-thought", t("admin.tabNewThought")],
          ["photos", t("admin.tabPhotos")],
          ["upload", t("admin.tabUpload")],
          ["access", t("admin.accessRequests")],
        ].map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`relative py-1 transition-colors ${
              activeTab === tab ? "text-fg font-medium" : "text-muted hover:text-fg"
            } ${activeTab === tab ? "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-fg" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "thoughts" && (
        <ThoughtListAdmin
          thoughts={thoughts}
          loading={loading}
          onToggle={load}
        />
      )}
      {activeTab === "new-thought" && (
        <NewThoughtForm onSuccess={() => { setActiveTab("thoughts"); load(); }} />
      )}
      {activeTab === "photos" && (
        <PhotoListAdmin
          photos={photos}
          loading={loading}
          onToggle={load}
        />
      )}
      {activeTab === "upload" && (
        <UploadPhotoForm onSuccess={() => { setActiveTab("photos"); load(); }} />
      )}
      {activeTab === "access" && <AccessRequestsList />}
    </div>
  );
}

type AccessReq = {
  id: string;
  name: string;
  contact: string | null;
  message: string | null;
  status: string;
  accessToken: string | null;
  createdAt: string;
};

function AccessRequestsList() {
  const { t, dateLocale } = useLocale();
  const [list, setList] = useState<AccessReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/access/requests")
      .then((r) => r.json())
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const approve = async (id: string) => {
    const res = await fetch(`/api/access/requests/${id}/approve`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return;
    setList((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "approved", accessToken: data.token } : r
      )
    );
  };

  const copyAccessLink = (token: string, id: string) => {
    const link = typeof window !== "undefined" ? `${window.location.origin}/verify?token=${token}` : "";
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="text-muted text-base">{t("admin.loading")}</div>;
  if (list.length === 0) {
    return <p className="text-muted text-base">{t("admin.accessEmpty")}</p>;
  }

  return (
    <ul className="space-y-3">
      {list.map((r) => (
        <li
          key={r.id}
          className="p-4 border border-border flex flex-col gap-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-medium text-fg">{r.name}</span>
              {r.contact && (
                <span className="text-muted text-base ml-2">{r.contact}</span>
              )}
            </div>
            <span
              className={`text-sm px-2 py-0.5 rounded ${
                r.status === "approved"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : r.status === "rejected"
                    ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {r.status === "approved"
                ? t("admin.approved")
                : r.status === "rejected"
                  ? t("admin.rejected")
                  : t("admin.pending")}
            </span>
          </div>
          {r.message && (
            <p className="text-muted text-base">{r.message}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted">
            <time dateTime={r.createdAt}>
              {new Date(r.createdAt).toLocaleString(dateLocale)}
            </time>
          </div>
          {r.status === "pending" && (
            <button
              type="button"
              onClick={() => approve(r.id)}
              className="self-start text-fg text-base font-medium border-b border-fg pb-0.5 hover:opacity-70"
            >
              {t("admin.approve")}
            </button>
          )}
          {r.status === "approved" && r.accessToken && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyAccessLink(r.accessToken!, r.id)}
                className="text-base text-fg font-medium border-b border-fg pb-0.5 hover:opacity-70"
              >
                {copiedId === r.id ? t("admin.copied") : t("admin.copyLink")}
              </button>
              <span className="text-xs text-muted">
                （{t("admin.copyLinkHint")}）
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function ThoughtListAdmin({
  thoughts,
  loading,
  onToggle,
}: {
  thoughts: Thought[];
  loading: boolean;
  onToggle: () => void;
}) {
  const { t, dateLocale } = useLocale();

  const toggle = async (id: string, isPublic: boolean) => {
    await fetch(`/api/thoughts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    onToggle();
  };

  if (loading) return <div className="text-muted">{t("admin.loading")}</div>;
  if (thoughts.length === 0) {
    return (
      <p className="text-muted">{t("admin.thoughtsEmpty")}</p>
    );
  }

  return (
    <ul className="space-y-3">
      {thoughts.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between p-4 border border-border"
        >
          <div>
            <Link href={`/thoughts/${item.id}`} className="font-medium text-fg hover:opacity-70">
              {item.title}
            </Link>
            <span className="ml-2 text-sm text-muted">
              {new Date(item.createdAt).toLocaleDateString(dateLocale)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggle(item.id, item.isPublic)}
            className={`text-sm px-3 py-1.5 rounded-full ${
              item.isPublic
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {item.isPublic ? t("admin.visibilityPublic") : t("admin.visibilityPrivate")}
          </button>
        </li>
      ))}
    </ul>
  );
}

function NewThoughtForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLocale();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("common.errorNetwork"));
        return;
      }
      setTitle("");
      setContent("");
      onSuccess();
    } catch {
      setError(t("common.errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error && <p className="text-base text-red-600 dark:text-red-400">{error}</p>}
      <div>
        <label className="block section-label mb-2">{t("admin.formTitle")}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-b border-border bg-transparent px-0 py-2 text-base text-fg focus:outline-none focus:border-fg"
          required
        />
      </div>
      <div>
        <label className="block section-label mb-2">{t("admin.formContent")}</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full border border-border bg-transparent px-3 py-2 text-base text-fg resize-none focus:outline-none focus:border-fg"
          required
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        <span className="text-base text-fg">{t("admin.formPublicLabel")}</span>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="text-fg text-base font-medium border-b border-fg pb-0.5 hover:opacity-70 disabled:opacity-50"
      >
        {loading ? t("admin.publishing") : t("admin.publish")}
      </button>
    </form>
  );
}

function PhotoListAdmin({
  photos,
  loading,
  onToggle,
}: {
  photos: Photo[];
  loading: boolean;
  onToggle: () => void;
}) {
  const { t } = useLocale();

  const toggle = async (id: string, isPublic: boolean) => {
    await fetch(`/api/photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    onToggle();
  };

  if (loading) return <div className="text-muted">{t("admin.loading")}</div>;
  if (photos.length === 0) {
    return (
      <p className="text-muted">{t("admin.photosEmpty")}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {photos.map((p) => (
        <div
          key={p.id}
          className="border border-border overflow-hidden"
        >
          <div className="aspect-square relative bg-border">
            <img
              src={p.filename}
              alt={p.caption || ""}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-2 flex items-center justify-between gap-2">
            <span className="text-sm text-muted truncate flex-1">
              {p.caption || t("admin.noCaption")}
            </span>
            <button
              type="button"
              onClick={() => toggle(p.id, p.isPublic)}
              className={`text-sm px-2 py-1 rounded shrink-0 ${
                p.isPublic
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {p.isPublic ? t("admin.visibilityPublic") : t("admin.visibilityPrivate")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function UploadPhotoForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t("admin.selectImage"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("caption", caption);
      form.append("isPublic", String(isPublic));
      const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("common.errorNetwork"));
        return;
      }
      setFile(null);
      setCaption("");
      onSuccess();
    } catch {
      setError(t("common.errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && <p className="text-base text-red-600 dark:text-red-400">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-fg mb-1">{t("admin.selectImage")}</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-base text-fg file:mr-4 file:py-2 file:px-4 file:border file:border-border file:bg-transparent file:text-fg"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-fg mb-1">{t("admin.captionOptional")}</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t("admin.captionPlaceholder")}
          className="w-full border-b border-border bg-transparent px-0 py-2 text-base text-fg placeholder:text-muted focus:outline-none focus:border-fg"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        <span className="text-base text-fg">{t("admin.formPublicLabel")}</span>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="text-fg text-base font-medium border-b border-fg pb-0.5 hover:opacity-70 disabled:opacity-50"
      >
        {loading ? t("admin.uploading") : t("admin.upload")}
      </button>
    </form>
  );
}
