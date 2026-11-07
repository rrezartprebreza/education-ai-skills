import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4337', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run preview -- --port 4337 --ignore-lock',
    url: 'http://127.0.0.1:4337/education-ai-skills/',
    reuseExistingServer: false,
    env: { ASTRO_TELEMETRY_DISABLED: '1' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
});
