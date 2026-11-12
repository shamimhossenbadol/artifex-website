"use client";
// "Copy link" for Journal posts. Falls back to selecting a prompt when the Clipboard API is blocked.
import { Check, Link2 } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this link:", url);
        }
      }}
    >
      {copied ? (
        <Check aria-hidden strokeWidth={1.5} className="size-4" />
      ) : (
        <Link2 aria-hidden strokeWidth={1.5} className="size-4" />
      )}
      <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
    </button>
  );
}
