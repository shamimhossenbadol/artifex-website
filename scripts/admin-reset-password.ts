// Admin password reset CLI (07 §1, 10 §8). Lockout recovery without an email flow.
//
// Run from a developer machine against the target DB (through the SSH tunnel, ADR-017):
//   DATABASE_URL="mysql://user:pass@127.0.0.1:3307/db" npm run admin:reset-password -- --email you@example.com
//
// Prompts for a new password (not echoed), applies the 07 §1 rules, sets mustChangePassword = true
// (the admin picks their own password at next sign-in) and bumps sessionVersion (signs out every
// device). Also clears the login lockout for that email.
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { hashPassword, validateNewPassword } from "../src/lib/auth/password";
import { emailKey } from "../src/lib/auth/rules";
import { createPrismaClient } from "../src/lib/prisma";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Reads a line without echoing it (for passwords). */
function askHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function main(): Promise<void> {
  const email = arg("email")?.trim().toLowerCase();
  const url = process.env.DATABASE_URL;
  if (!email || !url) {
    console.error("Usage: DATABASE_URL=… npm run admin:reset-password -- --email <admin email>");
    process.exitCode = 1;
    return;
  }

  const db = createPrismaClient(url, 1);
  try {
    const admin = await db.adminUser.findUnique({ where: { email }, select: { id: true } });
    if (!admin) {
      console.error(`No admin with the email ${email}.`);
      process.exitCode = 1;
      return;
    }
    const password = await askHidden("New temporary password: ");
    const problem = validateNewPassword(password, { email });
    if (problem) {
      console.error(problem);
      process.exitCode = 1;
      return;
    }
    if ((await askHidden("Repeat it: ")) !== password) {
      console.error("The passwords don't match.");
      process.exitCode = 1;
      return;
    }
    await db.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
        sessionVersion: { increment: 1 },
      },
    });
    await db.loginAttempt.deleteMany({ where: { key: emailKey(email), success: false } });
    console.log(
      `Password reset for ${email}. All devices are signed out; a new password must be chosen at next sign-in.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("[admin-reset-password]", err);
  process.exitCode = 1;
});
