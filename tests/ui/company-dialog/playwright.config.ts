import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "../../../test-results/company-dialog",
  reporter: "list",
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:8091",
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx vite --config tests/ui/company-dialog/vite.config.mts",
    cwd: "../../..",
    url: "http://127.0.0.1:8091",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
