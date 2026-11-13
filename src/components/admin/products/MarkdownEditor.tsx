"use client";
// Markdown textarea with a small toolbar and a Preview tab (07 §3.2). The preview uses the same
// <Markdown> renderer as the public page (no raw HTML, safe links).
import { Bold, Heading2, Italic, Link2, List } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Markdown } from "@/components/ui/Markdown";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

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
  ...aria
}: {
  id?: string;
  name: string;
  defaultValue: string;
  maxLength: number;
  rows?: number;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [value, setValue] = useState(defaultValue);

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

  const tabClass = (active: boolean) =>
    cn(
      "min-h-11 px-3 text-sm font-medium",
      active ? "text-ink border-ink border-b-2" : "text-muted hover:text-ink",
    );

  return (
    <div className="border-line rounded-md border">
      <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b px-2">
        <div role="tablist" aria-label="Description editor" className="flex">
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
          </div>
        )}
      </div>
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
            <Markdown className="text-body">{value}</Markdown>
          ) : (
            <p className="text-muted">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
