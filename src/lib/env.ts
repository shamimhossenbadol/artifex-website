// Zod-validated environment variables (02 §7, 09 §8). Server code reads env only through here.
import { z } from "zod";

const mysqlUrl = z
  .string()
  .min(1, "is required")
  .refine((v) => /^(mysql|mariadb):\/\//.test(v), "must start with mysql:// or mariadb://");

const absoluteHttpUrl = z.url({ protocol: /^https?$/ }).transform((v) => v.replace(/\/+$/, ""));

/** Variables that are inlined into the client bundle at build time (validated here for the server). */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: absoluteHttpUrl,
  NEXT_PUBLIC_MEDIA_URL: absoluteHttpUrl,
});

/** Variables the running server needs. The app refuses to start without them. */
const serverSchema = publicSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: mysqlUrl,
  AUTH_SECRET: z.string().min(32, "must be at least 32 characters (openssl rand -base64 48)"),
  // Seed only: removed from the environment after the first login (09 §8).
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_INITIAL_PASSWORD: z.string().min(12).optional(),
  // Cloudflare R2 (ADR-014). Optional here: the storage module validates them on first use, so
  // a missing R2 setup only breaks uploads, not the whole site.
  R2_ACCOUNT_ID: z
    .string()
    .regex(/^[0-9a-f]{32}$/, "must be the 32-char account ID")
    .optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(3).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  // Treat empty strings (e.g. `R2_BUCKET=""` copied from .env.example) as unset.
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== ""));
  const result = serverSchema.safeParse(cleaned);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${formatIssues(result.error)}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

/** Test hook: re-read process.env on the next serverEnv() call. */
export function resetServerEnvForTests(): void {
  cached = undefined;
}

/** Parsed server env, validated once per process. Throws with a readable list of problems. */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
