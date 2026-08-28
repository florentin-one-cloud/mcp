import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    workspace: [
      {
        root: "./src/kette",
        extends: "./src/kette/vitest.config.ts",
        test: {
          name: "unit",
          testTimeout: 10000,
          include: ["__tests__/unit/**"]
        }
      },
      {
        root: "./src/kette",
        extends: "./src/kette/vitest.config.ts",
        test: {
          name: "integration",
          testTimeout: 60000,
          include: ["__tests__/integration/**"],
          exclude: ["node_modules"]
        }
      },
      {
        root: "./src/kette",
        extends: "./src/kette/vitest.config.ts",
        test: {
          name: "e2e",
          include: ["__tests__/e2e/**"],
          exclude: ["node_modules"]
        }
      }
    ]
  }
});
