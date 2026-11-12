"use client";
// Sticky header shell: marks itself as scrolled so the bar can shrink and show a border (05 §2).
import { useEffect, useState, type ReactNode } from "react";

export function StickyHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      className="group/header bg-bg data-[scrolled=true]:border-line sticky top-0 z-40 border-b border-transparent transition-colors duration-200"
    >
      {children}
    </header>
  );
}
