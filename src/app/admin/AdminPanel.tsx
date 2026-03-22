"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { BoldableContentField } from "@/components/BoldableContentField";

type Thought = {
  id: string;
  title: string;
  content: string;
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
  const [activeTab, setActiveTab] = useState<
    "thoughts" | "photos" | "new-thought" | "upload" | "access" | "visits"
  >("thoughts");
  const [editingThought, setEditingThought] = useState<Thought | null>(null);

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
          ["visits", t("admin.tabVisits")],
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
          onEdit={setEditingThought}
          editingThought={editingThought}
          onCancelEdit={() => setEditingThought(null)}
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
      {activeTab === "visits" && <VisitLogsList />}
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

type VisitLogRow = {
  id: string;
  path: string;
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  deviceModel: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  createdAt: string;
};

function formatVisitLocation(row: VisitLogRow): string {
  const parts = [row.city, row.region, row.country].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function formatVisitClient(row: VisitLogRow): string {
  const env = [row.browser, row.os].filter(Boolean).join(" · ");
  const dev = [row.deviceType, row.deviceModel].filter(Boolean).join(" · ");
  if (env && dev) return `${env} · ${dev}`;
  return env || dev || "—";
}

const VISIT_PAGE_SIZE = 80;

function VisitLogsList() {
  const { t, dateLocale } = useLocale();
  const [items, setItems] = useState<VisitLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = (skip: number, append: boolean) => {
    const run = append ? setLoadingMore : setLoading;
    run(true);
    fetch(`/api/visit-logs?take=${VISIT_PAGE_SIZE}&skip=${skip}`)
      .then((r) => r.json())
      .then((data: { items?: VisitLogRow[]; total?: number }) => {
        const next = Array.isArray(data.items) ? data.items : [];
        setTotal(typeof data.total === "number" ? data.total : 0);
        setItems((prev) => (append ? [...prev, ...next] : next));
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    fetchPage(0, false);
  }, []);

  if (loading) {
    return <div className="text-muted text-base">{t("admin.loading")}</div>;
  }

  if (items.length === 0) {
    return <p className="text-muted text-base max-w-xl">{t("admin.visitsEmpty")}</p>;
  }

  const hasMore = items.length < total;

  return (
    <div className="space-y-4">
      <p className="text-muted text-sm">
        {t("admin.visitsTotal", { count: total })}
      </p>
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-left text-sm min-w-[960px]">
          <thead className="bg-bg-card border-b border-border">
            <tr>
              <th className="px-3 py-2 font-medium text-fg">{t("admin.visitsTime")}</th>
              <th className="px-3 py-2 font-medium text-fg">{t("admin.visitsPath")}</th>
              <th className="px-3 py-2 font-medium text-fg whitespace-nowrap">{t("admin.visitsIp")}</th>
              <th className="px-3 py-2 font-medium text-fg">{t("admin.visitsLocation")}</th>
              <th className="px-3 py-2 font-medium text-fg">{t("admin.visitsClient")}</th>
              <th className="px-3 py-2 font-medium text-fg">{t("admin.visitsReferer")}</th>
              <th className="px-3 py-2 font-medium text-fg">{t("admin.visitsUa")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 align-top">
                <td className="px-3 py-2 text-muted tabular-nums whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString(dateLocale)}
                </td>
                <td className="px-3 py-2 font-mono text-fg break-all max-w-[200px]">
                  {row.path}
                </td>
                <td className="px-3 py-2 text-muted whitespace-nowrap">{row.ip ?? "—"}</td>
                <td className="px-3 py-2 text-muted break-words max-w-[200px]">
                  <span title={formatVisitLocation(row)}>{formatVisitLocation(row)}</span>
                </td>
                <td className="px-3 py-2 text-muted break-words max-w-[200px]">
                  <span title={formatVisitClient(row)}>{formatVisitClient(row)}</span>
                </td>
                <td className="px-3 py-2 text-muted break-all max-w-[160px]">
                  {row.referer ? (
                    <span title={row.referer}>{row.referer}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-muted break-all max-w-[220px]">
                  {row.userAgent ? (
                    <span title={row.userAgent}>{row.userAgent}</span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => fetchPage(items.length, true)}
          className="text-fg text-base font-medium border-b border-fg pb-0.5 hover:opacity-70 disabled:opacity-50"
        >
          {loadingMore ? "…" : t("admin.visitsLoadMore")}
        </button>
      )}
    </div>
  );
}

function ThoughtListAdmin({
  thoughts,
  loading,
  onToggle,
  onEdit,
  editingThought,
  onCancelEdit,
}: {
  thoughts: Thought[];
  loading: boolean;
  onToggle: () => void;
  onEdit: (thought: Thought) => void;
  editingThought: Thought | null;
  onCancelEdit: () => void;
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
  if (thoughts.length === 0 && !editingThought) {
    return (
      <p className="text-muted">{t("admin.thoughtsEmpty")}</p>
    );
  }

  if (editingThought) {
    return (
      <EditThoughtForm
        thought={editingThought}
        onSuccess={() => {
          onCancelEdit();
          onToggle();
        }}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {thoughts.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 p-4 border border-border rounded-xl bg-bg-card"
        >
          <div className="min-w-0 flex-1">
            <Link href={`/thoughts/${item.id}`} className="font-medium text-fg hover:opacity-70">
              {item.title}
            </Link>
            <span className="ml-2 text-sm text-muted">
              {new Date(item.createdAt).toLocaleDateString(dateLocale)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="text-sm px-3 py-1.5 rounded-lg border border-border text-fg hover:bg-bg"
            >
              {t("admin.editThought")}
            </button>
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
          </div>
        </li>
      ))}
    </ul>
  );
}

function EditThoughtForm({
  thought,
  onSuccess,
  onCancel,
}: {
  thought: Thought;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState(thought.title);
  const [content, setContent] = useState(thought.content);
  const [isPublic, setIsPublic] = useState(thought.isPublic);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!window.confirm(t("admin.deleteThoughtConfirm"))) return;
    setError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/thoughts/${thought.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || t("common.errorNetwork"));
        return;
      }
      onSuccess();
    } catch {
      setError(t("common.errorNetwork"));
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/thoughts/${thought.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("common.errorNetwork"));
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
    <div className="space-y-4 max-w-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-fg">{t("admin.editThought")}：{thought.title}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted hover:text-fg"
        >
          {t("admin.cancel")}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <BoldableContentField
            value={content}
            onChange={setContent}
            placeholder={t("admin.contentPlaceholder")}
            required
            rows={14}
            className="w-full min-h-[320px] border border-border rounded-xl bg-bg-card px-4 py-4 text-base text-fg leading-relaxed placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-warm/40 focus:border-warm resize-y"
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
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || deleting}
            className="px-5 py-2.5 rounded-xl text-base font-medium bg-fg text-bg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("admin.updating") : t("admin.saveChanges")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl text-base border border-border text-muted hover:text-fg disabled:opacity-50"
          >
            {t("admin.cancel")}
          </button>
        </div>
      </form>

      <div className="pt-6 border-t border-border">
        <p className="section-label mb-2">{t("admin.deleteThought")}</p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading || deleting}
          className="px-5 py-2.5 rounded-xl text-base font-medium border border-red-500/60 text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          {deleting ? t("admin.deletingThought") : t("admin.deleteThoughtButton")}
        </button>
      </div>
    </div>
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
        <BoldableContentField
          value={content}
          onChange={setContent}
          placeholder={t("admin.contentPlaceholder")}
          required
          rows={14}
          className="w-full min-h-[320px] border border-border rounded-xl bg-bg-card px-4 py-4 text-base text-fg leading-relaxed placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-warm/40 focus:border-warm resize-y"
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleVisibility = async (id: string, isPublic: boolean) => {
    await fetch(`/api/photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    onToggle();
  };

  const startEdit = (p: Photo) => {
    setEditingId(p.id);
    setEditCaption(p.caption ?? "");
  };

  const saveCaption = async (id: string) => {
    await fetch(`/api/photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: editCaption || null }),
    });
    setEditingId(null);
    onToggle();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCaption("");
  };

  const deletePhoto = async (id: string) => {
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    setDeletingId(null);
    onToggle();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        {t("admin.loading")}
      </div>
    );
  }
  if (photos.length === 0) {
    return (
      <p className="text-muted py-6">{t("admin.photosEmpty")}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {photos.map((p) => (
        <div
          key={p.id}
          className="rounded-xl border border-border bg-bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="aspect-square relative bg-border">
            <img
              src={p.filename}
              alt={p.caption || ""}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  p.isPublic
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                }`}
              >
                {p.isPublic ? t("admin.visibilityPublic") : t("admin.visibilityPrivate")}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {editingId === p.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder={t("admin.captionPlaceholder")}
                  className="w-full border border-border rounded-lg px-3 py-2 text-base bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-warm/50"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveCaption(p.id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-warm text-white hover:opacity-90"
                  >
                    {t("admin.saveCaption")}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted hover:text-fg"
                  >
                    {t("admin.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-fg min-h-[1.5rem]">
                {p.caption || (
                  <span className="text-muted">{t("admin.noCaption")}</span>
                )}
              </p>
            )}
            {editingId !== p.id && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="text-sm text-warm hover:underline"
                >
                  {t("admin.editCaption")}
                </button>
                <button
                  type="button"
                  onClick={() => toggleVisibility(p.id, p.isPublic)}
                  className={`text-sm px-2.5 py-1 rounded-lg ${
                    p.isPublic
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {p.isPublic ? t("admin.visibilityPublic") : t("admin.visibilityPrivate")}
                </button>
                {deletingId === p.id ? (
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-muted">{t("admin.deletePhotoConfirm")}</span>
                    <button
                      type="button"
                      onClick={() => deletePhoto(p.id)}
                      className="text-red-600 dark:text-red-400 font-medium"
                    >
                      {t("admin.deletePhoto")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      className="text-muted"
                    >
                      {t("admin.cancel")}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingId(p.id)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    {t("admin.deletePhoto")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function UploadPhotoForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLocale();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const accept = "image/jpeg,image/png,image/gif,image/webp";

  const addFiles = (newFiles: FileList | File[]) => {
    const list = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setFiles((prev) => [...prev, ...list]);
    setPreviews((prev) => [...prev, ...list.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAll = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError(t("admin.selectImage"));
      return;
    }
    setError("");
    setLoading(true);
    setUploadProgress({ current: 0, total: files.length });
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        const form = new FormData();
        form.append("file", files[i]);
        form.append("caption", caption);
        form.append("isPublic", String(isPublic));
        const res = await fetch("/api/photos/upload", {
          method: "POST",
          body: form,
          credentials: "same-origin",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t("common.errorNetwork"));
          setUploadProgress(null);
          setLoading(false);
          return;
        }
      }
      clearAll();
      setCaption("");
      onSuccess();
    } catch {
      setError(t("common.errorNetwork"));
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const list = e.dataTransfer.files;
    if (list?.length) addFiles(list);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <p className="text-base text-red-600 dark:text-red-400">{error}</p>
      )}
      <div>
        <input
          type="file"
          accept={accept}
          multiple
          onChange={(e) => {
            const list = e.target.files;
            if (list?.length) addFiles(list);
            e.target.value = "";
          }}
          className="sr-only"
          id="photo-upload"
        />
        <label
          htmlFor="photo-upload"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`block rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-warm bg-warm/10"
              : "border-border hover:border-warm/50 hover:bg-bg-card"
          }`}
        >
          <p className="text-fg font-medium mb-1">{t("admin.dragDropHint")}</p>
          <p className="text-sm text-muted">{t("admin.selectImage")}</p>
        </label>
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{t("admin.batchCount").replace("{count}", String(files.length))}</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-muted hover:text-fg"
            >
              {t("admin.cancel")}
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {previews.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-bg-card group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={t("admin.cancel")}
                >
                  ×
                </button>
                <span className="absolute bottom-0 left-0 right-0 py-0.5 px-1 text-[10px] text-white bg-black/60 truncate block">
                  {files[i].name}
                </span>
              </div>
            ))}
          </div>
          {/* 选图后立即显示的上传按钮，避免被遮挡或需要滚动 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-base font-semibold bg-fg text-bg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && uploadProgress
                ? t("admin.uploadingCount").replace("{current}", String(uploadProgress.current)).replace("{total}", String(uploadProgress.total))
                : t("admin.upload")}
            </button>
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-fg mb-1">
          {t("admin.captionOptional")}
        </label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t("admin.captionPlaceholder")}
          className="w-full border border-border rounded-lg px-3 py-2 text-base bg-bg text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-warm/50"
        />
        <p className="text-xs text-muted mt-1">{t("admin.captionBatchHint")}</p>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        <span className="text-base text-fg">{t("admin.formPublicLabel")}</span>
      </label>
    </form>
  );
}
