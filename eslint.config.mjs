import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "apps/medusa/**",
    "debug/**",
    "apps/medusa/src/scripts/**",
    "out/**",
    "build/**",
    "output/**",
    "tmp/**",
    "kill_pg.js",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
