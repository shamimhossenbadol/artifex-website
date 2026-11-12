import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/env";

const valid = {
  NODE_ENV: "production",
  DATABASE_URL: "mysql://user:pass@localhost:3306/artifex",
  AUTH_SECRET: "x".repeat(48),
  NEXT_PUBLIC_SITE_URL: "https://artifexfurniture.com/",
  NEXT_PUBLIC_MEDIA_URL: "https://media.artifexfurniture.com",
};

describe("parseServerEnv", () => {
  it("accepts a valid environment and trims trailing slashes from URLs", () => {
    const env = parseServerEnv(valid);
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://artifexfurniture.com");
    expect(env.R2_BUCKET).toBeUndefined();
  });

  it("treats empty strings as unset", () => {
    expect(parseServerEnv({ ...valid, R2_ACCOUNT_ID: "", R2_BUCKET: "" }).R2_ACCOUNT_ID).toBe(
      undefined,
    );
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => parseServerEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it("rejects a short AUTH_SECRET", () => {
    expect(() => parseServerEnv({ ...valid, AUTH_SECRET: "short" })).toThrow(/AUTH_SECRET/);
  });

  it("rejects a non-MySQL database URL", () => {
    expect(() => parseServerEnv({ ...valid, DATABASE_URL: "postgres://x@y/z" })).toThrow(
      /DATABASE_URL/,
    );
  });
});
