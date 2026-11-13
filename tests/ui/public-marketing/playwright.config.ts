import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "../../../test-results/public-marketing",
  reporter: "list",
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:8092",
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx vite --config tests/ui/public-marketing/vite.config.mts",
    cwd: "../../..",
    url: "http://127.0.0.1:8092",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
