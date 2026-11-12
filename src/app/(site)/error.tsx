"use client";
// Route error UI for public pages (05 §4). Details stay in the server log; users see a calm message.
import { Home, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";

export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("[site.error]", error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <Container className="flex min-h-[50svh] flex-col items-center justify-center gap-6 py-24 text-center">
      <p className="text-eyebrow text-walnut">Error</p>
      <h1 className="text-h1">Something went wrong</h1>
      <p className="max-w-md">
        Sorry, this page couldn&apos;t be loaded. Please try again in a moment.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>
          <RotateCcw aria-hidden strokeWidth={1.5} className="size-4" />
          Try again
        </Button>
        <ButtonLink href="/" variant="secondary">
          <Home aria-hidden strokeWidth={1.5} className="size-4" />
          Home
        </ButtonLink>
      </div>
      {digest && <p className="text-small text-muted">Reference: {digest}</p>}
    </Container>
  );
}
