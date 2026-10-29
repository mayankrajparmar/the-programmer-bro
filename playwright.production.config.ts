import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

const PORT = 3001;

/**
 * Browser tests for the production build, before launch: `VERCEL_ENV=production npm run build`,
 * then `npm run test:e2e:production`. Checks the launch switch shows only the coming-soon page.
 */
export default defineConfig({
  ...base,
  testDir: "./e2e/production",
  testIgnore: [],
  use: { ...base.use, baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
