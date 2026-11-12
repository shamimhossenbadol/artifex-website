import type { ComponentProps } from "react";
import { buttonClasses, type ButtonStyleProps } from "./button-styles";

type ButtonProps = ComponentProps<"button"> & ButtonStyleProps;

/** A real <button>. For navigation use ButtonLink. */
export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
