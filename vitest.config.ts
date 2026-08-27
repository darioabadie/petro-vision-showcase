import { defineConfig } from "vitest/config";

// Config standalone de vitest para las libs puras.
// No toca el vite.config.ts de Lovable (evita conflictos de plugins).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});