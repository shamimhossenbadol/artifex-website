"use client";
// Markdown textarea with a small toolbar and a Preview tab (07 §3.2, §3.4). The preview uses the
// same <Markdown> renderer as the public page (no raw HTML, safe links). With `uploadImage`, an
// "Insert image" button uploads one photo (sharp → R2) and inserts its media key as Markdown.
import { Bold, Heading2, ImagePlus, Italic, Link2, List, Loader2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Markdown } from "@/components/ui/Markdown";
import { Textarea } from "@/components/ui/Textarea";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALT_PLACEHOLDER = "Describe the image";

type Edit = (
  value: string,
  start: number,
  end: number,
) => {
  value: string;
  start: number;
  end: number;
};

/** Wraps the selection, e.g. **bold**. With nothing selected, inserts a placeholder. */
const wrap =
  (before: string, after: string, placeholder: string): Edit =>
  (value, start, end) => {
    const text = value.slice(start, end) || placeholder;
    return {
      value: value.slice(0, start) + before + text + after + value.slice(end),
      start: start + before.length,
      end: start + before.length + text.length,
    };
  };

/** Prefixes every selected line, e.g. "- " for a list. */
const prefixLines =
  (prefix: string): Edit =>
  (value, start, end) => {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const block = value.slice(lineStart, end) || "";
    const prefixed = block
      .split("\n")
      .map((line) => (line.startsWith(prefix) ? line : prefix + line))
      .join("\n");
    return {
      value: value.slice(0, lineStart) + prefixed + value.slice(end),
      start: lineStart,
      end: lineStart + prefixed.length,
    };
  };

const TOOLS: { label: string; icon: ReactNode; edit: Edit }[] = [
  { label: "Bold", icon: <Bold className="size-4" />, edit: wrap("**", "**", "bold text") },
  { label: "Italic", icon: <Italic className="size-4" />, edit: wrap("_", "_", "italic text") },
  { label: "Heading", icon: <Heading2 className="size-4" />, edit: prefixLines("## ") },
  { label: "Bulleted list", icon: <List className="size-4" />, edit: prefixLines("- ") },
  {
    label: "Link",
    icon: <Link2 className="size-4" />,
    edit: wrap("[", "](https://)", "link text"),
  },
];

export function MarkdownEditor({
  id,
  name,
  defaultValue,
  maxLength,
  rows = 10,
  label = "Description editor",
  uploadImage,
  ...aria
}: {
  id?: string;
  name: string;
  defaultValue: string;
  maxLength: number;
  rows?: number;
  /** Accessible name of the Write/Preview tab list. */
  label?: string;
  /** Server Action that stores one image and returns its key; enables "Insert image". */
  uploadImage?: (formData: FormData) => Promise<ActionResult<{ path: string }>>;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [value, setValue] = useState(defaultValue);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  function apply(edit: Edit) {
    const el = ref.current;
    if (!el) return;
    const next = edit(el.value, el.selectionStart, el.selectionEnd);
    setValue(next.value);
    // Let the form know (unsaved-changes guard) and restore the selection after React renders.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.start, next.end);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  async function insertImage(file: File | undefined) {
    if (!file || !uploadImage) return;
    setImageError(null);
    if (!IMAGE_TYPES.includes(file.type)) return setImageError("Use a JPEG, PNG or WebP image.");
    if (file.size > MAX_IMAGE_BYTES) return setImageError("Images must be 10 MB or smaller.");
    setUploading(true);
    let result: ActionResult<{ path: string }>;
    try {
      const formData = new FormData();
      formData.set("file", file);
      result = await uploadImage(formData);
    } catch {
      result = { ok: false, error: "The upload failed. Check your connection and retry." };
    }
    setUploading(false);
    if (!result.ok || !result.data) {
      setImageError(result.ok ? "The upload failed." : result.error);
      return;
    }
    const path = result.data.path;
    // Insert on its own line and select the alt text so the admin can type a description.
    apply((text, start, end) => {
      const before = start > 0 && text[start - 1] !== "\n" ? "\n\n" : "";
      const snippet = `${before}![${ALT_PLACEHOLDER}](${path})\n\n`;
      const altStart = start + before.length + 2;
      return {
        value: text.slice(0, start) + snippet + text.slice(end),
        start: altStart,
        end: altStart + ALT_PLACEHOLDER.length,
      };
    });
  }

  const tabClass = (active: boolean) =>
    cn(
      "min-h-11 px-3 text-sm font-medium",
      active ? "text-ink border-ink border-b-2" : "text-muted hover:text-ink",
    );

  return (
    <div className="border-line rounded-md border">
      <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b px-2">
        <div role="tablist" aria-label={label} className="flex">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "write"}
            onClick={() => setTab("write")}
            className={tabClass(tab === "write")}
          >
            Write
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "preview"}
            onClick={() => setTab("preview")}
            className={tabClass(tab === "preview")}
          >
            Preview
          </button>
        </div>
        {tab === "write" && (
          <div role="toolbar" aria-label="Formatting" className="flex">
            {TOOLS.map((tool) => (
              <button
                key={tool.label}
                type="button"
                onClick={() => apply(tool.edit)}
                className="text-ink-soft hover:text-ink inline-flex size-11 items-center justify-center"
                title={tool.label}
              >
                <span aria-hidden>{tool.icon}</span>
                <span className="sr-only">{tool.label}</span>
              </button>
            ))}
            {uploadImage && (
              <>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="text-ink-soft hover:text-ink inline-flex size-11 items-center justify-center disabled:opacity-50"
                  title="Insert image"
                >
                  <span aria-hidden>
                    {uploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImagePlus className="size-4" />
                    )}
                  </span>
                  <span className="sr-only">{uploading ? "Uploading image…" : "Insert image"}</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept={IMAGE_TYPES.join(",")}
                  hidden
                  data-guard-ignore
                  onChange={(e) => {
                    void insertImage(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>
      {imageError && (
        <p className="text-small text-danger px-3 pt-2" aria-live="polite">
          {imageError}
        </p>
      )}
      {/* The textarea stays mounted (hidden in Preview) so its value is always submitted. */}
      <Textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={maxLength}
        hidden={tab !== "write"}
        className="rounded-none border-0 font-mono text-sm focus-visible:ring-inset"
        {...aria}
      />
      {tab === "preview" && (
        <div className="min-h-40 p-4">
          {value.trim() ? (
            <Markdown className="text-body" allowImages={Boolean(uploadImage)}>
              {value}
            </Markdown>
          ) : (
            <p className="text-muted">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
