"use client";
// Client component so it can read its label/hint ids from <Field> (ADR-038). Tiny: no state.
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useFieldControl } from "./Field";
import { FIELD_CLASSES } from "./field-styles";

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(FIELD_CLASSES, "py-2.5", className)}
      {...useFieldControl(props)}
    />
  );
}
