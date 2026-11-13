"use client";
// Delete a post from the Journal list (07 §3.4).
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deletePostAction } from "@/server/actions/blog.actions";
import { ConfirmButton } from "../ConfirmButton";
import { useToast } from "../Toaster";

export function PostRowActions({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <ConfirmButton
      variant="ghost"
      disabled={pending}
      title={`Delete “${title}”?`}
      description="The post, its cover and the images inside it are removed from the website. This can't be undone."
      onConfirm={() =>
        startTransition(async () => {
          try {
            const result = await deletePostAction(id);
            if (!result.ok) toast.error(result.error);
            else toast.success(result.message ?? "Deleted.");
          } catch {
            toast.error("Something went wrong. Please try again.");
          }
          router.refresh();
        })
      }
    >
      Delete
    </ConfirmButton>
  );
}
