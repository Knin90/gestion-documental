import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["app/actions/**"],
    },
  },
});