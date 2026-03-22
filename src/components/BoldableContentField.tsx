"use client";

import { useRef, useCallback, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  rows?: number;
};

/** 从剪贴板取纯文本（粘贴自网页/Word 时去掉 HTML） */
function getPlainTextFromClipboard(e: React.ClipboardEvent): string {
  const data = e.clipboardData;
  const html = data.getData("text/html");
  if (html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent ?? div.innerText ?? "";
  }
  return data.getData("text/plain");
}

/**
 * 内容输入框 + 加粗 + 插入图片（上传到相册并写入 ![alt](url)）
 */
export function BoldableContentField({
  value,
  onChange,
  placeholder,
  required,
  className = "",
  rows = 14,
}: Props) {
  const { t } = useLocale();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const pasted = getPlainTextFromClipboard(e);
      if (!pasted) return;
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = value.slice(0, start);
      const after = value.slice(end);
      const next = before + pasted + after;
      onChange(next);
      setTimeout(() => {
        const newPos = start + pasted.length;
        ta.setSelectionRange(newPos, newPos);
        ta.focus();
      }, 0);
    },
    [value, onChange]
  );

  const handleBold = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    if (s === e) return;
    const scrollTop = ta.scrollTop;
    const scrollLeft = ta.scrollLeft;
    const before = value.slice(0, s);
    const selected = value.slice(s, e);
    const after = value.slice(e);
    const newContent = before + "**" + selected + "**" + after;
    onChange(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + 2, e + 2);
      ta.scrollTop = scrollTop;
      ta.scrollLeft = scrollLeft;
    }, 0);
  }, [value, onChange]);

  const insertAtCursor = useCallback(
    (snippet: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = value.slice(0, start);
      const after = value.slice(end);
      const next = before + snippet + after;
      onChange(next);
      const pos = start + snippet.length;
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(pos, pos);
      }, 0);
    },
    [value, onChange]
  );

  const handlePickImage = useCallback(() => {
    setImageError("");
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;

      setImageLoading(true);
      setImageError("");
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("caption", "");
        formData.append("isPublic", "true");

        const res = await fetch("/api/photos/upload", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as { filename?: string; error?: string };
        if (!res.ok) {
          setImageError(data.error || t("admin.imageUploadError"));
          return;
        }
        const path = data.filename;
        if (!path || !path.startsWith("/")) {
          setImageError(t("admin.imageUploadError"));
          return;
        }
        const alt = t("admin.imageMarkdownAlt");
        insertAtCursor(`![${alt}](${path})\n`);
      } catch {
        setImageError(t("admin.imageUploadError"));
      } finally {
        setImageLoading(false);
      }
    },
    [insertAtCursor, t]
  );

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleBold}
          className="px-3 py-1.5 rounded-lg border border-border bg-bg text-fg text-sm font-semibold hover:bg-bg-card transition-colors"
          title={t("admin.boldButtonTitle")}
        >
          {t("admin.boldButton")}
        </button>
        <button
          type="button"
          onClick={handlePickImage}
          disabled={imageLoading}
          className="px-3 py-1.5 rounded-lg border border-border bg-bg text-fg text-sm font-semibold hover:bg-bg-card transition-colors disabled:opacity-50"
          title={t("admin.imageButtonTitle")}
        >
          {imageLoading ? t("admin.imageUploading") : t("admin.imageButton")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="sr-only"
          aria-hidden
          onChange={handleFileChange}
        />
        <span className="text-xs text-muted">{t("admin.boldButtonHint")}</span>
        <span className="text-xs text-muted">{t("admin.imageButtonHint")}</span>
      </div>
      {imageError ? (
        <p className="text-sm text-red-500">{imageError}</p>
      ) : null}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        rows={rows}
        placeholder={placeholder}
        className={className}
        required={required}
      />
    </div>
  );
}
