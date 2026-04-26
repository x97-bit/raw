import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false, // Run tests sequentially to avoid database conflicts
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true, // Speeds up local runs if server is already up
    timeout: 120 * 1000,
  },
});
