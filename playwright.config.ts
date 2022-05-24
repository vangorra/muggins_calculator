import { PlaywrightTestConfig } from '@playwright/test';
import path from 'path';

const baseUrl = new URL('http://localhost:4200');

const config: PlaywrightTestConfig = {
  testDir: path.resolve(__dirname, './playwright/tests'),
  globalSetup: path.resolve(__dirname, './playwright/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, './playwright/global-teardown.ts'),
  reporter: [[process.env.CI ? 'github' : 'line']],
  maxFailures: 1,
  use: {
    baseURL: baseUrl.toString(),
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
  },
  webServer: {
    command: `gulp serve`,
    url: baseUrl.toString(),
    cwd: path.resolve(__dirname),
    ignoreHTTPSErrors: true,
    reuseExistingServer: true,
    timeout: 120000,
  },
};
export default config;
