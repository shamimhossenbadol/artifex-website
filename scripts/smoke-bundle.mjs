#!/usr/bin/env node
// CI guard (ci.yml): boots the packaged deploy bundle (deploy/artifex-app/server.js) exactly as
// Passenger will, then checks that "/" returns a complete page with database-backed content.
// Catches bundle-only failures that `next start` can't, e.g. missing Turbopack aliases (ADR-023).
// Usage: node scripts/smoke-bundle.mjs [expectedText...]   (env: DATABASE_URL, AUTH_SECRET, …)
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const port = Number(process.env.SMOKE_PORT ?? 3300);
const expected = process.argv.slice(2);
const child = spawn(process.execPath, ["server.js"], {
  cwd: "deploy/artifex-app",
  env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1", NODE_ENV: "production" },
});
let log = "";
child.stdout.on("data", (d) => (log += d));
child.stderr.on("data", (d) => (log += d));

const problems = [];
try {
  let res;
  for (let i = 0; i < 60 && !res; i++) {
    try {
      res = await fetch(`http://127.0.0.1:${port}/`);
    } catch {
      await sleep(500);
    }
  }
  if (!res) {
    problems.push("server did not start");
  } else {
    const html = await res.text();
    console.log(`GET / → HTTP ${res.status}, ${html.length} bytes`);
    if (res.status !== 200) problems.push(`status ${res.status}`);
    if (!html.includes("</html>")) problems.push("incomplete HTML (no </html>)");
    for (const text of expected) {
      if (!html.includes(text)) problems.push(`missing expected text: ${text}`);
    }
  }
  const errors = log.split("\n").filter((l) => /Cannot find module|failed to pipe|⨯/.test(l));
  if (errors.length) problems.push(`server errors:\n${errors.slice(0, 5).join("\n")}`);
} finally {
  child.kill();
}

if (problems.length) {
  console.error(`✖ Bundle smoke test failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("✔ Bundle smoke test passed");
