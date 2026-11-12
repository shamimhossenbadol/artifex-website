import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Prisma may only be imported by the data layer (AGENTS §4.3, 11 §6).
const PRISMA_IMPORT_PATTERNS = [
  {
    group: ["@/generated/prisma", "@/generated/prisma/*", "**/generated/prisma/**"],
    message:
      "Prisma is only allowed in src/server/repositories, src/lib/db.ts and src/lib/prisma.ts.",
  },
  {
    group: ["@/lib/db", "@/lib/prisma"],
    message: "Database access goes through src/server/repositories.",
  },
  {
    group: ["@prisma/client", "@prisma/client/*", "@prisma/adapter-mariadb"],
    message: "Import the generated client via src/lib/prisma.ts instead.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-ignore": "allow-with-description" }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name=/^\$(queryRawUnsafe|executeRawUnsafe)$/]",
          message: "Unsafe raw queries are banned. Use the Prisma API or tagged $queryRaw.",
        },
      ],
      "no-restricted-imports": ["error", { patterns: PRISMA_IMPORT_PATTERNS }],
    },
  },
  {
    // The data layer and tooling are the only places allowed to touch Prisma.
    files: [
      "src/server/repositories/**",
      "src/lib/db.ts",
      "src/lib/prisma.ts",
      "prisma/**",
      "scripts/**",
      "tests/**",
    ],
    rules: { "no-restricted-imports": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "deploy/**",
    "next-env.d.ts",
    "src/generated/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
