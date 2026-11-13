"use client";
// Row actions on the product list (07 §3.2): duplicate (opens the draft copy) and delete.
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteProductAction, duplicateProductAction } from "@/server/actions/product.actions";
import { ConfirmButton } from "../ConfirmButton";
import { useToast } from "../Toaster";

export function ProductRowActions({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function duplicate() {
    startTransition(async () => {
      try {
        const result = await duplicateProductAction(id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(result.message ?? "Copy created.");
        router.push(`/admin/products/${result.data?.id ?? ""}`);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        const result = await deleteProductAction(id);
        if (!result.ok) toast.error(result.error);
        else toast.success(result.message ?? "Deleted.");
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={duplicate}
        className="text-ink-soft hover:text-ink inline-flex size-11 items-center justify-center disabled:opacity-30"
      >
        <Copy aria-hidden strokeWidth={1.5} className="size-5" />
        <span className="sr-only">Duplicate “{title}”</span>
      </button>
      <ConfirmButton
        variant="ghost"
        disabled={pending}
        title={`Delete “${title}”?`}
        description="The product and all its photos are removed from the website. This can't be undone."
        onConfirm={remove}
      >
        Delete
      </ConfirmButton>
    </>
  );
}
