"use client";
// Destructive actions ask first, naming the item (07 §4). Native modal <dialog>: focus trap + Esc.
import { useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { ButtonStyleProps } from "@/components/ui/button-styles";

type ConfirmButtonProps = ButtonStyleProps & {
  /** The trigger's label, e.g. "Delete". */
  children: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
};

export function ConfirmButton({
  children,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  disabled,
  ...style
}: ConfirmButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <>
      <Button {...style} disabled={disabled} onClick={() => dialogRef.current?.showModal()}>
        {children}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="bg-surface backdrop:bg-ink/40 m-auto w-[min(26rem,calc(100vw-2rem))] rounded-md p-6"
      >
        <h2 id={titleId} className="text-h3">
          {title}
        </h2>
        <div className="text-ink-soft mt-3">{description}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
            Cancel
          </Button>
          <Button
            className="bg-danger hover:bg-danger/90"
            onClick={async () => {
              dialogRef.current?.close();
              await onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
