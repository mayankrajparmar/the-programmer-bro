import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Unit tests live next to the code they test. Browser tests live in e2e/ (Playwright).
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    // Node by default; component tests opt into jsdom with a `// @vitest-environment jsdom` comment.
    environment: "node",
    restoreMocks: true,
  },
});
