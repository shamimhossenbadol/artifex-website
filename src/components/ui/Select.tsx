"use client";
// A client component on purpose: <Field> (client) wires id/aria props with cloneElement. A server
// component arrives already rendered, so those props would land on the wrapper <div> and the
// label wouldn't reach the <select>. Not used on public pages, so no public JS cost.
import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { FIELD_CLASSES } from "./field-styles";

/** Native <select> with a Lucide chevron. */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(FIELD_CLASSES, "h-11 appearance-none pr-10", className)} {...props}>
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
