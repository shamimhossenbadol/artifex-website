"use client";
// Submit button that shows a pending state while its form's Server Action runs (05 §1).
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import type { ButtonStyleProps } from "@/components/ui/button-styles";

export function SubmitButton({
  children,
  pendingText,
  ...style
}: ButtonStyleProps & { children: ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} {...style}>
      {pending && <Loader2 aria-hidden strokeWidth={1.5} className="size-4 animate-spin" />}
      {pending ? (pendingText ?? "Saving…") : children}
    </Button>
  );
}
