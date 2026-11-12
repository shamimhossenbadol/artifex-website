// Node.js-only startup checks, imported by instrumentation.ts when NEXT_RUNTIME === "nodejs".
import { serverEnv } from "@/lib/env";

export function validateEnvOrExit(): void {
  try {
    serverEnv();
  } catch (err) {
    console.error("[startup]", err instanceof Error ? err.message : err);
    // Next only logs instrumentation errors and keeps running; exit so Passenger reports the
    // failure instead of serving a half-configured app.
    process.exit(1);
  }
}
