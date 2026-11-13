"use client";
// Label + control + hint + error (05 §5). The ids reach the control through context, not
// cloneElement: a control passed from a Server Component can arrive as a lazy reference without
// props (seen after client-side navigation, ADR-038), and cloneElement would crash or miss it.
import { createContext, useContext, useId, type ReactNode } from "react";

type FieldControlContext = {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
};

const FieldContext = createContext<FieldControlContext | null>(null);

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
};

/**
 * For Input, Textarea, Select and other field controls: fills in id, aria-describedby and
 * aria-invalid from the surrounding <Field>. Explicit props win.
 */
export function useFieldControl<P extends ControlProps>(props: P): P {
  const field = useContext(FieldContext);
  if (!field) return props;
  return {
    ...props,
    id: props.id ?? field.id,
    "aria-describedby": props["aria-describedby"] ?? field.describedBy,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid ? true : undefined),
  };
}

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Use a fixed id for the control (e.g. to link to it); otherwise one is generated. */
  id?: string;
  /** One control (Input, Textarea, Select, MarkdownEditor) that reads its ids via useFieldControl. */
  children?: ReactNode;
};

/** Label above the control, optional hint, and an error linked via aria-describedby (05 §5). */
export function Field({ label, hint, error, id: fixedId, children }: FieldProps) {
  const generatedId = useId();
  const id = fixedId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small text-ink-soft font-medium">
        {label}
      </label>
      <FieldContext value={{ id, describedBy, invalid: Boolean(error) }}>{children}</FieldContext>
      {hint && (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-small text-danger" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
