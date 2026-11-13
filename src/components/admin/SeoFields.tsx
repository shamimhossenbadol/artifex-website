"use client";
// SEO title/description with counters and a Google-style preview (07 §3.2, §3.4). Blank fields
// fall back to the form's title and summary field, as the public pages do.
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { AdminField } from "./AdminForm";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export function SeoFields({
  seoTitle,
  seoDescription,
  slug,
  path = "products",
  summaryField = "shortDescription",
  summaryLabel = "short description",
}: {
  seoTitle: string | null;
  seoDescription: string | null;
  slug: string;
  /** URL section shown in the preview: "products" or "blog". */
  path?: string;
  /** The form field used when the SEO description is blank. */
  summaryField?: string;
  summaryLabel?: string;
}) {
  const [title, setTitle] = useState(seoTitle ?? "");
  const [description, setDescription] = useState(seoDescription ?? "");
  const [fallback, setFallback] = useState({ title: "", description: "", slug });
  const anchor = useRef<HTMLDivElement>(null);

  // Mirror the form's title, summary and slug for the preview's defaults.
  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    const read = () => {
      const get = (name: string) =>
        (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
      setFallback({
        title: get("title"),
        description: get(summaryField),
        slug: get("slug") || slug,
      });
    };
    read();
    form.addEventListener("input", read);
    return () => form.removeEventListener("input", read);
  }, [slug, summaryField]);

  const shownTitle = title || fallback.title || "Title";
  const shownDescription = description || fallback.description;
  const host = SITE.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  return (
    <div ref={anchor} className="flex flex-col gap-5">
      <AdminField
        name="seoTitle"
        label="SEO title"
        hint={`${title.length}/70 · Leave blank to use the title.`}
      >
        <Input
          name="seoTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={70}
        />
      </AdminField>
      <AdminField
        name="seoDescription"
        label="SEO description"
        hint={`${description.length}/170 · Leave blank to use the ${summaryLabel}.`}
      >
        <Textarea
          name="seoDescription"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={170}
        />
      </AdminField>
      <div className="bg-bg rounded-md p-4" aria-label="Search result preview">
        <p className="text-small text-muted truncate">
          {host || "your-site"} › {path} › {fallback.slug || "…"}
        </p>
        <p className="text-walnut-dark text-body-lg mt-1 truncate font-medium">
          {shownTitle} | Artifex Furniture
        </p>
        <p className="text-small text-ink-soft mt-1 line-clamp-2">
          {shownDescription || `The ${summaryLabel} appears here.`}
        </p>
      </div>
    </div>
  );
}
