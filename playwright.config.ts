import { PlaywrightTestConfig } from '@playwright/test';
import {resolve} from "path";

const baseUrl = new URL('http://localhost:4200');

const config: PlaywrightTestConfig = {
  testDir: resolve(__dirname, './playwright/tests'),
  globalSetup: resolve(__dirname, './playwright/global-setup.ts'),
  globalTeardown: resolve(__dirname, './playwright/global-teardown.ts'),
  reporter: [
    [ process.env.CI ? 'github' : 'line' ],
  ],
  maxFailures: 1,
  use: {
    baseURL: baseUrl.toString(),
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry'
  },
  webServer: {
    command: `gulp serve`,
    url: baseUrl.toString(),
    cwd: resolve(__dirname),
    ignoreHTTPSErrors: true,
    reuseExistingServer: true,
    timeout: 120000,
  },
};
export default config;
