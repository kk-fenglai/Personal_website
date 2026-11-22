"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import {
  LIMITS,
  PROFILE_TEXT_FIELDS,
  displayDomain,
  formatProjectNumber,
  type ProfileInput,
  type ProjectInput,
} from "@/lib/aboutContent";
import type { AboutProfileView, ProjectView } from "@/lib/aboutStore";
import { uploadPhotoWithRetry } from "@/lib/photoUploadClient";

type Translate = (key: string, params?: Record<string, string | number>) => string;

async function sendJson(
  url: string,
  method: string,
  body?: unknown
): Promise<{ ok: true; data: unknown } | { ok: false; error: string | null }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (data as { error?: string }).error ?? null };
    return { ok: true, data };
  } catch {
    return { ok: false, error: null };
  }
}

export function AboutAdmin() {
  return (
    <div className="space-y-6 max-w-3xl">
      <ProfileForm />
      <ProjectsManager />
    </div>
  );
}

const EMPTY_PROFILE = Object.fromEntries([
  ...PROFILE_TEXT_FIELDS.map((field) => [field, ""]),
  ["email", ""],
]) as ProfileInput;

function ProfileForm() {
  const { t } = useLocale();
  const [form, setForm] = useState<ProfileInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void sendJson("/api/about", "GET").then((res) => {
      if (!res.ok) {
        setForm(EMPTY_PROFILE);
        return;
      }
      const view = res.data as AboutProfileView;
      const next = { ...EMPTY_PROFILE, email: view.email };
      for (const field of PROFILE_TEXT_FIELDS) next[field] = view[field].zh;
      setForm(next);
    });
  }, []);

  if (!form) {
    return <div className="card p-5 sm:p-6 text-muted">{t("thoughts.loading")}</div>;
  }

  const set = (field: keyof ProfileInput, value: string) => {
    setSaved(false);
    setForm({ ...form, [field]: value });
  };

  const save = async () => {
    setError("");
    setSaved(false);
    setSaving(true);
    const res = await sendJson("/api/about", "PUT", form);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? t("common.errorNetwork"));
      return;
    }
    setSaved(true);
  };

  const input = (
    field: keyof ProfileInput,
    label: string,
    max: number,
    opts: { required?: boolean; rows?: number; hint?: string; type?: string } = {}
  ) => (
    <div>
      <label htmlFor={`about-${field}`} className="block section-label mb-2">
        {label}
        {opts.required && (
          <span className="ml-2 normal-case tracking-normal text-muted">
            {t("admin.about.required")}
          </span>
        )}
      </label>
      {opts.rows ? (
        <textarea
          id={`about-${field}`}
          value={form[field]}
          onChange={(e) => set(field, e.target.value)}
          className="form-control"
          rows={opts.rows}
          maxLength={max}
        />
      ) : (
        <input
          id={`about-${field}`}
          type={opts.type ?? "text"}
          value={form[field]}
          onChange={(e) => set(field, e.target.value)}
          className="form-control"
          maxLength={max}
        />
      )}
      {opts.hint && <p className="type-caption mt-1">{opts.hint}</p>}
    </div>
  );

  return (
    <div className="card p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-fg">{t("admin.about.profileHeading")}</h2>
        <p className="type-caption mt-1">{t("admin.about.profileHint")}</p>
      </div>

      {input("headline", t("admin.about.headline"), LIMITS.headline, { required: true })}
      {input("intro", t("admin.about.intro"), LIMITS.intro, {
        rows: 6,
        hint: t("admin.about.introHint"),
      })}
      <div className="grid gap-4 sm:grid-cols-2">
        {input("fact1Label", t("admin.about.factLabel", { n: 1 }), LIMITS.factLabel)}
        {input("fact1Value", t("admin.about.factValue", { n: 1 }), LIMITS.factValue)}
        {input("fact2Label", t("admin.about.factLabel", { n: 2 }), LIMITS.factLabel)}
        {input("fact2Value", t("admin.about.factValue", { n: 2 }), LIMITS.factValue)}
      </div>
      {input("collabTitle", t("admin.about.collabTitle"), LIMITS.sectionTitle)}
      {input("collabBody", t("admin.about.collabBody"), LIMITS.sectionBody, { rows: 3 })}
      {input("joinTitle", t("admin.about.joinTitle"), LIMITS.sectionTitle)}
      {input("joinBody", t("admin.about.joinBody"), LIMITS.sectionBody, { rows: 3 })}
      {input("email", t("admin.about.email"), LIMITS.email, { required: true, type: "email" })}

      {error && <p className="text-base danger-text">{error}</p>}
      {saved && <p className="text-base text-muted">{t("admin.about.saved")}</p>}
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving || !form.headline.trim() || !form.email.trim()}
        className="button-primary px-5 py-2.5 text-base font-medium disabled:opacity-50"
      >
        {saving ? t("admin.about.saving") : t("admin.about.save")}
      </button>
    </div>
  );
}

const EMPTY_PROJECT: ProjectInput = {
  name: "",
  description: "",
  url: "",
  domain: null,
  imageUrl: null,
  isVisible: true,
};

function ProjectsManager() {
  const { t } = useLocale();
  const [projects, setProjects] = useState<ProjectView[] | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; form: ProjectInput } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    sendJson("/api/projects", "GET").then((res) => {
      setProjects(res.ok && Array.isArray(res.data) ? (res.data as ProjectView[]) : []);
    });

  useEffect(() => {
    void sendJson("/api/projects", "GET").then((res) => {
      setProjects(res.ok && Array.isArray(res.data) ? (res.data as ProjectView[]) : []);
    });
  }, []);

  const run = async (url: string, method: string, body?: unknown) => {
    setError("");
    setBusy(true);
    const res = await sendJson(url, method, body);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? t("common.errorNetwork"));
      return false;
    }
    await load();
    return true;
  };

  const saveProject = async (form: ProjectInput) => {
    if (!editing) return;
    const ok = editing.id
      ? await run(`/api/projects/${editing.id}`, "PATCH", form)
      : await run("/api/projects", "POST", form);
    if (ok) setEditing(null);
  };

  return (
    <div className="card p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-fg">{t("admin.about.projectsHeading")}</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing({ id: null, form: EMPTY_PROJECT })}
            className="button-secondary"
          >
            {t("admin.about.addProject")}
          </button>
        )}
      </div>
      {error && <p className="text-base danger-text">{error}</p>}

      {editing && (
        <ProjectForm
          key={editing.id ?? "new"}
          t={t}
          title={editing.id ? t("admin.about.editProject") : t("admin.about.addProject")}
          initial={editing.form}
          busy={busy}
          onSave={(form) => void saveProject(form)}
          onCancel={() => setEditing(null)}
        />
      )}

      {projects === null ? (
        <p className="text-muted">{t("thoughts.loading")}</p>
      ) : projects.length === 0 ? (
        <p className="text-muted">{t("admin.about.projectsEmpty")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {projects.map((project, i) => (
            <li key={project.id} className="py-4 flex flex-wrap items-center gap-4">
              <span className="tabular-nums text-muted w-6">{formatProjectNumber(i)}</span>
              <div className="w-20 aspect-[16/10] bg-surface overflow-hidden shrink-0">
                {project.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.imageUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-[180px]">
                <p className="font-medium text-fg break-words">
                  {project.name.zh}
                  {!project.isVisible && (
                    <span className="status-badge status-badge-pending ml-2">
                      {t("admin.about.hiddenBadge")}
                    </span>
                  )}
                </p>
                <p className="type-caption break-all">{displayDomain(project)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={busy || i === 0}
                  onClick={() =>
                    void run(`/api/projects/${project.id}/move`, "POST", { direction: "up" })
                  }
                >
                  {t("admin.about.moveUp")}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={busy || i === projects.length - 1}
                  onClick={() =>
                    void run(`/api/projects/${project.id}/move`, "POST", { direction: "down" })
                  }
                >
                  {t("admin.about.moveDown")}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={busy}
                  onClick={() =>
                    setEditing({
                      id: project.id,
                      form: {
                        name: project.name.zh,
                        description: project.description.zh,
                        url: project.url,
                        domain: project.domain,
                        imageUrl: project.imageUrl,
                        isVisible: project.isVisible,
                      },
                    })
                  }
                >
                  {t("admin.about.edit")}
                </button>
                {confirmingDelete === project.id ? (
                  <>
                    <button
                      type="button"
                      className="button-secondary danger-text"
                      disabled={busy}
                      onClick={() => {
                        setConfirmingDelete(null);
                        void run(`/api/projects/${project.id}`, "DELETE");
                      }}
                    >
                      {t("admin.about.confirmDelete")}
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setConfirmingDelete(null)}
                    >
                      {t("admin.about.cancel")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={busy}
                    onClick={() => setConfirmingDelete(project.id)}
                  >
                    {t("admin.about.delete")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProjectForm({
  t,
  title,
  initial,
  busy,
  onSave,
  onCancel,
}: {
  t: Translate;
  title: string;
  initial: ProjectInput;
  busy: boolean;
  onSave: (form: ProjectInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    const res = await uploadPhotoWithRetry(file, { isPublic: false, caption: "项目配图" });
    setUploading(false);
    if (!res.ok) {
      setUploadError(res.error);
      return;
    }
    setForm((current) => ({ ...current, imageUrl: String(res.photo.filename) }));
  };

  return (
    <div className="border border-border p-4 space-y-4">
      <h3 className="font-semibold text-fg">{title}</h3>
      <div>
        <label htmlFor="project-name" className="block section-label mb-2">
          {t("admin.about.projectName")}
          <span className="ml-2 normal-case tracking-normal text-muted">
            {t("admin.about.required")}
          </span>
        </label>
        <input
          id="project-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="form-control"
          maxLength={LIMITS.projectName}
        />
      </div>
      <div>
        <label htmlFor="project-description" className="block section-label mb-2">
          {t("admin.about.projectDescription")}
        </label>
        <input
          id="project-description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="form-control"
          maxLength={LIMITS.projectDescription}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="project-url" className="block section-label mb-2">
            {t("admin.about.projectUrl")}
            <span className="ml-2 normal-case tracking-normal text-muted">
              {t("admin.about.required")}
            </span>
          </label>
          <input
            id="project-url"
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="form-control"
            placeholder="https://"
            maxLength={LIMITS.projectUrl}
          />
        </div>
        <div>
          <label htmlFor="project-domain" className="block section-label mb-2">
            {t("admin.about.projectDomain")}
          </label>
          <input
            id="project-domain"
            value={form.domain ?? ""}
            onChange={(e) => setForm({ ...form, domain: e.target.value || null })}
            className="form-control"
            placeholder={t("admin.about.projectDomainPlaceholder")}
            maxLength={LIMITS.projectDomain}
          />
        </div>
      </div>
      <div>
        <span className="block section-label mb-2">{t("admin.about.projectImage")}</span>
        <div className="flex flex-wrap items-center gap-3">
          {form.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt="" className="w-28 aspect-[16/10] object-cover" />
          )}
          <label className="button-secondary cursor-pointer">
            {uploading ? t("admin.about.uploading") : t("admin.about.uploadImage")}
            <input
              id="project-image"
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {form.imageUrl && (
            <button
              type="button"
              className="button-secondary"
              onClick={() => setForm({ ...form, imageUrl: null })}
            >
              {t("admin.about.removeImage")}
            </button>
          )}
        </div>
        {uploadError && <p className="text-base danger-text mt-2">{uploadError}</p>}
      </div>
      <label className="flex items-center gap-2 text-fg">
        <input
          id="project-visible"
          type="checkbox"
          checked={form.isVisible}
          onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
        />
        {t("admin.about.visible")}
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={busy || uploading || !form.name.trim() || !form.url.trim()}
          className="button-primary px-5 py-2.5 text-base font-medium disabled:opacity-50"
        >
          {t("admin.about.save")}
        </button>
        <button type="button" onClick={onCancel} className="button-secondary">
          {t("admin.about.cancel")}
        </button>
      </div>
    </div>
  );
}
