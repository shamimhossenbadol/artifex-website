import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { FIELD_CLASSES } from "./field-styles";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD_CLASSES, "h-11", className)} {...props} />;
}
