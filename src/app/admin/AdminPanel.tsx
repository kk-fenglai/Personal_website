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
  isPinned: boolean;
  pinnedOrder: number | null;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
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
  const { t } = useLocale();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "thoughts" | "photos" | "new-thought" | "upload" | "access" | "visits" | "categories"
  >("thoughts");
  const [editingThought, setEditingThought] = useState<Thought | null>(null);

  const load = () => {
    Promise.all([
      fetch("/api/thoughts").then((r) => r.json()),
      fetch("/api/photos").then((r) => r.json()),
      fetch("/api/thought-categories").then((r) => r.json()),
    ]).then(([tData, pData, cData]) => {
      setThoughts(Array.isArray(tData) ? tData : []);
      setPhotos(Array.isArray(pData) ? pData : []);
      setCategories(Array.isArray(cData) ? cData : []);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-2">{t("nav.siteName")}</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-fg">{t("admin.title")}</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="button-secondary self-start px-4 py-2 text-base"
        >
          {t("admin.logout")}
        </button>
      </div>

      <div className="card p-2 flex flex-wrap gap-2 text-base">
        {[
          ["thoughts", t("admin.tabThoughts")],
          ["new-thought", t("admin.tabNewThought")],
          ["photos", t("admin.tabPhotos")],
          ["upload", t("admin.tabUpload")],
          ["access", t("admin.accessRequests")],
          ["visits", t("admin.tabVisits")],
          ["categories", t("admin.tabCategories")],
        ].map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`button-ghost px-3 py-2 text-sm sm:text-base ${
              activeTab === tab ? "bg-warm text-bg font-medium" : "hover:bg-bg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "thoughts" && (
        <ThoughtListAdmin
          thoughts={thoughts}
          categories={categories}
          loading={loading}
          onToggle={load}
          onEdit={setEditingThought}
          editingThought={editingThought}
          onCancelEdit={() => setEditingThought(null)}
        />
      )}
      {activeTab === "new-thought" && (
        <NewThoughtForm
          categories={categories}
          onSuccess={() => {
            setActiveTab("thoughts");
            load();
          }}
        />
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
      {activeTab === "categories" && (
        <CategoryManager
          categories={categories}
          onChange={() => {
            load();
          }}
        />
      )}
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
          className="card p-4 flex flex-col gap-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-medium text-fg">{r.name}</span>
              {r.contact && (
                <span className="text-muted text-base ml-2">{r.contact}</span>
              )}
            </div>
            <span
              className={`status-badge text-sm px-2 py-0.5 ${
                r.status === "approved"
                  ? "status-badge-approved"
                  : r.status === "rejected"
                    ? "status-badge-rejected"
                    : "status-badge-pending"
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
              className="button-secondary self-start px-4 py-2 text-base font-medium hover:opacity-80"
            >
              {t("admin.approve")}
            </button>
          )}
          {r.status === "approved" && r.accessToken && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyAccessLink(r.accessToken!, r.id)}
                className="button-secondary px-4 py-2 text-base font-medium hover:opacity-80"
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
    void Promise.resolve().then(() => fetchPage(0, false));
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
      <div className="overflow-x-auto border border-border rounded-[var(--radius-card)] bg-bg-card">
        <table className="w-full text-left text-sm min-w-[960px]">
          <thead className="bg-bg border-b border-border">
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
  categories,
  loading,
  onToggle,
  onEdit,
  editingThought,
  onCancelEdit,
}: {
  thoughts: Thought[];
  categories: { id: string; name: string }[];
  loading: boolean;
  onToggle: () => void;
  onEdit: (thought: Thought) => void;
  editingThought: Thought | null;
  onCancelEdit: () => void;
}) {
  const { t, dateLocale } = useLocale();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");

  const toggle = async (id: string, isPublic: boolean) => {
    await fetch(`/api/thoughts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    onToggle();
  };

  const moveToCategory = async (id: string, nextCategoryId: string) => {
    await fetch(`/api/thoughts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: nextCategoryId || null }),
    });
    onToggle();
  };

  const selectedIds = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const setSelectedFor = (ids: string[], v: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = v;
      });
      return next;
    });
  };

  const clearSelected = () => setSelected({});

  const bulk = async (action: "moveCategory" | "delete" | "pin" | "unpin", extra?: Record<string, unknown>) => {
    if (selectedIds.length === 0) return;
    const res = await fetch("/api/thoughts/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, action, ...(extra || {}) }),
    });
    if (!res.ok) return;
    clearSelected();
    onToggle();
  };

  const setPinned = async (id: string, nextPinned: boolean, nextOrder?: number) => {
    await fetch(`/api/thoughts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isPinned: nextPinned,
        ...(typeof nextOrder === "number" ? { pinnedOrder: nextOrder } : {}),
      }),
    });
    onToggle();
  };

  const reorderPinned = async (orderedIds: string[]) => {
    await fetch("/api/thoughts/pin-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: orderedIds }),
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
        categories={categories}
        onSuccess={() => {
          onCancelEdit();
          onToggle();
        }}
        onCancel={onCancelEdit}
      />
    );
  }

  const pinned = thoughts.filter((x) => x.isPinned).slice().sort((a, b) => {
    const ao = a.pinnedOrder ?? 999999;
    const bo = b.pinnedOrder ?? 999999;
    if (ao !== bo) return ao - bo;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const normal = thoughts.filter((x) => !x.isPinned);

  return (
    <div className="space-y-6">
      {selectedIds.length > 0 && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-fg font-medium">
            {t("admin.bulkSelected").replace("{count}", String(selectedIds.length))}
          </span>
          <button
            type="button"
            onClick={clearSelected}
            className="button-secondary px-3 py-1.5 text-sm"
          >
            {t("admin.clearSelection")}
          </button>
          <div className="flex-1" />
          <select
            value={bulkCategoryId}
            onChange={(e) => setBulkCategoryId(e.target.value)}
            className="form-control text-sm py-1 px-2 w-[12rem]"
            aria-label={t("admin.formCategory")}
          >
            <option value="">{t("admin.noCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void bulk("moveCategory", { categoryId: bulkCategoryId || null })}
            className="button-primary px-4 py-2 text-sm font-medium"
          >
            {t("admin.bulkMove")}
          </button>
          <button
            type="button"
            onClick={() => void bulk("pin")}
            className="button-secondary px-4 py-2 text-sm font-medium"
          >
            {t("admin.bulkPin")}
          </button>
          <button
            type="button"
            onClick={() => void bulk("unpin")}
            className="button-secondary px-4 py-2 text-sm font-medium"
          >
            {t("admin.bulkUnpin")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm(t("admin.bulkDeleteConfirm"))) return;
              void bulk("delete");
            }}
            className="button-secondary px-4 py-2 text-sm font-medium danger-text"
          >
            {t("admin.bulkDelete")}
          </button>
        </div>
      )}

      {pinned.length > 0 && (
        <div className="card p-4 space-y-3">
          <p className="section-label">{t("admin.pinned")}</p>
          <ul className="space-y-2">
            {pinned.map((item, idx) => {
              const orderedIds = pinned.map((x) => x.id);
              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!selected[item.id]}
                      onChange={(e) => setSelected((p) => ({ ...p, [item.id]: e.target.checked }))}
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <Link href={`/thoughts/${item.id}`} className="font-medium text-fg hover:opacity-70">
                      {item.title}
                    </Link>
                    {item.category?.name && (
                      <span className="ml-2 text-xs text-muted">#{item.category.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={item.category?.id ?? ""}
                      onChange={(e) => void moveToCategory(item.id, e.target.value)}
                      className="form-control text-sm py-1 px-2 w-[10.5rem]"
                      aria-label={t("admin.formCategory")}
                    >
                      <option value="">{t("admin.noCategory")}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        const next = orderedIds.slice();
                        const tmp = next[idx - 1];
                        next[idx - 1] = next[idx];
                        next[idx] = tmp;
                        void reorderPinned(next);
                      }}
                      className="button-secondary text-sm px-3 py-1.5 disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === pinned.length - 1}
                      onClick={() => {
                        const next = orderedIds.slice();
                        const tmp = next[idx + 1];
                        next[idx + 1] = next[idx];
                        next[idx] = tmp;
                        void reorderPinned(next);
                      }}
                      className="button-secondary text-sm px-3 py-1.5 disabled:opacity-50"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinned(item.id, false)}
                      className="button-secondary text-sm px-3 py-1.5"
                    >
                      {t("admin.unpin")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ul className="space-y-3">
        <li className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={normal.length > 0 && normal.every((x) => selected[x.id])}
              onChange={(e) => setSelectedFor(normal.map((x) => x.id), e.target.checked)}
            />
            {t("admin.selectAll")}
          </label>
        </li>
        {normal.map((item) => (
          <li
            key={item.id}
            className="card flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!selected[item.id]}
                onChange={(e) => setSelected((p) => ({ ...p, [item.id]: e.target.checked }))}
              />
            </label>
            <div className="min-w-0 flex-1">
              <Link href={`/thoughts/${item.id}`} className="font-medium text-fg hover:opacity-70">
                {item.title}
              </Link>
              {item.category?.name && (
                <span className="ml-2 text-xs text-muted">#{item.category.name}</span>
              )}
              <span className="ml-2 text-sm text-muted">
                {new Date(item.createdAt).toLocaleDateString(dateLocale)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="button-secondary text-sm px-3 py-1.5"
              >
                {t("admin.editThought")}
              </button>
              <select
                value={item.category?.id ?? ""}
                onChange={(e) => void moveToCategory(item.id, e.target.value)}
                className="form-control text-sm py-1 px-2 w-[10.5rem]"
                aria-label={t("admin.formCategory")}
              >
                <option value="">{t("admin.noCategory")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const nextOrder = pinned.length + 1;
                  void setPinned(item.id, true, nextOrder);
                }}
                className="button-secondary text-sm px-3 py-1.5"
              >
                {t("admin.pin")}
              </button>
              <button
                type="button"
                onClick={() => toggle(item.id, item.isPublic)}
                className={`status-badge text-sm px-3 py-1.5 ${
                  item.isPublic
                    ? "status-badge-public"
                    : "status-badge-private"
                }`}
              >
                {item.isPublic ? t("admin.visibilityPublic") : t("admin.visibilityPrivate")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditThoughtForm({
  thought,
  categories,
  onSuccess,
  onCancel,
}: {
  thought: Thought;
  categories: { id: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState(thought.title);
  const [content, setContent] = useState(thought.content);
  const [isPublic, setIsPublic] = useState(thought.isPublic);
  const [categoryId, setCategoryId] = useState<string>(thought.categoryId ?? "");
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
        body: JSON.stringify({ title, content, isPublic, categoryId: categoryId || null }),
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
    <div className="card p-5 sm:p-6 space-y-4 max-w-2xl">
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
        {error && <p className="text-base danger-text">{error}</p>}
        <div>
          <label className="block section-label mb-2">{t("admin.formTitle")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-control"
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
            className="form-control min-h-[320px] rounded-[var(--radius-card)] py-4 leading-relaxed resize-y"
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
        <div>
          <label className="block section-label mb-2">{t("admin.formCategory")}</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="form-control max-w-md"
          >
            <option value="">{t("admin.noCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || deleting}
            className="button-primary px-5 py-2.5 text-base font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("admin.updating") : t("admin.saveChanges")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="button-secondary px-5 py-2.5 text-base disabled:opacity-50"
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
          className="button-secondary px-5 py-2.5 text-base font-medium danger-text hover:opacity-80 disabled:opacity-50"
        >
          {deleting ? t("admin.deletingThought") : t("admin.deleteThoughtButton")}
        </button>
      </div>
    </div>
  );
}

function NewThoughtForm({
  categories,
  onSuccess,
}: {
  categories: { id: string; name: string }[];
  onSuccess: () => void;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [categoryId, setCategoryId] = useState<string>("");
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
        body: JSON.stringify({ title, content, isPublic, categoryId: categoryId || null }),
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
    <form onSubmit={handleSubmit} className="card p-5 sm:p-6 space-y-4 max-w-2xl">
      {error && <p className="text-base danger-text">{error}</p>}
      <div>
        <label className="block section-label mb-2">{t("admin.formTitle")}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-control"
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
          className="form-control min-h-[320px] rounded-[var(--radius-card)] py-4 leading-relaxed resize-y"
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
      <div>
        <label className="block section-label mb-2">{t("admin.formCategory")}</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="form-control max-w-md"
        >
          <option value="">{t("admin.noCategory")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="button-primary self-start px-5 py-2.5 text-base font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? t("admin.publishing") : t("admin.publish")}
      </button>
    </form>
  );
}

function CategoryManager({
  categories,
  onChange,
}: {
  categories: { id: string; name: string }[];
  onChange: () => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const create = async () => {
    setError("");
    const v = name.trim();
    if (!v) return;
    setSaving(true);
    try {
      const res = await fetch("/api/thought-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: v }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("common.errorNetwork"));
        return;
      }
      setName("");
      onChange();
    } catch {
      setError(t("common.errorNetwork"));
    } finally {
      setSaving(false);
    }
  };

  const saveRename = async (id: string) => {
    setError("");
    const v = editingName.trim();
    if (!v) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/thought-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: v }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("common.errorNetwork"));
        return;
      }
      setEditingId(null);
      setEditingName("");
      onChange();
    } catch {
      setError(t("common.errorNetwork"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(t("admin.deleteCategoryConfirm"))) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/thought-categories/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("common.errorNetwork"));
        return;
      }
      onChange();
    } catch {
      setError(t("common.errorNetwork"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 sm:p-6 space-y-4 max-w-2xl">
      <h2 className="text-xl font-semibold text-fg">{t("admin.tabCategories")}</h2>
      {error && <p className="text-base danger-text">{error}</p>}

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block section-label mb-2">{t("admin.newCategory")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control"
            placeholder={t("admin.newCategoryPlaceholder")}
            maxLength={40}
          />
        </div>
        <button
          type="button"
          onClick={() => void create()}
          disabled={saving || !name.trim()}
          className="button-primary px-5 py-2.5 text-base font-medium disabled:opacity-50"
        >
          {t("admin.create")}
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="text-muted text-base">{t("admin.categoriesEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3">
              {editingId === c.id ? (
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="form-control"
                    maxLength={40}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => void saveRename(c.id)}
                    disabled={saving || !editingName.trim()}
                    className="button-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {t("admin.save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditingName("");
                    }}
                    className="button-secondary px-4 py-2 text-sm"
                  >
                    {t("admin.cancel")}
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-fg font-medium">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditingName(c.name);
                      }}
                      className="button-secondary px-3 py-1.5 text-sm"
                    >
                      {t("admin.rename")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(c.id)}
                      disabled={saving}
                      className="button-secondary px-3 py-1.5 text-sm danger-text disabled:opacity-50"
                    >
                      {t("admin.delete")}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
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
          className="card overflow-hidden"
        >
          <div className="aspect-square relative bg-border">
            <img
              src={p.filename}
              alt={p.caption || ""}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <span
                className={`status-badge px-2.5 py-1 text-xs font-medium ${
                  p.isPublic
                    ? "status-badge-public"
                    : "status-badge-private"
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
                  className="form-control"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveCaption(p.id)}
                    className="button-primary px-3 py-1.5 text-sm font-medium hover:opacity-90"
                  >
                    {t("admin.saveCaption")}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="button-secondary px-3 py-1.5 text-sm"
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
                  className={`status-badge text-sm px-2.5 py-1 ${
                    p.isPublic
                      ? "status-badge-public"
                      : "status-badge-private"
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
                      className="danger-text font-medium"
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
                    className="text-sm danger-text hover:underline"
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
    <form onSubmit={handleSubmit} className="card p-5 sm:p-6 space-y-6 max-w-2xl">
      {error && (
        <p className="text-base danger-text">{error}</p>
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
          className={`block rounded-[var(--radius-card)] border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
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
              className="button-primary w-full py-3 text-base font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="form-control"
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
