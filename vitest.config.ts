import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    exclude: [
      "apps/medusa/**",
      "node_modules/**",
      "tests/e2e/**",
      "playwright.config.ts",
      "playwright-report/**",
      "test-results/**",
    ],
    environment: "node",
    globals: true,
    setupFiles: "./vitest.setup.ts",
  },
});
