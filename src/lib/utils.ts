// Small shared helpers (02 §2).
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Custom type-scale utilities from globals.css. tailwind-merge must know they are font sizes,
 * otherwise `text-h1` and `text-ink` would be treated as conflicting colour classes. */
const TYPE_SCALE = ["display", "h1", "h2", "h3", "eyebrow", "body-lg", "body", "small", "price"];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: TYPE_SCALE }],
    },
  },
});

/** Join conditional class names and resolve Tailwind conflicts (11 §4). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
