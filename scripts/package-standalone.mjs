#!/usr/bin/env node
// Assembles the deploy bundle from `next build` output (10 §3, ADR-002).
// Output: deploy/artifex-app/ (what gets rsynced to the server) + deploy/artifex-<version>.tar.gz
// Run on Linux for real deploys (native modules such as sharp must be Linux builds).
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");
const deployDir = join(root, "deploy");
const appDir = join(deployDir, "artifex-app");

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

if (!existsSync(join(standalone, "server.js"))) {
  fail("No .next/standalone/server.js. Run `npm run build` first (output: 'standalone').");
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
let gitSha = "unknown";
try {
  gitSha = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  // not a git checkout (e.g. local zip build); keep "unknown"
}

rmSync(deployDir, { recursive: true, force: true });
mkdirSync(deployDir, { recursive: true });

// 1. Traced server + node_modules. dereference: copy real files, never symlinks/junctions.
//    Turbopack's hashed aliases in .next/node_modules are handled separately in step 1b.
const aliasSrcRoot = join(standalone, ".next", "node_modules");
cpSync(standalone, appDir, {
  recursive: true,
  dereference: true,
  filter: (src) => !src.startsWith(aliasSrcRoot),
});

// 1b. Turbopack refers to server-external packages (e.g. Prisma) through hashed aliases such as
//     .next/node_modules/@prisma/client-2c3a283f134fdcb6, created as symlinks with ABSOLUTE paths
//     to the build machine. Those break on the server (white page, "Cannot find module"). Recreate
//     each alias as a RELATIVE symlink to the real package in the bundle's node_modules, or as a
//     copy where symlinks aren't allowed (Windows without Developer Mode).
const aliases = [];
if (existsSync(aliasSrcRoot)) {
  for (const entry of readdirSync(aliasSrcRoot)) {
    const names = entry.startsWith("@")
      ? readdirSync(join(aliasSrcRoot, entry)).map((n) => `${entry}/${n}`)
      : [entry];
    for (const alias of names) {
      const target = alias.replace(/-[0-9a-f]{8,}$/, "");
      if (target === alias) fail(`Unexpected entry in .next/node_modules: ${alias}`);
      const realPkg = join(appDir, "node_modules", target);
      if (!existsSync(join(realPkg, "package.json"))) {
        fail(`Alias ${alias} points to ${target}, which is missing from the bundle.`);
      }
      const linkPath = join(appDir, ".next", "node_modules", alias);
      mkdirSync(dirname(linkPath), { recursive: true });
      try {
        symlinkSync(relative(dirname(linkPath), realPkg), linkPath, "dir");
      } catch {
        cpSync(realPkg, linkPath, { recursive: true, dereference: true });
      }
      aliases.push({ alias, target });
    }
  }
}

// 1c. Prove each alias resolves exactly like the server will (from the server chunks folder).
const probe = createRequire(join(appDir, ".next", "server", "chunks", "ssr", "probe.js"));
for (const { alias, target } of aliases) {
  try {
    probe.resolve(`${alias}/package.json`);
  } catch (err) {
    fail(`Alias ${alias} → ${target} does not resolve in the bundle: ${err.message}`);
  }
  console.log(`✔ Alias ${alias} → node_modules/${target}`);
}
// 2. Static assets and /public are not copied by Next; server.js serves them from here.
cpSync(join(root, ".next", "static"), join(appDir, ".next", "static"), { recursive: true });
if (existsSync(join(root, "public"))) {
  cpSync(join(root, "public"), join(appDir, "public"), { recursive: true });
}

// 3. Never ship env files: secrets live in cPanel env vars only (09 §8).
for (const name of readdirSync(appDir)) {
  if (name.startsWith(".env")) rmSync(join(appDir, name), { force: true });
}

// 4. Minimal package.json with no dependencies, so a stray "Run NPM Install" in cPanel is a no-op.
writeFileSync(
  join(appDir, "package.json"),
  `${JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      private: true,
      engines: pkg.engines,
      scripts: { start: "node server.js" },
      dependencies: {},
    },
    null,
    2,
  )}\n`,
);

// 5. Passenger restarts the app when tmp/restart.txt is touched.
mkdirSync(join(appDir, "tmp"), { recursive: true });

// 6. Native modules must be in the bundle (10 §3). sharp joins the deps in Phase 3.
for (const nativeDep of ["sharp"]) {
  if (pkg.dependencies?.[nativeDep] && !existsSync(join(appDir, "node_modules", nativeDep))) {
    fail(`${nativeDep} is a dependency but missing from the standalone trace.`);
  }
}

writeFileSync(
  join(appDir, "BUILD_INFO.json"),
  `${JSON.stringify(
    {
      version: pkg.version,
      git: gitSha,
      builtAt: new Date().toISOString(),
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
    },
    null,
    2,
  )}\n`,
);

// Relative paths only: GNU tar reads "E:\..." as a remote host on Windows.
const archiveName = `artifex-${pkg.version}-${gitSha}.tar.gz`;
const archive = join(deployDir, archiveName);
execFileSync("tar", ["-czf", archiveName, "artifex-app"], { cwd: deployDir, stdio: "inherit" });

console.log(`✔ Bundle ready: ${appDir}`);
console.log(`✔ Archive:      ${archive}`);
if (process.platform !== "linux") {
  console.warn(
    "⚠ Built on a non-Linux machine: fine for testing, but deploy bundles from CI/WSL only.",
  );
}
