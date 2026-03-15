"use client";

import { useRef, useCallback } from "react";
import { useLocale } from "@/contexts/LocaleContext";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  rows?: number;
};

/**
 * 内容输入框 + 选中后点击「加粗」按钮，将选中文字用 ** 包裹。
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

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBold}
          className="px-3 py-1.5 rounded-lg border border-border bg-bg text-fg text-sm font-semibold hover:bg-bg-card transition-colors"
          title={t("admin.boldButtonTitle")}
        >
          {t("admin.boldButton")}
        </button>
        <span className="text-xs text-muted">{t("admin.boldButtonHint")}</span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={className}
        required={required}
      />
    </div>
  );
}
