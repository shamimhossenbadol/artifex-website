// Runs once when the server starts (before it handles requests). Validates the environment so a
// misconfigured cPanel app fails at boot with a clear message in stderr.log (02 §7).
export async function register(): Promise<void> {
  // Skip during `next build`: CI only has the NEXT_PUBLIC_* values, not runtime secrets.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  // Node-only code lives in its own module so it is never bundled for the Edge runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnvOrExit } = await import("./instrumentation-node");
    validateEnvOrExit();
  }
}
