"use client";
// Product photos (07 §3.2, §4): drag & drop or pick several files; each is uploaded in its own
// request (low memory on shared hosting), two at a time, with a status per file. Saved photos can
// be reordered, set as featured, described (alt text) and deleted. Changes save immediately.
import { ArrowDown, ArrowUp, Check, ImageUp, Loader2, Star, TriangleAlert, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type DragEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import {
  deleteImageAction,
  moveImageAction,
  setPrimaryImageAction,
  updateImageAltAction,
  uploadProductImageAction,
} from "@/server/actions/product.actions";
import type { AdminProductImage } from "@/server/services/product-admin.service";
import { ConfirmButton } from "../ConfirmButton";
import { useToast } from "../Toaster";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const CONCURRENCY = 2;

type QueueItem = {
  key: number;
  name: string;
  status: "waiting" | "uploading" | "done" | "failed";
  error?: string;
};

let nextKey = 1;

const ICON_BUTTON =
  "text-ink-soft hover:text-ink inline-flex size-11 items-center justify-center disabled:opacity-30";

export function ProductImages({
  productId,
  images,
  max,
}: {
  productId: number;
  images: AdminProductImage[];
  max: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const uploading = queue.some((q) => q.status === "waiting" || q.status === "uploading");
  const room =
    max - images.length - queue.filter((q) => q.status !== "failed" && q.status !== "done").length;

  const setItem = (key: number, patch: Partial<QueueItem>) =>
    setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  async function enqueue(files: File[]) {
    if (files.length === 0) return;
    const accepted: { file: File; item: QueueItem }[] = [];
    const rejected: QueueItem[] = [];
    for (const file of files) {
      const item: QueueItem = { key: nextKey++, name: file.name, status: "waiting" };
      if (!ACCEPT.includes(file.type)) {
        rejected.push({ ...item, status: "failed", error: "Use a JPEG, PNG or WebP image." });
      } else if (file.size > MAX_BYTES) {
        rejected.push({ ...item, status: "failed", error: "Images must be 10 MB or smaller." });
      } else if (accepted.length >= room) {
        rejected.push({ ...item, status: "failed", error: `Up to ${max} photos per product.` });
      } else {
        accepted.push({ file, item });
      }
    }
    setQueue((items) => [
      ...items.filter((i) => i.status !== "done"),
      ...accepted.map((a) => a.item),
      ...rejected,
    ]);

    // Two workers pull from the list, so at most two uploads run at once (07 §4).
    let next = 0;
    let added = 0;
    const worker = async () => {
      while (next < accepted.length) {
        const { file, item } = accepted[next++]!;
        setItem(item.key, { status: "uploading" });
        const formData = new FormData();
        formData.set("productId", String(productId));
        formData.set("file", file);
        let result: ActionResult<AdminProductImage>;
        try {
          result = await uploadProductImageAction(formData);
        } catch {
          result = { ok: false, error: "The upload failed. Check your connection and retry." };
        }
        if (result.ok) {
          added++;
          setItem(item.key, { status: "done" });
        } else {
          setItem(item.key, { status: "failed", error: result.error });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, accepted.length) }, worker));
    if (added > 0) {
      toast.success(added === 1 ? "Photo uploaded." : `${added} photos uploaded.`);
      router.refresh();
    }
  }

  function run(task: () => Promise<ActionResult>) {
    startTransition(async () => {
      let result: ActionResult;
      try {
        result = await task();
      } catch {
        result = { ok: false, error: "Something went wrong. Please try again." };
      }
      if (!result.ok) toast.error(result.error);
      else if (result.message) toast.success(result.message);
      router.refresh();
    });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void enqueue(Array.from(event.dataTransfer.files));
  }

  return (
    <div className="flex flex-col gap-5" data-guard-ignore>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-md border border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-ink bg-sand" : "border-line bg-bg",
        )}
      >
        <ImageUp aria-hidden strokeWidth={1.5} className="text-walnut size-8" />
        <p className="text-ink-soft">
          Drag photos here, or <span className="sr-only">use the button to </span>choose them from
          your device.
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={room <= 0}
          onClick={() => inputRef.current?.click()}
        >
          Choose photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          hidden
          onChange={(e) => {
            void enqueue(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <p className="text-small text-muted">
          JPEG, PNG or WebP, up to 10 MB each · {images.length}/{max} photos
        </p>
      </div>

      {queue.length > 0 && (
        <ul className="flex flex-col gap-1" aria-live="polite" aria-label="Uploads">
          {queue.map((item) => (
            <li key={item.key} className="text-small flex items-center gap-2">
              {item.status === "uploading" && (
                <Loader2 aria-hidden strokeWidth={1.5} className="size-4 animate-spin" />
              )}
              {item.status === "waiting" && (
                <span className="text-muted size-4 text-center">…</span>
              )}
              {item.status === "done" && (
                <Check aria-hidden strokeWidth={1.5} className="text-success size-4" />
              )}
              {item.status === "failed" && (
                <TriangleAlert aria-hidden strokeWidth={1.5} className="text-danger size-4" />
              )}
              <span className="text-ink min-w-0 truncate">{item.name}</span>
              <span className={item.status === "failed" ? "text-danger" : "text-muted"}>
                {item.status === "waiting" && "Waiting"}
                {item.status === "uploading" && "Uploading…"}
                {item.status === "done" && "Uploaded"}
                {item.status === "failed" && item.error}
              </span>
              {item.status === "failed" && (
                <button
                  type="button"
                  onClick={() => setQueue((q) => q.filter((i) => i.key !== item.key))}
                  className="text-muted hover:text-ink inline-flex size-8 items-center justify-center"
                >
                  <X aria-hidden strokeWidth={1.5} className="size-4" />
                  <span className="sr-only">Dismiss</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {images.length === 0 ? (
        <p className="text-muted">
          No photos yet. The first photo becomes the featured one shown on cards.
        </p>
      ) : (
        <ol className="grid gap-4 sm:grid-cols-2" aria-busy={pending || uploading}>
          {images.map((image, index) => (
            <ImageRow
              key={image.id}
              image={image}
              index={index}
              count={images.length}
              disabled={pending}
              run={run}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function ImageRow({
  image,
  index,
  count,
  disabled,
  run,
}: {
  image: AdminProductImage;
  index: number;
  count: number;
  disabled: boolean;
  run: (task: () => Promise<ActionResult>) => void;
}) {
  const [alt, setAlt] = useState(image.alt);
  const label = `photo ${index + 1}`;
  const changed = alt.trim() !== image.alt;

  return (
    <li className="border-line flex flex-col gap-3 rounded-md border p-3">
      <div className="bg-sand relative aspect-[4/3] overflow-hidden rounded-sm">
        <Image
          src={image.path}
          alt=""
          fill
          sizes="(min-width: 640px) 20rem, 100vw"
          className="object-cover"
        />
        {image.isPrimary && (
          <Badge variant="new" className="absolute top-2 left-2">
            Featured
          </Badge>
        )}
      </div>
      <div className="flex items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-small text-ink-soft font-medium">Description (alt text)</span>
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={160} required />
        </label>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || !changed || alt.trim() === ""}
          onClick={() => run(() => updateImageAltAction(image.id, alt))}
        >
          Save
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1">
        <div className="flex">
          <button
            type="button"
            disabled={disabled || index === 0}
            onClick={() => run(() => moveImageAction(image.id, "up"))}
            className={ICON_BUTTON}
          >
            <ArrowUp aria-hidden strokeWidth={1.5} className="size-5" />
            <span className="sr-only">Move {label} earlier</span>
          </button>
          <button
            type="button"
            disabled={disabled || index === count - 1}
            onClick={() => run(() => moveImageAction(image.id, "down"))}
            className={ICON_BUTTON}
          >
            <ArrowDown aria-hidden strokeWidth={1.5} className="size-5" />
            <span className="sr-only">Move {label} later</span>
          </button>
          {!image.isPrimary && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => run(() => setPrimaryImageAction(image.id))}
              className="text-small text-ink-soft hover:text-ink inline-flex min-h-11 items-center gap-1 px-2"
            >
              <Star aria-hidden strokeWidth={1.5} className="size-4" />
              Set as featured
            </button>
          )}
        </div>
        <ConfirmButton
          variant="ghost"
          disabled={disabled}
          title={`Delete ${label}?`}
          description="The photo is removed from the product and the website. This can't be undone."
          onConfirm={() => run(() => deleteImageAction(image.id))}
        >
          Delete
        </ConfirmButton>
      </div>
    </li>
  );
}
