"use client";
// Last-resort error page when the root layout itself fails. It renders its own document and does
// not get globals.css, so it uses a few inline styles with the design-token values.
import { useEffect } from "react";

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#F8F6F2",
          color: "#1C1A17",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <title>Something went wrong | Artifex Furniture</title>
        <main>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500, fontSize: "2rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#4A453F" }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1rem",
              height: "2.75rem",
              padding: "0 1.5rem",
              border: 0,
              borderRadius: 4,
              background: "#1C1A17",
              color: "#F8F6F2",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
