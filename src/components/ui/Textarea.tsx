import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { FIELD_CLASSES } from "./field-styles";

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={cn(FIELD_CLASSES, "py-2.5", className)} {...props} />;
}
