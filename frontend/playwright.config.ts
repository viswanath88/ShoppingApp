import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // Sequential to avoid shared state conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "html",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command: "cd ../backend && npm run dev",
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "npm run dev",
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
