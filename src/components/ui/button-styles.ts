// Shared Button/ButtonLink styling (03 §5). A typed variant map, no styling library (11 §4).
import { cn } from "@/lib/utils";

export const BUTTON_VARIANTS = {
  primary: "bg-ink text-bg hover:bg-ink-soft",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-bg",
  ghost: "px-0 text-ink underline-offset-4 hover:underline",
  whatsapp: "bg-whatsapp-dark text-white hover:bg-ink",
} as const;

export const BUTTON_SIZES = {
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-[15px]",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

export type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonStyleProps & { className?: string }): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-sans font-medium tracking-button whitespace-nowrap",
    "transition-colors duration-200 ease-out focus-visible:focus-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    BUTTON_SIZES[size],
    BUTTON_VARIANTS[variant],
    fullWidth && "w-full",
    className,
  );
}
