"use client";
// Category list (07 §3.3): order (move up/down), Active / Show on home switches, product count,
// edit, and delete (only when the category is empty).
import { ArrowDown, ArrowUp, ImageOff, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import type { CategoryFlag } from "@/lib/validation/category";
import {
  deleteCategoryAction,
  moveCategoryAction,
  toggleCategoryFlagAction,
} from "@/server/actions/category.actions";
import type { AdminCategoryVM } from "@/server/services/category-admin.service";
import { ConfirmButton } from "../ConfirmButton";
import { useToast } from "../Toaster";

const ICON_BUTTON =
  "text-ink-soft hover:text-ink inline-flex size-11 items-center justify-center disabled:opacity-30";

export function CategoryList({ categories }: { categories: AdminCategoryVM[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

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

  if (categories.length === 0) {
    return <p className="text-muted">No categories yet. Create one to start adding products.</p>;
  }

  return (
    <ol className="flex flex-col gap-3" aria-busy={pending}>
      {categories.map((category, index) => (
        <li
          key={category.id}
          className="border-line flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="bg-sand relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-sm">
              {category.imagePath ? (
                <Image
                  src={category.imagePath}
                  alt=""
                  fill
                  sizes="3.5rem"
                  className="object-cover"
                />
              ) : (
                <ImageOff
                  aria-hidden
                  strokeWidth={1.5}
                  className="text-muted absolute inset-0 m-auto size-5"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-ink truncate font-medium">{category.name}</p>
              <p className="text-small text-muted truncate">
                /categories/{category.slug} · {category.productCount} product
                {category.productCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <FlagSwitch
              category={category}
              flag="isActive"
              label="Active"
              disabled={pending}
              onChange={(value) =>
                run(() => toggleCategoryFlagAction(category.id, "isActive", value))
              }
            />
            <FlagSwitch
              category={category}
              flag="showOnHome"
              label="On home"
              disabled={pending}
              onChange={(value) =>
                run(() => toggleCategoryFlagAction(category.id, "showOnHome", value))
              }
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pending || index === 0}
              onClick={() => run(() => moveCategoryAction(category.id, "up"))}
              className={ICON_BUTTON}
            >
              <ArrowUp aria-hidden strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Move “{category.name}” up</span>
            </button>
            <button
              type="button"
              disabled={pending || index === categories.length - 1}
              onClick={() => run(() => moveCategoryAction(category.id, "down"))}
              className={ICON_BUTTON}
            >
              <ArrowDown aria-hidden strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Move “{category.name}” down</span>
            </button>
            <Link href={`/admin/categories/${category.id}`} className={ICON_BUTTON}>
              <Pencil aria-hidden strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Edit “{category.name}”</span>
            </Link>
            {category.productCount === 0 ? (
              <ConfirmButton
                variant="ghost"
                disabled={pending}
                title={`Delete “${category.name}”?`}
                description="The category and its image are removed from the website. This can't be undone."
                onConfirm={() => run(() => deleteCategoryAction(category.id))}
              >
                Delete
              </ConfirmButton>
            ) : (
              <Link
                href={`/admin/products?category=${category.slug}`}
                className="text-small text-ink-soft hover:text-ink px-2 underline underline-offset-4"
                title="Categories with products can't be deleted. Move or delete the products first."
              >
                View products
              </Link>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function FlagSwitch({
  category,
  flag,
  label,
  disabled,
  onChange,
}: {
  category: AdminCategoryVM;
  flag: CategoryFlag;
  label: string;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="text-small text-ink-soft flex min-h-11 cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={category[flag]}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={`${label}: ${category.name}`}
        className="accent-ink size-4"
      />
      <span aria-hidden>{label}</span>
    </label>
  );
}
