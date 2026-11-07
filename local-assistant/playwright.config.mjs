import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: true, use: { baseURL: 'http://127.0.0.1:4311', trace: 'retain-on-failure' },
  webServer: { command: 'node tests/serve.mjs', url: 'http://127.0.0.1:4311', reuseExistingServer: false },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  workers: 1,
});
