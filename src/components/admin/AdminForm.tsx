"use client";
// Admin form shell (07 §4): runs a Server Action without React's automatic form reset (a failed
// save keeps what was typed), shows a summary + toast, and exposes field errors via context.
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  useTransition,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/action-result";
import {
  NOT_DELIVERED_MESSAGE,
  UPLOAD_QUALITIES,
  prepareFormImages,
  waitBeforeRetry,
} from "@/lib/prepare-upload";
import { FormMessage, fieldError } from "./FormMessage";
import { useToast } from "./Toaster";

/**
 * The slot is rendered by the page, possibly in the same commit as the form (client navigation),
 * so look again on the next frame; after that it doesn't change while the page is open.
 */
const recheckNextFrame = (onChange: () => void) => {
  const frame = requestAnimationFrame(onChange);
  return () => cancelAnimationFrame(frame);
};

type FormState = {
  state: ActionResult<unknown> | null;
  pending: boolean;
  /** For controls that change the form without input events (e.g. adding a row). */
  markDirty: () => void;
};
const FormStateContext = createContext<FormState>({
  state: null,
  pending: false,
  markDirty: () => undefined,
});

export function useAdminFormState(): FormState {
  return useContext(FormStateContext);
}

type AdminFormProps<T> = {
  action: (prev: ActionResult<T> | null, formData: FormData) => Promise<ActionResult<T>>;
  children: ReactNode;
  submitLabel?: string;
  /** After a successful save, go here. "{id}" is replaced with `data.id` when the action returns one. */
  redirectTo?: string;
  className?: string;
  /**
   * Warn before leaving the page with unsaved changes (07 §3.2). Controls inside an element with
   * `data-guard-ignore` (e.g. the photo manager, which saves on its own) don't count.
   */
  guardUnsaved?: boolean;
  /**
   * id of an element elsewhere on the page (e.g. a sticky top bar, see AdminSaveBar) to show the
   * Save button in, so it stays visible (ADR-059). Without it, Save sits in a sticky bottom bar.
   */
  submitSlot?: string;
};

export function AdminForm<T>({
  action,
  children,
  submitLabel = "Save changes",
  redirectTo,
  className,
  guardUnsaved = false,
  submitSlot,
}: AdminFormProps<T>) {
  const formId = useId();
  // The slot element, or null: then Save shows nowhere until the slot appears (or, without
  // submitSlot, in the sticky bottom bar).
  const slot = useSyncExternalStore(
    recheckNextFrame,
    () => (submitSlot ? document.getElementById(submitSlot) : null),
    () => null,
  );
  const [state, setState] = useState<ActionResult<T> | null>(null);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    if (!guardUnsaved || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [guardUnsaved, dirty]);

  function onEdit(event: FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLElement;
    if (!target.closest("[data-guard-ignore]")) setDirty(true);
  }
  const router = useRouter();
  const toast = useToast();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = new FormData(event.currentTarget);
    startTransition(async () => {
      let result: ActionResult<T> | null = null;
      let hadImages = false;
      // Chosen images are shrunk in the browser first. Only forms carrying an image are retried
      // when the request doesn't get through (ADR-058); other saves are never sent twice.
      for (let attempt = 0; attempt < UPLOAD_QUALITIES.length; attempt++) {
        const { formData, hasImages } = await prepareFormImages(raw, UPLOAD_QUALITIES[attempt]);
        hadImages = hasImages;
        try {
          result = await action(null, formData);
          break;
        } catch {
          if (!hasImages || attempt === UPLOAD_QUALITIES.length - 1) break;
          await waitBeforeRetry(1500 * (attempt + 1));
        }
      }
      result ??= {
        ok: false,
        error: hadImages ? NOT_DELIVERED_MESSAGE : "Something went wrong. Please try again.",
      };
      startTransition(() => setState(result));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDirty(false);
      toast.success(result.message ?? "Saved.");
      const id = (result.data as { id?: number } | undefined)?.id;
      if (redirectTo) router.push(redirectTo.replace("{id}", String(id ?? "")));
      else router.refresh();
    });
  }

  // A button outside the <form> element (in the slot) submits it through the form attribute.
  const submitButton = (
    <Button
      type="submit"
      form={formId}
      disabled={pending}
      aria-disabled={pending}
      className={slot ? "shadow-card" : undefined}
    >
      {pending && <Loader2 aria-hidden strokeWidth={1.5} className="size-4 animate-spin" />}
      {pending ? "Saving…" : submitLabel}
    </Button>
  );

  return (
    <FormStateContext value={{ state, pending, markDirty }}>
      <form
        id={formId}
        onSubmit={onSubmit}
        onInput={guardUnsaved ? onEdit : undefined}
        noValidate
        className={className ?? "flex flex-col gap-6"}
      >
        <FormMessage state={state as ActionResult | null} />
        {children}
        {slot ? (
          createPortal(submitButton, slot)
        ) : submitSlot ? null : (
          <div className="border-line bg-bg/85 sticky bottom-0 z-10 -mx-1 flex justify-end border-t px-1 py-3 backdrop-blur-md">
            {submitButton}
          </div>
        )}
      </form>
    </FormStateContext>
  );
}

/** <Field> that picks its error from the surrounding AdminForm by field name. */
export function AdminField({
  name,
  label,
  hint,
  children,
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  children: ComponentProps<typeof Field>["children"];
}) {
  const { state } = useAdminFormState();
  return (
    <Field label={label} hint={hint} error={fieldError(state as ActionResult | null, name)}>
      {children}
    </Field>
  );
}

/** Groups related fields inside a form. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset className="admin-card flex min-w-0 flex-col gap-5 p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden>
        <p className="text-ink text-[15px] font-semibold tracking-tight">{title}</p>
        {description && <p className="text-small text-muted mt-1">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}
