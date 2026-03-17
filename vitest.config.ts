import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    exclude: ["apps/medusa/**", "node_modules/**"],
    environment: "node",
    globals: true,
    setupFiles: "./vitest.setup.ts",
  },
});
