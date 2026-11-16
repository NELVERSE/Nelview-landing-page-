import { defineConfig, devices } from "@playwright/test";

// Browser tests run against the production build in dist/ (`pnpm run build`).
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4174",
    // Animations are covered by motion.spec.ts; everything else runs without them.
    reducedMotion: "reduce",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node tests/e2e/server.mjs",
    url: "http://localhost:4174",
    reuseExistingServer: !process.env.CI,
  },
});
