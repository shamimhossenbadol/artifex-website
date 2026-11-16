import type { ReactNode } from "react";

/**
 * Re-mounts on every admin navigation, so each page fades up as it arrives (ADR-055). CSS only;
 * switched off under prefers-reduced-motion.
 */
export default function AdminPanelTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-admin-page">{children}</div>;
}
