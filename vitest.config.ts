import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "app/features/player/**/*.test.{ts,tsx}",
      "app/features/player/**/__tests__/**/*.test.ts",
      "app/watch/**/*.test.ts",
      "app/lib/tv/**/*.test.ts",
      "app/components/tv/**/*.test.{ts,tsx}",
      "app/components/catalog/**/*.test.{ts,tsx}",
      "app/components/content/**/*.test.{ts,tsx}",
      "app/components/reviews/**/*.test.{ts,tsx}",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
