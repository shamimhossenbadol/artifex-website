"use client";
// One image with a local preview before upload (07 §3.5/§3.6). The file is sent with the form and
// processed on the server (sharp → WebP variants → R2). Remount with a new `key` after saving.
import { ImageUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { fieldError } from "./FormMessage";
import { useAdminFormState } from "./AdminForm";
import type { ActionResult } from "@/lib/action-result";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

type ImageFieldProps = {
  name: string;
  label: string;
  /** Stored key base of the current image, or null. */
  currentPath: string | null;
  currentAlt?: string;
  hint?: string;
  /** Preview box shape, e.g. "aspect-[16/9]". */
  aspect?: string;
  required?: boolean;
};

export function ImageField({
  name,
  label,
  currentPath,
  currentAlt = "",
  hint = "JPEG, PNG or WebP, up to 10 MB. Large photos are resized automatically.",
  aspect = "aspect-[16/9]",
  required,
}: ImageFieldProps) {
  const id = useId();
  const { state } = useAdminFormState();
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const error = localError ?? fieldError(state as ActionResult | null, name);

  // Free the object URL when it's replaced or the field unmounts.
  useEffect(() => (preview ? () => URL.revokeObjectURL(preview) : undefined), [preview]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small text-ink-soft font-medium">
        {label}
      </label>
      <div className={cn("bg-sand relative w-full max-w-xl overflow-hidden rounded-md", aspect)}>
        {preview ? (
          // A local blob: URL can't go through the image loader.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : currentPath ? (
          <Image
            src={currentPath}
            alt={currentAlt}
            fill
            sizes="(min-width: 640px) 36rem, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="text-muted flex size-full flex-col items-center justify-center gap-2 text-sm">
            <ImageUp aria-hidden strokeWidth={1.5} className="size-8" />
            No image yet
          </div>
        )}
      </div>
      <input
        id={id}
        name={name}
        type="file"
        accept={ACCEPT}
        required={required && !currentPath}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        aria-invalid={error ? true : undefined}
        onChange={(event) => {
          const file = event.target.files?.[0];
          setLocalError(null);
          if (!file) {
            setPreview(null);
            return;
          }
          if (file.size > MAX_BYTES || !ACCEPT.split(",").includes(file.type)) {
            setLocalError(
              file.size > MAX_BYTES
                ? "Images must be 10 MB or smaller."
                : "Use a JPEG, PNG or WebP image.",
            );
            event.target.value = "";
            setPreview(null);
            return;
          }
          setPreview(URL.createObjectURL(file));
        }}
        className="text-small file:border-ink file:text-ink hover:file:bg-ink hover:file:text-bg max-w-xl file:mr-3 file:h-11 file:cursor-pointer file:rounded-md file:border file:bg-transparent file:px-4 file:text-sm file:font-medium file:transition-colors"
      />
      <p id={`${id}-hint`} className="text-small text-muted">
        {preview ? "New image selected. It's uploaded when you save." : hint}
      </p>
      {error && (
        <p id={`${id}-error`} className="text-small text-danger" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
