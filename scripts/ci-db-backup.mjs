#!/usr/bin/env node
// CI helper (deploy.yml): streams a gzipped mariadb-dump of DATABASE_URL to stdout.
// Runs mariadb-dump in the official MariaDB 11.4 image so the client matches the server.
// The password goes in via MYSQL_PWD, never on the command line or in logs.
import { spawn } from "node:child_process";
import { createGzip } from "node:zlib";

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const url = new URL(raw);
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
const port = url.port || "3306";

const dump = spawn(
  "docker",
  [
    "run",
    "--rm",
    "--network",
    "host",
    "-e",
    "MYSQL_PWD",
    "mariadb:11.4",
    "mariadb-dump",
    `--host=${url.hostname}`,
    `--port=${port}`,
    `--user=${user}`,
    "--single-transaction",
    "--routines",
    "--no-tablespaces",
    database,
  ],
  { env: { ...process.env, MYSQL_PWD: password }, stdio: ["ignore", "pipe", "inherit"] },
);

dump.stdout.pipe(createGzip()).pipe(process.stdout);
dump.on("exit", (code) => {
  if (code !== 0) {
    console.error(`mariadb-dump failed with exit code ${code}`);
    process.exitCode = 1;
  }
});
