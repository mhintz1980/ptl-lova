import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';
const webServer = process.env.CI
  ? {
      command: 'pnpm preview --host --port 5173',
      port: 5173,
      reuseExistingServer: false,
    }
  : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL, // matches your running dev server; override with PLAYWRIGHT_TEST_BASE_URL
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],

  // Enable preview server in CI so Playwright has a target to hit.
  webServer,
});
