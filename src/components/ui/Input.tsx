"use client";
// Client component so it can read its label/hint ids from <Field> (ADR-038). Tiny: no state.
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useFieldControl } from "./Field";
import { FIELD_CLASSES } from "./field-styles";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD_CLASSES, "h-11", className)} {...useFieldControl(props)} />;
}
