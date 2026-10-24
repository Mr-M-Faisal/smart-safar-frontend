const { defineConfig, devices } = require('@playwright/test');

const isCI = Boolean(process.env.CI);
const port = process.env.PLAYWRIGHT_PORT || '3000';

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1280, height: 800 } } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'], channel: 'chrome' } },
    { name: 'iphone-14', use: { ...devices['iPhone 14'], browserName: 'chromium', channel: 'chrome' } },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.smartsafar.invalid' },
  },
});
