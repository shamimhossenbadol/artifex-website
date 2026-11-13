"use client";
// Client component so it can read its label/hint ids from <Field> (ADR-038).
import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useFieldControl } from "./Field";
import { FIELD_CLASSES } from "./field-styles";

/** Native <select> with a Lucide chevron. */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(FIELD_CLASSES, "h-11 appearance-none pr-10", className)}
        {...useFieldControl(props)}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        strokeWidth={1.5}
        className="text-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  );
}
