import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClasses, type ButtonStyleProps } from "./button-styles";

type ButtonLinkProps = Omit<ComponentProps<"a">, "href"> &
  ButtonStyleProps & {
    href: string;
    /** Opens in a new tab with rel="noopener noreferrer" (WhatsApp, maps, social). */
    external?: boolean;
  };

/** A link styled as a button: next/link for internal routes, a plain <a> for external URLs. */
export function ButtonLink({
  href,
  external = false,
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonLinkProps) {
  const classes = buttonClasses({ variant, size, fullWidth, className });
  if (external || /^(https?:|tel:|mailto:)/.test(href)) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      />
    );
  }
  return <Link href={href} className={classes} {...props} />;
}
