import { cloneElement, useId, type ReactElement, type ReactNode } from "react";

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** A single Input, Textarea or Select. Field wires up id, aria-describedby and aria-invalid. */
  children: ReactElement<FieldControlProps>;
};

/** Label above the control, optional hint, and an error linked via aria-describedby (05 §5). */
export function Field({ label, hint, error, children }: FieldProps) {
  const generatedId = useId();
  const id = children.props.id ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small text-ink-soft font-medium">
        {label}
      </label>
      {cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
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
