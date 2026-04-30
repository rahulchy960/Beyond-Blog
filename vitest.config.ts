import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./setupTests.ts"],
    globals: true,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    css: false,
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
    exclude: [
      "node_modules/**",
      ".next/**",
      "tests/e2e/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "lib/content/slug.ts",
        "lib/content/schemas.ts",
        "lib/course/schemas.ts",
        "lib/quiz/schemas.ts",
        "lib/interaction/schemas.ts",
        "lib/utils/date.ts",
        "server/api/trpc.ts",
        "components/content/content-card.tsx",
        "components/content/public-content-article.tsx",
        "components/interaction/comment-form.tsx",
        "components/interaction/like-button.tsx",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 65,
        statements: 80,
      },
    },
  },
});
