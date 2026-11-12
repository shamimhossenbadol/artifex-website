import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/utils";

type ContainerProps<T extends ElementType> = { as?: T } & Omit<ComponentProps<T>, "as">;

/** Site container: max 1360 px with 16/24/40 px side padding (03 §3). */
export function Container<T extends ElementType = "div">({
  as,
  className,
  ...props
}: ContainerProps<T>) {
  const Component: ElementType = as ?? "div";
  return <Component className={cn("container-site", className)} {...props} />;
}
