// Runs once when the server starts (before it handles requests). Validates the environment so a
// misconfigured cPanel app fails at boot with a clear message in stderr.log (02 §7).
export async function register(): Promise<void> {
  // Skip during `next build`: CI only has the NEXT_PUBLIC_* values, not runtime secrets.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { serverEnv } = await import("@/lib/env");
  try {
    serverEnv();
  } catch (err) {
    console.error("[startup]", err instanceof Error ? err.message : err);
    // Next only logs instrumentation errors and keeps running; exit so Passenger reports the
    // failure instead of serving a half-configured app.
    process.exit(1);
  }
}
